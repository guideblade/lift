import { readFileSync } from 'node:fs'
import { defaultTreeAdapter, parse, type DefaultTreeAdapterMap } from 'parse5'
import { validateBuild, type DomTier } from './config.ts'

type Node = DefaultTreeAdapterMap['node']

const tiers: DomTier[] = validateBuild.dom

const count = (node: Node): number =>
	(defaultTreeAdapter.isElementNode(node) ? 1 : 0) +
	('childNodes' in node
		? node.childNodes.reduce((sum, child) => sum + count(child), 0)
		: 0)

export const elements = (file: string) => count(parse(readFileSync(file, 'utf8')))

export const rate = (total: number) =>
	tiers.find(tier => total < tier.below) ?? tiers[tiers.length - 1]
