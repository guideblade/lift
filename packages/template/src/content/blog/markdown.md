# Markdown

Every Markdown file in `src/content/blog` becomes a page at `/blog/<file name>`. This one shows what the built-in Markdown renders.

## Text

A paragraph with **bold**, _italic_, ~~struck~~ and `inline code`. A [link to the home page](/) and an [external link](https://astro.build).

> A blockquote holds a quote or an aside.

## Lists

- An unordered item
- Another item
    - A nested item

1. An ordered item
2. Another item

- [x] A finished task
- [ ] An open task

## Code

```ts
const greeting = (name: string) => `Hello, ${name}`
```

## Table

| Syntax    | Renders as |
| :-------- | :--------- |
| `**a**`   | **a**      |
| `_a_`     | _a_        |
| `` `a` `` | `a`        |

## Footnote

A sentence with a footnote.[^1]

---

### Smaller heading

#### Smallest heading used here

[^1]: The footnote text, listed at the end of the page.
