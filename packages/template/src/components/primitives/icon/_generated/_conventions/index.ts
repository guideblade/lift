import { rules } from "@/_conventions/rules.ts"
import { queries } from "@/_conventions/queries.ts"
import { layer, folder } from "@/_conventions/folder.ts"
import { mayImport } from "@/components/primitives/_conventions/layer.ts"

export default rules(
	queries(queries.range()),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
