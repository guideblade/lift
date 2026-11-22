import { folder, layer } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { componentFamilies } from '@/components/_conventions/families.ts'
import { group } from '@/components/_conventions/group.ts'
import { mayImport } from '@/components/primitives/_conventions/layer.ts'

export default rules(
	group(
		group.allowedFiles(),
		group.allowedFolders(),
		group.placement(),
		group.ownConventions(componentFamilies),
	),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
