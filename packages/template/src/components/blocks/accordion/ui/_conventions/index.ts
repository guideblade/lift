import { rules } from '@/_conventions/rules.ts'
import { uiStructure as structure } from '@/components/_conventions/component.ts'
import { ui } from '@/components/_conventions/ui-folder.ts'
import { props, template } from '@/components/_conventions/template.ts'
import { style } from '@/components/_conventions/style.ts'
import { queries } from '@/_conventions/queries.ts'
import { layer, folder } from '@/_conventions/folder.ts'
import { media } from '@/components/_conventions/media.ts'
import { hover } from '@/components/_conventions/hover.ts'
import { instanceUi as instance } from '@/components/_conventions/instance.ts'
import { classes } from '@/components/_conventions/classes.ts'
import { mayImport } from '@/components/blocks/_conventions/layer.ts'

export default rules(
	structure(structure.parses()),
	ui(ui.requiredFiles(), ui.requiredFolders(), ui.allowedFiles(), ui.allowedFolders()),
	props(
		props.lowercase(),
		props.type(),
		props.baseProps(),
		props.rest(),
		props.rootSpread(),
		props.rootAttributes(),
	),
	template(
		template.singleRoot(),
		template.componentAttributes(),
		template.rootClassList(),
		template.rootWithoutClass(),
		template.block(),
	),
	style(style.boilerplate(), style.queries(), style.container(), style.layer('block')),
	media(media.phase()),
	hover(hover.mixin()),
	instance(
		instance.rootTag(),
		instance.tag(),
		instance.attributes(),
		instance.imports(),
	),
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
