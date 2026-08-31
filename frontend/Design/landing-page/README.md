# GNB Edge — HTML export

Generated from the working design files. Everything here is plain HTML you can open, edit or hand to a developer.

## Contents

- `index.html` — browsable index of every page and section. Start here.
- `pages/` — one file per page (11 pages).
- `sections/<page>/` — that page split into individual sections, numbered in page order (95 files).
- `assets/ds/colors_and_type.css` — the design tokens (colors, type scale, shadows, radii) used through `var(--*)`.
- `assets/image-slot.js` — the drag-and-drop photo placeholder element.
- `assets/fleet-map-live.html`, `assets/india-map.html` — the map iframes (they load d3 and India boundary data from a CDN, so they need internet).

## How the markup is written

- Layout and styling are **inline styles** on the elements. No CSS classes to trace.
- `<style>` in `<head>` only holds keyframes, body resets and link colors.
- Section files include the page wrapper div, so each renders on its own with correct fonts and background.

## What did not survive the export

- **Hover states.** The working files carry hover styling in a non-standard attribute; it was stripped here. Add `:hover` rules in CSS where you need them.
- **Interactive behaviour.** Nav dropdowns, the FAQ accordion, the testimonial carousel, the pricing monthly/annual switch, scroll reveals, count-up numbers and the light-to-dark theme flip were driven by JavaScript that is not included. Sections are exported in their **default open state**, so all content is visible and editable.
- **Dropped photos.** Images placed into `<image-slot>` placeholders live in the design tool, not in these files. The slots are still there.

## Editing tips

- `data-screen-label` on each section is the name used in the index.
- Numbers, names and reg plates in the mockups are sample data.
- Colors: brand blue is `#4469F0` (`--nova-rage-400`), deep blue `#213EA7`, ink `#050816`, body grey `#5D5D5E`, page grey `#F4F5FA`.
