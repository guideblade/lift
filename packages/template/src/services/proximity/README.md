---
metadata:
    reviewed: 2026-11-22
---

# ServiceProximity

Track pointer proximity to an element using CSS variables. Configure the radius and input media condition in `config.services.proximity`.

```astro
---
import { serviceAttributes } from '@services'
---

<article {...serviceAttributes('proximity', { root: '' })}>Content</article>
```

`--service-proximity` ranges from `0` to `1`. `--service-proximity-x` and `--service-proximity-y` describe the pointer's position relative to the element.
