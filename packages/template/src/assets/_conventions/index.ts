import { folder, layer } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { assets } from './assets.ts'
import { mayImport } from './layer.ts'

export default rules(
	assets(assets.allowedFolders(), assets.allowedFiles(), assets.ownConventions()),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
