import { fileURLToPath } from 'node:url'
import * as api from '../../conventions/api/index.ts'
import type { ProjectConfig } from '../types.ts'

export const types = fileURLToPath(new URL('./lift.d.ts', import.meta.url))

export const config = ({ contract: _contract, ...rest }: Lift.Config): ProjectConfig =>
	rest

export const conventions: Lift.Conventions = {
	conventions: api.conventions,
	check: api.check,
	each: api.each,
	when: api.when,
	unless: api.unless,
	preset: api.preset,
	allowedItems: api.allowedItems,
	requiredItems: api.requiredItems,
	declares: api.declares,
	declaresType: api.declaresType,
	typeIncludes: api.typeIncludes,
	reexports: api.reexports,
	imports: api.imports,
	endsWith: api.endsWith,
	extendsClass: api.extendsClass,
	parses: api.parses,
	singleRoot: api.singleRoot,
	rootTag: api.rootTag,
	rootSpreads: api.rootSpreads,
	rootClassList: api.rootClassList,
	rootWithout: api.rootWithout,
	attribute: api.attribute,
	spreads: api.spreads,
	parseExpression: api.parseExpression,
	squash: api.squash,
	toPascal: api.toPascal,
	violation: api.violation,
	Script: api.Script,
	ast: api.ast,
}
