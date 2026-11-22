/**
 * This file is generated from src/components/primitives/text/ui/variant/*.scss.
 * Do not edit it manually.
 *
 * - primary / 100: font: var(--font-cal-sans); size: pxr(16px) → pxr(16px) → pxr(16px)
 *
 * - primary / 120: font: var(--font-faculty-glyphic); size: pxr(18px) → pxr(20px) → pxr(20px)
 *
 * - primary / 140: font: var(--font-inter); size: pxr(20px)
 *
 * - primary / 160: size: pxr(22px)
 *
 * - primary / 180: size: pxr(24px)
 *
 * - primary / 200: size: pxr(26px)
 *
 * - secondary / 100: color: #245c4a; font: var(--font-inter); line-height: 1.25; size: pxr(15px) → pxr(17px) → pxr(19px); weight: 600 → 600 → 600
 *
 * - secondary / 300: color: #245c4a; font: var(--font-inter); line-height: 1.2; size: pxr(21px) → pxr(24px) → pxr(27px); weight: 700 → 700 → 700
 */
export interface PrimaryTextFormDefinitions {
	/** primary / 100: font: var(--font-cal-sans); size: pxr(16px) → pxr(16px) → pxr(16px) */
	'100': '100'
	/** primary / 120: font: var(--font-faculty-glyphic); size: pxr(18px) → pxr(20px) → pxr(20px) */
	'120': '120'
	/** primary / 140: font: var(--font-inter); size: pxr(20px) */
	'140': '140'
	/** primary / 160: size: pxr(22px) */
	'160': '160'
	/** primary / 180: size: pxr(24px) */
	'180': '180'
	/** primary / 200: size: pxr(26px) */
	'200': '200'
}
export type PrimaryTextForm = keyof PrimaryTextFormDefinitions
export interface SecondaryTextFormDefinitions {
	/** secondary / 100: color: #245c4a; font: var(--font-inter); line-height: 1.25; size: pxr(15px) → pxr(17px) → pxr(19px); weight: 600 → 600 → 600 */
	'100': '100'
	/** secondary / 300: color: #245c4a; font: var(--font-inter); line-height: 1.2; size: pxr(21px) → pxr(24px) → pxr(27px); weight: 700 → 700 → 700 */
	'300': '300'
}
export type SecondaryTextForm = keyof SecondaryTextFormDefinitions
export interface TextFormByVariant {
	primary: PrimaryTextForm
	secondary: SecondaryTextForm
}
export type TextForm = TextFormByVariant[keyof TextFormByVariant]
export type TextVariant = 'primary' | 'secondary'
type PrimaryVariantProps = {
	variant?: 'primary'
	/**
	 * Text degree. Responsive values by phase:
	 * - primary / 100: font: var(--font-cal-sans); size: pxr(16px) → pxr(16px) → pxr(16px)
	 *
	 * - primary / 120: font: var(--font-faculty-glyphic); size: pxr(18px) → pxr(20px) → pxr(20px)
	 *
	 * - primary / 140: font: var(--font-inter); size: pxr(20px)
	 *
	 * - primary / 160: size: pxr(22px)
	 *
	 * - primary / 180: size: pxr(24px)
	 *
	 * - primary / 200: size: pxr(26px)
	 */
	form?: TextFormByVariant['primary']
}
type SecondaryVariantProps = {
	variant: 'secondary'
	/**
	 * Text degree. Responsive values by phase:
	 * - secondary / 100: color: #245c4a; font: var(--font-inter); line-height: 1.25; size: pxr(15px) → pxr(17px) → pxr(19px); weight: 600 → 600 → 600
	 *
	 * - secondary / 300: color: #245c4a; font: var(--font-inter); line-height: 1.2; size: pxr(21px) → pxr(24px) → pxr(27px); weight: 700 → 700 → 700
	 */
	form?: TextFormByVariant['secondary']
}
export type TextVariantProps = PrimaryVariantProps | SecondaryVariantProps
