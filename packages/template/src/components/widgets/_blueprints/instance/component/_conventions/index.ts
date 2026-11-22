import { rules } from '@/_conventions/rules.ts'
import { structure } from '@/components/_conventions/component.ts'
import { widgetFamilies } from '@/components/widgets/_conventions/families.ts'
import { componentTemplate as template } from '@/components/_conventions/template.ts'
import { classes } from '@/components/_conventions/classes.ts'
import { queries } from '@/_conventions/queries.ts'
import { instance } from '@/components/_conventions/instance.ts'
import { isolation } from '@/components/widgets/_conventions/isolated.ts'
import { layer, folder } from '@/_conventions/folder.ts'
import { mayImport } from '@/components/widgets/_conventions/layer.ts'

export default rules(
	structure(
		structure.requiredFiles(),
		structure.requiredFolders(),
		structure.allowedFiles(),
		structure.allowedFolders(),
		structure.indexReexport(),
		structure.plainTag(),
		structure.instanceFamily(),
		structure.nestedConventions(widgetFamilies),
	),
	template(template.rootTag(), template.tagFromProps()),
	classes(classes.bem(), classes.listGroups()),
	queries(queries.range()),
	instance(
		instance.files(),
		instance.baseClass(),
		instance.define(),
		instance.managerClass(),
		instance.requiresJs(),
	),
	isolation(isolation.imports('widget')),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
