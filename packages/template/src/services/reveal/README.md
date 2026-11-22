---
metadata:
    reviewed: 2026-11-22
---

# ServiceReveal

Animate elements as they enter the viewport. Configure the service in `config.services.reveal`.

```astro
---
import { serviceAttributes } from '@services'
---

<section {...serviceAttributes('reveal', { root: 'fade-up' })}>Content</section>
```

An empty value uses the configured default preset. Presets include `fade`, directional fades, `zoom-in`, and `zoom-out`. Adjust duration, delay, easing, and distance through the `--service-reveal-*` CSS variables.
