import { folder } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { components } from '@/components/_conventions/components.ts'

export default rules(
	components(
		components.allowedFolders(),
		components.allowedFiles(),
		components.ownConventions(),
	),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
