---
metadata:
    reviewed: 2026-11-22
---

# ServiceLenis

Smooth scrolling with [Lenis](https://github.com/darkroomengineering/lenis). Configure it in `config.services.lenis`.

```ts
import { services } from '@services'

const lenis = services.lenis?.ServiceLenis.getInstance()
lenis?.scrollTo('#contact')
```

Use `data-service-lenis` on a scroll container to opt it in. For a nested scroll container that handles wheel input without scrolling, such as a map, use `data-service-lenis-prevent`.
