import { rules } from '@/_conventions/rules.ts'
import { preset } from '@/components/presets/_conventions/preset.ts'
import { classes } from '@/components/_conventions/classes.ts'
import { layer, folder } from '@/_conventions/folder.ts'
import { mayImport } from '@/components/presets/_conventions/layer.ts'

export default rules(
	preset(
		preset.requiredFiles(),
		preset.allowedFiles(),
		preset.requiredFolders(),
		preset.allowedFolders(),
		preset.indexReexport(),
	),
	classes(classes.bem(), classes.listGroups()),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
