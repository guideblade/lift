import { folder, layer } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { mayImport } from '@/assets/_conventions/layer.ts'
import { icons } from './icon.ts'

export default rules(
	icons(icons.allowedFiles(), icons.allowedFolders()),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
