import { rules } from '@/_conventions/rules.ts'
import { structure } from '@/components/_conventions/component.ts'
import { componentFamilies } from '@/components/_conventions/families.ts'
import { componentTemplate as template } from '@/components/_conventions/template.ts'
import { classes } from '@/components/_conventions/classes.ts'
import { queries } from '@/_conventions/queries.ts'
import { layer, folder } from '@/_conventions/folder.ts'
import { mayImport } from '@/components/primitives/_conventions/layer.ts'

export default rules(
	structure(
		structure.requiredFiles(),
		structure.requiredFolders(),
		structure.allowedFiles(),
		structure.allowedFolders(),
		structure.indexReexport(),
		structure.plainTag(),
		structure.instanceFamily(),
		structure.nestedConventions(componentFamilies),
	),
	template(template.rootTag(), template.tagFromProps()),
	classes(classes.bem(), classes.listGroups()),
	queries(queries.range()),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
