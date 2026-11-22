import { folder, layer } from '@/_conventions/folder.ts'
import { queries } from '@/_conventions/queries.ts'
import { rules } from '@/_conventions/rules.ts'
import { mayImport } from '@/pages/_conventions/layer.ts'

export default rules(
	layer(layer.imports(mayImport)),
	queries(queries.range()),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
