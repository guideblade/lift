import { folder, layer } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { blueprintVariant } from '@/components/_conventions/blueprints.ts'
import { presetFamilies } from '@/components/presets/_conventions/families.ts'
import { mayImport } from '@/components/presets/_conventions/layer.ts'

export default rules(
	blueprintVariant(
		blueprintVariant.allowedFiles(),
		blueprintVariant.allowedFolders(),
		blueprintVariant.requiredFolders(),
		blueprintVariant.ownConventions(presetFamilies),
	),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
