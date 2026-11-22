import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Plugin } from 'vite'

type Attributes = Readonly<Record<string, string>>

const root = fileURLToPath(new URL('.', import.meta.url))

const folders = readdirSync(root, { withFileTypes: true })
	.filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
	.map(entry => entry.name)

const plugins = import.meta.glob<{ default: () => Plugin }>('./*/plugin.ts')
const sassConfigs = import.meta.glob<{ default: string }>('./*/sass.ts')
const attributeModules = import.meta.glob<Record<string, Attributes>>(
	'./*/lib/*Attribute.ts',
)

const loadEach = async <T>(file: string, modules: Record<string, () => Promise<T>>) =>
	(
		await Promise.all(
			folders.map(
				async name => [name, await modules[`./${name}/${file}`]?.()] as const,
			),
		)
	).flatMap(([name, module]) => (module ? [[name, module] as const] : []))

export const servicePlugins: Plugin[] = (await loadEach('plugin.ts', plugins)).map(
	([, module]) => module.default(),
)

export const serviceSassConfig: Record<string, string> = Object.fromEntries(
	(await loadEach('sass.ts', sassConfigs)).map(([name, module]) => [
		name,
		module.default,
	]),
)

const attributesOf = async (name: string): Promise<Attributes> => {
	const files = await Promise.all(
		Object.entries(attributeModules)
			.filter(([path]) => path.startsWith(`./${name}/lib/`))
			.map(([, load]) => load()),
	)
	return Object.assign({}, ...files.flatMap(exports => Object.values(exports)))
}

const attributes = await Promise.all(
	folders.map(async name => [name, await attributesOf(name)] as const),
)

export const serviceDataAttributes: string[] = attributes.flatMap(([, map]) =>
	Object.values(map),
)

const sassEntry = (name: string) => join(root, name, 'index.scss')

const sassServices = folders.filter(name => existsSync(sassEntry(name)))

const mixinsOf = (name: string) =>
	readdirSync(join(root, name))
		.filter(file => file.endsWith('.scss'))
		.flatMap(file =>
			[
				...readFileSync(join(root, name, file), 'utf8').matchAll(
					/@mixin\s+([a-z][\w-]*)/gi,
				),
			]
				.map(match => match[1] ?? '')
				.filter(mixin => !mixin.startsWith('-')),
		)

const sassList = (values: readonly string[]) => values.map(value => `${value},`).join(' ')

const sassAttributes = attributes
	.map(
		([name, map]) =>
			`\t${name}: (${sassList(Object.entries(map).map(([key, value]) => `'${key}': '${value}'`))}),`,
	)
	.join('\n')

const sassModules = sassServices
	.map(
		name =>
			`\t${name}: (function: meta.module-functions(${name}), mixin: meta.module-mixins(${name}), variable: meta.module-variables(${name})),`,
	)
	.join('\n')

const contentBranches = sassServices
	.flatMap(name =>
		[...new Set(mixinsOf(name))].map(
			mixin => `\t\t} @else if $service == ${name} and $name == ${mixin} {
			@include ${name}.${mixin}($args...) {
				@content;
			}`,
		),
	)
	.join('\n')

const sassProxy = `@use 'sass:list';
@use 'sass:map';
@use 'sass:meta';
${sassServices.map(name => `@use 'service:${name}' as ${name};`).join('\n')}

$-services: (${sassList(folders)});
$-attributes: (
${sassAttributes}
);
$-modules: (
${sassModules}
);

@function on($service) {
	@return list.index($-services, $service) != null;
}

@function attribute($service, $key) {
	@if not on($service) {
		@return null;
	}
	@if not map.has-key($-attributes, $service, $key) {
		@error 'The #{$service} service has no attribute \`#{$key}\`.';
	}
	@return map.get($-attributes, $service, $key);
}

@function -member($service, $kind, $name) {
	@if not map.has-key($-modules, $service, $kind, $name) {
		@error 'The #{$service} service has no #{$kind} \`#{$name}\`.';
	}
	@return map.get($-modules, $service, $kind, $name);
}

@function call($service, $name, $args...) {
	@if not on($service) {
		@return null;
	}
	@return meta.call(-member($service, function, $name), $args...);
}

@function variable($service, $name) {
	@if not on($service) {
		@return null;
	}
	@return -member($service, variable, $name);
}

@mixin include($service, $name, $args...) {
	@if on($service) {
		$mixin: -member($service, mixin, $name);
		@if not meta.accepts-content($mixin) {
			@include meta.apply($mixin, $args...);
${contentBranches}
		} @else {
			@error 'The #{$service} service has no mixin \`#{$name}\` that takes content.';
			@content;
		}
	}
}
`

export const serviceSassImporters = [
	{
		findFileUrl(url: string) {
			const name = url.startsWith('service:') ? url.slice('service:'.length) : ''
			return sassServices.includes(name) ? pathToFileURL(sassEntry(name)) : null
		},
	},
	{
		nonCanonicalScheme: 'services',
		canonicalize(url: string) {
			return url === 'services:proxy' ? new URL('services-proxy:all') : null
		},
		load() {
			return { contents: sassProxy, syntax: 'scss' as const }
		},
	},
]
