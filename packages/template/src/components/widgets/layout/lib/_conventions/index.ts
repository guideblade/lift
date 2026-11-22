import { rules } from '@/_conventions/rules.ts'
import { classes } from '@/components/_conventions/classes.ts'
import { queries } from '@/_conventions/queries.ts'
import { isolation } from '@/components/widgets/_conventions/isolated.ts'
import { layer, folder } from '@/_conventions/folder.ts'
import { mayImport } from '@/components/widgets/_conventions/layer.ts'

export default rules(
	classes(classes.bem(), classes.listGroups()),
	queries(queries.range()),
	isolation(isolation.imports('widget')),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
