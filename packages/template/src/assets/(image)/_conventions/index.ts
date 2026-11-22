import { folder, layer } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { mayImport } from '@/assets/_conventions/layer.ts'
import { images } from './image.ts'

export default rules(
	images(images.allowedFiles(), images.allowedFolders()),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
