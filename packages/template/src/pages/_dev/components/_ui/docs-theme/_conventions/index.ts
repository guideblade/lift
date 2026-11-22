import { folder } from '@/_conventions/folder.ts'
import { queries } from '@/_conventions/queries.ts'
import { rules } from '@/_conventions/rules.ts'

export default rules(
	queries(queries.range()),
	folder(
		folder.serviceImports.off(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
