import { folder, layer } from '@/_conventions/folder.ts'
import { rules } from '@/_conventions/rules.ts'
import { layerRoot } from '@/components/_conventions/component.ts'
import { widgetFamilies } from './families.ts'
import { mayImport } from './layer.ts'

export default rules(
	layerRoot(
		layerRoot.allowedFolders(),
		layerRoot.groupPlacement(),
		layerRoot.ownConventions(widgetFamilies),
	),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
) satisfies Lift.Rules
