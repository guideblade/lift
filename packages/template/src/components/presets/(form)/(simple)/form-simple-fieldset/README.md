---
metadata:
    reviewed: 2026-11-21
---

# FormSimpleFieldset

Group related fields in a simple form.

```astro
---
import FormSimpleFieldset from '@presets/(form)/(simple)/form-simple-fieldset'
---

<FormSimpleFieldset>
	<legend>Contact details</legend>
	<label for="email">Email</label>
	<input id="email" name="email" type="email" />
</FormSimpleFieldset>
```
