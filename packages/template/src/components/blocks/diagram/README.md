---
metadata:
    reviewed: 2026-11-21
---

# Diagram

Render a Mermaid diagram from source text.

```astro
---
import Diagram from '@blocks/diagram'

const source = `flowchart LR
  A[Plan] --> B[Build]`
---

<Diagram source={source} />
```

Use `accTitle:` and `accDescr:` in the source to describe the diagram for screen readers. Invalid source fails the production build.
