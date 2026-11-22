import { rules } from '@/_conventions/rules.ts'
import { sample as samples } from '@/components/_conventions/samples.ts'
import { classes } from '@/components/_conventions/classes.ts'
import { folder } from '@/_conventions/folder.ts'
import { queries } from '@/_conventions/queries.ts'

export default rules(
	samples(
		samples.sampleRequiredFiles(),
		samples.sampleAllowedFiles(),
		samples.sampleFolders(),
		samples.object(),
		samples.slots(),
	),
	classes(classes.bem(), classes.listGroups()),
	folder(
		folder.serviceImports.off(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
	queries(queries.range()),
) satisfies Lift.Rules
