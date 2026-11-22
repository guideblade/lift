---
metadata:
    reviewed: 2026-11-21
---

# NavSimpleTabs

Tabs with a sliding indicator, built on [`BehaviorTabsZag`](../../../../../behaviors/tabs-zag/README.md).

```astro
---
import NavSimpleTabs from '@blocks/(nav)/(simple)/nav-simple-tabs'
---

<NavSimpleTabs
	items={[
		{ value: 'overview', label: 'Overview' },
		{ value: 'details', label: 'Details' },
	]}
	label="Sections">
	<div slot="overview">Overview content</div>
	<div slot="details">Details content</div>
</NavSimpleTabs>
```
