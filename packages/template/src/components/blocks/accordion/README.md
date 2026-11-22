---
metadata:
    reviewed: 2026-11-21
---

# Accordion

An expandable section built on `<details>`.

```astro
---
import Accordion from '@blocks/accordion'
---

<Accordion summary="Shipping" name="faq">
	<p>Orders leave the warehouse within two days.</p>
</Accordion>
```

Accordions with the same `name` close each other when opened.
