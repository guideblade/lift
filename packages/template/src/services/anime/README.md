---
metadata:
    reviewed: 2026-11-22
---

# ServiceAnime

Animate elements with [Anime.js](https://animejs.com), using the project's defaults and reduced-motion setting.

```ts
import { services } from '@services'

const anime = services.anime?.ServiceAnime.getInstance()
anime?.animate('.card', { opacity: [0, 1] })
```

Configure the service in `config.services.anime`. When reduced motion is active, `animate`, `createTimeline`, and `waapi.animate` complete at their end state.
