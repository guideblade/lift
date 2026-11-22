---
metadata:
    reviewed: 2026-11-21
---

# Photo

Display a responsive image from your project's photo assets. Use the CLI to add your source files.

```astro
---
import Photo from '@blocks/photo'
---

<Photo name="image-landscape" alt="A mountain landscape" />
```

Use an empty `alt` for a decorative image. Set `sizes` when the image takes up less than the full viewport width.

Photos are added to `src/assets/(image)` by default. You can add photos to a component's `media/photos` folder, then import that folder's `index.ts` and pass it as `from` to `Photo`.

After changing photo files by hand, use the CLI to sync the photo registry. An unknown name shows a placeholder during development and fails the production build.
