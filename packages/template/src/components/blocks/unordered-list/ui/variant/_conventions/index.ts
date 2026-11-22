import { rules } from '@/_conventions/rules.ts'
import { variant as ui } from '@/components/_conventions/ui-folder.ts'
import { variantStyle as style } from '@/components/_conventions/style.ts'
import { variantMedia as media } from '@/components/_conventions/media.ts'
import { hover } from '@/components/_conventions/hover.ts'
import { classes } from '@/components/_conventions/classes.ts'
import { layer, folder } from '@/_conventions/folder.ts'
import { mayImport } from '@/components/blocks/_conventions/layer.ts'
import { queries } from '@/_conventions/queries.ts'

export default rules(
	ui(ui.variantFiles(), ui.variantFolders(), ui.contiguousVariants()),
	style(style.container()),
	media(media.phase()),
	hover(hover.mixin()),
	classes(classes.bem(), classes.listGroups()),
	layer(layer.imports(mayImport)),
	folder(
		folder.serviceImports(),
		folder.conventionsIndex(),
		folder.conventionImports(),
		folder.definitionPlacement(),
	),
	queries(queries.range()),
) satisfies Lift.Rules
