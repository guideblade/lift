---
metadata:
    reviewed: 2026-11-21
---

# HeaderNav

Responsive navigation with a logo, desktop links and panels, and a mobile menu.

```astro
---
import HeaderNav from '@blocks/(header)/header-nav'
---

<HeaderNav start={[{ label: 'Features', href: '#features' }]}>
	<span slot="logo">Lift</span>
</HeaderNav>

<h2 id="features">Features</h2>
```

The mobile menu uses links from `start` and `end` by default. Set `menuItems` to customize it.

For a desktop panel, give an item in `start` or `end` a `panel` ID and place its content in the matching `panel-<id>` slot.

For a sticky header, reserve room in the first section. [Layer setup](../../../widgets/layout/layer/README.md)
