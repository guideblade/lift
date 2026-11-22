---
metadata:
    reviewed: 2026-11-22
---

# ServiceExampleThing

Off until `config.services.exampleThing` sets `enabled: true`. Once on, it marks `<html>` with `data-service-example-thing-state="ready"`. Everything else reaches it through `@services`:

```ts
import { serviceOn, services } from '@services'

serviceOn('exampleThing')
services.exampleThing?.ServiceExampleThing.getInstance()
```
