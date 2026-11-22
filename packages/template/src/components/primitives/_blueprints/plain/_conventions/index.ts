import { folder, layer } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { blueprintVariant } from '@/components/_conventions/blueprints.ts'
import { componentFamilies } from '@/components/_conventions/families.ts'
import { mayImport } from '@/components/primitives/_conventions/layer.ts'

export default rules(
	blueprintVariant(
		blueprintVariant.allowedFiles(),
		blueprintVariant.allowedFolders(),
		blueprintVariant.requiredFolders(),
		blueprintVariant.ownConventions(componentFamilies),
	),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
