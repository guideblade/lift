import { folder } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { site } from './site.ts'

export default rules(
	site(site.ownConventions()),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
