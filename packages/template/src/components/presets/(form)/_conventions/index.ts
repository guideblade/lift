import { folder, layer } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { group } from '@/components/_conventions/group.ts'
import { presetFamilies } from '@/components/presets/_conventions/families.ts'
import { mayImport } from '@/components/presets/_conventions/layer.ts'

export default rules(
	group(
		group.allowedFiles(),
		group.allowedFolders(),
		group.placement(),
		group.ownConventions(presetFamilies),
	),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
