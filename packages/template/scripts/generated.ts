import { existsSync, readFileSync } from 'node:fs'
import { photoFiles } from '@blocks/photo/lib/photoFiles.ts'
import { iconFiles } from '@primitives/icon/lib/iconFiles.ts'
import { textFiles } from '@primitives/text/lib/generate.ts'

export type Generated = { path: string; source: string; content: string }

export type Generator = { fix: string; files: (root: string) => Generated[] }

export const generators = {
	icon: { fix: 'lift components primitives icon sync', files: iconFiles },
	photo: { fix: 'lift components blocks photo sync', files: photoFiles },
	text: { fix: 'lift components primitives text sync', files: textFiles },
} satisfies Record<string, Generator>

const current = (path: string) =>
	existsSync(path) ? readFileSync(path, 'utf8').replaceAll('\r\n', '\n') : null

export const staleFiles = (root: string, generator: Generator) =>
	generator.files(root).filter(file => current(file.path) !== file.content)
