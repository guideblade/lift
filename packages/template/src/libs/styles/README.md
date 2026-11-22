---
metadata:
    reviewed: 2026-11-22
---

# Styles

Import `@styles/tools.scss` to use Lift's sizing, breakpoint, theme, and BEM helpers.

```scss
@use '@styles/tools.scss' as *;
```

## Sizing

`pxr()` converts design pixels to rem. Interpolate it inside custom properties.

```scss
padding: pxr(24px);
--panel-width: #{pxr(420px)};
```

The root font size can scale above the design width. Set its behavior in `config.fluid`.

## Breakpoints

Choose breakpoint names in `deviceBreakpoints`. The default phases are `small`, `medium`, and `large`.

```scss
@include cq(medium) {
	padding: pxr(32px);
}
```

Use `cq` for container queries and `mq` for viewport queries. In TypeScript or Astro, `viewportQuery` from `@config` produces a viewport query from the same settings.

## Themes

Mono is the default theme. Apply `theme-<name>` to select another theme and `scheme-light`, `scheme-dark`, or `scheme-auto` to set the color scheme.

Use `color(surface)` in Sass or `var(--color-surface)` in CSS to follow the active theme. Theme files live in `src/libs/styles/themes/`.

## Hover

Use the `hover($self)` mixin for hover styles. It respects the component's `hover` setting and its nearest hover source on devices that support hover.

```scss
@mixin small($self) {
	@include hover($self) {
		background-color: color(surface-200);
	}
}
```

The `hover` prop accepts `auto`, `self`, `parent`, `off`, and `on`. Set `hoverSource` on a component or `data-hover-source` on an element to provide a hover source.
