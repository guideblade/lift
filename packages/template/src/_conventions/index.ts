import { folder, srcRoot } from './folder.ts'
import { rules } from './rules.ts'

export default rules(
	srcRoot(srcRoot.allowedFolders(), srcRoot.ownConventions(), srcRoot.indexShape()),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
