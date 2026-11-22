import { folder, layer } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { blueprints } from '@/components/_conventions/blueprints.ts'
import { mayImport } from '@/components/widgets/_conventions/layer.ts'

export default rules(
	blueprints(
		blueprints.allowedFiles(),
		blueprints.allowedFolders(),
		blueprints.ownConventions(),
	),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
