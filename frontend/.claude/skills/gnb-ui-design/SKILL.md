---
name: gnb-ui-design
description: GNB frontend design system, taken from the Vehicle Detail page (/vehicles/:registrationNumber). Use when building, restyling or reviewing any page, card, KPI tile, chart, map, tooltip, table, badge, button, or loading/empty/error state in main-frontend.
---

# GNB UI design system

Every new page and every redesign in `main-frontend` follows this document. It was written by measuring the Vehicle Detail page, which is the reference design:

| Part of the reference                                                          | Files                                                                 |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Entity header card (plate, pills, actions, notice, truck, mini-map, KPI strip) | `src/pages/Vehicle360/VehicleHeaderCard.jsx`, `vehicleHeaderCard.css` |
| Dashboard cards (bar chart, map, service, driver, documents, fuel, registry)   | `src/pages/Vehicle360/panels/overview/*`, `referenceOverview.css`     |
| Tab panels (trips, telemetry, fuel, service, documents, drivers, tyres)        | `src/pages/Vehicle360/panels/vehicle*.css`                            |
| Tooltip                                                                        | `src/components/ui/DataTooltip.jsx`, `DataTooltip.css`                |

If this document and those files disagree, the files win: fix this document. Section 14 lists the parts of the reference page that do **not** follow the system yet; don't copy those.

**Adoption.** New pages and redesigns follow everything here. Existing pages move over when someone works on them; nobody needs to rewrite the app in one go. The first person to adopt the system adds the token file from section 2.6.

---

## 1. Principles

1. **Show only what was measured.** Every number comes from a reading. When a reading is missing, show `—` and say why ("Not on record", "Timestamp unavailable"). Never show a made-up 0, a placeholder dial or sample data.
2. **Say how old the data is.** Show the reading's age next to it ("Read 13h ago"). Stale readings turn amber.
3. **Measured and estimated look different.** A confirmed value is drawn solid. An estimated or GPS-only value is drawn dashed, with a light fill.
4. **Calm surfaces and one accent colour.** White cards, grey text in four steps, one blue. Colour means something (status, a selected item). It is not decoration.
5. **Size and weight make the hierarchy, not colour.** A large DM Sans figure goes next to a small grey label.
6. **Each card answers one question and offers one next step.** The next step is a link at the top right ("Details →") or one button at the bottom.
7. **Everything works from the keyboard.** Information that appears on hover also appears on focus.

---

## 2. Tokens

### 2.1 Text

| Token        | Value     | Use                                                                      | Contrast on white                               |
| ------------ | --------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| `--ui-ink`   | `#121214` | Primary text, figures, titles                                            | 18:1                                            |
| `--ui-ink-2` | `#2e2e30` | Body text inside notes and callouts                                      | 13:1                                            |
| `--ui-ink-3` | `#5d5d5e` | Secondary text: labels, captions, descriptions                           | 6.6:1                                           |
| `--ui-ink-4` | `#747476` | Small tertiary text that carries meaning, table headers, map city labels | 4.7:1                                           |
| `--ui-ink-5` | `#93939a` | Timestamps, axis ticks, scale numbers                                    | 3.0:1 — **never the only place a fact appears** |
| `--ui-ink-6` | `#c6c6c9` | `·` separators, dashed placeholders, disabled                            | decorative only                                 |

### 2.2 Surfaces and lines

| Token                    | Value                  | Use                                                                                             |
| ------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------- |
| `--ui-page`              | `#ffffff`              | Page background (the reference page sits on white)                                              |
| `--ui-card`              | `#ffffff`              | Cards                                                                                           |
| `--ui-sunk`              | `#f8f8fb`              | Notes, chart/map/illustration stage, table header row, hover background                         |
| `--ui-well`              | `#fcfcfd`              | Empty-state wells inside cards                                                                  |
| `--ui-divider`           | `#f3f3f6`              | Row dividers inside cards, neutral pill background, 4px track background                        |
| `--ui-line`              | `#ececee`              | Dividers between card sections, chart baseline, 6px track background, map grid                  |
| `--ui-line-strong`       | `#dfdfe2`              | Cell borders, checklist circles, map roads                                                      |
| `--ui-card-edge`         | `rgba(5, 8, 22, 0.05)` | Card border on a white page                                                                     |
| `--ui-card-edge-on-grey` | `#dce1e8`              | Card border when the page sits on the grey app canvas (`#f4f6fb`); the 5% edge disappears there |
| `--ui-control-edge`      | `#dce1ee`              | Outline button border                                                                           |
| `--ui-tooltip-edge`      | `#dde3ee`              | Tooltip border                                                                                  |

### 2.3 Brand and accent

| Token               | Value                     | Use                                                                                       |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `--ui-brand`        | `#4469f0`                 | Bars, fills, primary button, active tab underline, route lines, the bar in tooltip labels |
| `--ui-brand-strong` | `#2646be`                 | Text on the tinted button, primary button hover                                           |
| `--ui-brand-deep`   | `#213ea7`                 | Map vehicle-marker stroke, avatar initials, info badge text                               |
| `--ui-link`         | `#2a4fd6`                 | Links, outline button text, primary button border, focus ring                             |
| `--ui-link-hover`   | `#1c358f`                 | Link hover                                                                                |
| `--ui-brand-tint`   | `rgba(47, 88, 238, 0.10)` | Tinted button background, avatar background, estimated-bar fill                           |
| `--ui-brand-tint-2` | `rgba(47, 88, 238, 0.20)` | Tinted button border and hover                                                            |
| `--ui-brand-wash`   | `#eef1ff`                 | Info/open badge background                                                                |
| `--ui-selected`     | `#f2f5ff`                 | Selected table row                                                                        |
| `--ui-insight`      | `#6a43d8`                 | Insight eyebrow, the `✧` glyph, forecast icon. Only for derived or predicted content      |

Use only these blues. `#2563eb`, `#1d4ed8`, `#1f3fbf` and the Tailwind slate greys (`#e5e7eb`, `#f1f5f9`, `#64748b`, `#0f172a`) are older styles; don't use them in new work.

### 2.4 Status

| Tone             | Text on tint              | Tint (badge background)    | Mark (bar, line, fill, dot) |
| ---------------- | ------------------------- | -------------------------- | --------------------------- |
| OK               | `#187a32` `--ui-ok`       | `#e8f7ec` `--ui-ok-tint`   | `#187a32`                   |
| Warning / stale  | `#a65c00` `--ui-warn-ink` | `#fff5df` `--ui-warn-tint` | `#c56200` `--ui-warn`       |
| Danger / overdue | `#bb2626` `--ui-bad-ink`  | `#fff0ef` `--ui-bad-tint`  | `#dd3030` `--ui-bad`        |
| Info / open      | `#213ea7`                 | `#eef1ff`                  | `#4469f0`                   |
| Neutral          | `#5d5d5e`                 | `#f3f3f6`                  | `#93939a`                   |

Text on a tint uses the **text** colour. `#c56200` is for marks only: as text it is about 3.8:1 on its tint, which fails WCAG AA at 12px. `#a65c00` passes at 4.7:1.

Live-map vehicle states (moving, idling, stopped, offline) and trip-leg colours keep using `--rd-moving`, `--rd-idling`, `--rd-stopped`, `--rd-offline` and `--rd-leg-*` from `src/styles/redesign/tokens.css`. The whole app shares those meanings, so don't redefine them.

### 2.5 Elevation and radius

| Token                | Value                                                        | Use                              |
| -------------------- | ------------------------------------------------------------ | -------------------------------- |
| `--ui-shadow-card`   | `0 2px 4px rgba(30,34,56,.08), 0 1px 2px rgba(30,34,56,.04)` | Every card                       |
| `--ui-shadow-raised` | `0 4px 14px rgba(30,34,56,.08)`                              | Insight cards                    |
| `--ui-shadow-pop`    | `0 6px 24px rgba(30,34,56,.12)`                              | Tooltips, popovers               |
| `--ui-r-card`        | `12px`                                                       | Cards, tooltips, insight cards   |
| `--ui-r-control`     | `8px`                                                        | Buttons, notes, inputs           |
| `--ui-r-chip`        | `6px`                                                        | Small dashed chips ("No drop")   |
| `--ui-r-pill`        | `999px`                                                      | Pills, badges, segmented control |

Smaller radii: a 6px track uses 3px, a 4px track and bar tops use 2px, legend keys 2px, the document checkbox 4px. Avatars and dots are `50%`.

### 2.6 One-time foundation: `src/styles/ui-tokens.css`

Create this file once and import it in `src/main.jsx` right after `./styles/redesign/tokens.css`. The `@font-face` rules use the same family names as `referenceOverview.css`, so the Vehicle Detail page keeps working.

```css
@font-face {
  font-family: 'Vehicle Overview Inter';
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/vehicle-overview/inter-regular.ttf') format('truetype');
}
@font-face {
  font-family: 'Vehicle Overview Inter';
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/vehicle-overview/inter-medium.ttf') format('truetype');
}
@font-face {
  font-family: 'Vehicle Overview Inter';
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/vehicle-overview/inter-semibold.ttf') format('truetype');
}
@font-face {
  font-family: 'Vehicle Overview DM Sans';
  font-weight: 400 700;
  font-display: swap;
  src: url('/fonts/vehicle-overview/dm-sans-latin.woff2') format('woff2');
}
@font-face {
  font-family: 'Vehicle Overview DM Mono';
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/vehicle-overview/dm-mono-regular.woff2') format('woff2');
}

:root {
  --ui-font: 'Vehicle Overview Inter', Inter, -apple-system, sans-serif;
  --ui-font-figure: 'Vehicle Overview DM Sans', 'DM Sans', sans-serif;
  --ui-font-mono: 'Vehicle Overview DM Mono', 'DM Mono', ui-monospace, monospace;

  --ui-ink: #121214;
  --ui-ink-2: #2e2e30;
  --ui-ink-3: #5d5d5e;
  --ui-ink-4: #747476;
  --ui-ink-5: #93939a;
  --ui-ink-6: #c6c6c9;

  --ui-page: #ffffff;
  --ui-card: #ffffff;
  --ui-sunk: #f8f8fb;
  --ui-well: #fcfcfd;
  --ui-divider: #f3f3f6;
  --ui-line: #ececee;
  --ui-line-strong: #dfdfe2;
  --ui-card-edge: rgba(5, 8, 22, 0.05);
  --ui-card-edge-on-grey: #dce1e8;
  --ui-control-edge: #dce1ee;
  --ui-tooltip-edge: #dde3ee;

  --ui-brand: #4469f0;
  --ui-brand-strong: #2646be;
  --ui-brand-deep: #213ea7;
  --ui-link: #2a4fd6;
  --ui-link-hover: #1c358f;
  --ui-brand-tint: rgba(47, 88, 238, 0.1);
  --ui-brand-tint-2: rgba(47, 88, 238, 0.2);
  --ui-brand-wash: #eef1ff;
  --ui-selected: #f2f5ff;
  --ui-insight: #6a43d8;

  --ui-ok: #187a32;
  --ui-ok-tint: #e8f7ec;
  --ui-warn: #c56200;
  --ui-warn-ink: #a65c00;
  --ui-warn-tint: #fff5df;
  --ui-bad: #dd3030;
  --ui-bad-ink: #bb2626;
  --ui-bad-tint: #fff0ef;

  --ui-shadow-card: 0 2px 4px rgba(30, 34, 56, 0.08), 0 1px 2px rgba(30, 34, 56, 0.04);
  --ui-shadow-raised: 0 4px 14px rgba(30, 34, 56, 0.08);
  --ui-shadow-pop: 0 6px 24px rgba(30, 34, 56, 0.12);

  --ui-r-card: 12px;
  --ui-r-control: 8px;
  --ui-r-chip: 6px;
  --ui-r-pill: 999px;
}

/* Dark theme. The design is light-first; this is a legibility floor, with values
   taken from the existing `.dark .v360` block. Keep it after :root. */
.dark {
  --ui-page: #0b1220;
  --ui-card: #131c2e;
  --ui-sunk: #0f1725;
  --ui-well: #0f1725;
  --ui-divider: rgba(255, 255, 255, 0.1);
  --ui-line: rgba(255, 255, 255, 0.1);
  --ui-line-strong: rgba(255, 255, 255, 0.18);
  --ui-card-edge: rgba(255, 255, 255, 0.1);
  --ui-control-edge: rgba(255, 255, 255, 0.18);
  --ui-tooltip-edge: rgba(255, 255, 255, 0.18);
  --ui-ink: #e8eef7;
  --ui-ink-2: #c3ccdb;
  --ui-ink-3: #8fa0b8;
  --ui-ink-4: #8fa0b8;
  --ui-ink-5: #8fa0b8;
  --ui-ink-6: rgba(255, 255, 255, 0.18);
  --ui-link: #7aa2ff;
  --ui-link-hover: #a9c1ff;
  --ui-brand-wash: rgba(68, 105, 240, 0.16);
  --ui-selected: rgba(68, 105, 240, 0.12);
  --ui-ok: #74d68a;
  --ui-ok-tint: rgba(76, 175, 80, 0.16);
  --ui-warn-ink: #f5c164;
  --ui-warn-tint: rgba(245, 158, 11, 0.16);
  --ui-bad-ink: #ff8a80;
  --ui-bad-tint: rgba(244, 67, 54, 0.16);
}
```

Write colours as tokens in feature CSS. The only exception is SVG attributes, which take literal values; use the same hex values there.

---

## 3. Typography

Three families, each with one job:

- **Inter** (`--ui-font`): all interface text.
- **DM Sans** (`--ui-font-figure`): large figures and the entity title. Nothing else.
- **DM Mono** (`--ui-font-mono`): axis dates, scale numbers, numeric table columns, and codes such as VIN, chassis and device IDs.

### 3.1 Type scale

| Role                               | Family  | Size / line height                       | Weight          | Colour                     | Example                                                    |
| ---------------------------------- | ------- | ---------------------------------------- | --------------- | -------------------------- | ---------------------------------------------------------- |
| Display figure                     | DM Sans | 44px / 1.1                               | 500             | ink                        | The one main answer of a tab (Service: km to next service) |
| Entity title                       | DM Sans | 30px / 1.1, letter-spacing −0.4px        | 500             | ink                        | `WB11S6362`                                                |
| Hero figure                        | DM Sans | 32–36px / 1.1–1.2, letter-spacing −0.5px | 500             | ink                        | Last-trip headline, data age                               |
| Card figure                        | DM Sans | 26px / 1                                 | 500             | ink (bad-ink when overdue) | `8,106 km` to go                                           |
| KPI tile value                     | DM Sans | 22px / 28px                              | 500             | ink                        | `18.5 L`                                                   |
| Small figure                       | DM Sans | 18–20px                                  | 500             | ink                        | Facts grid, fuel figures                                   |
| Insight lead                       | DM Sans | 16px / 1.5                               | 400             | ink                        | Diagnosis sentence                                         |
| Tooltip value                      | Inter   | 16px                                     | 600             | ink                        | `212 km`                                                   |
| Name / emphasis                    | Inter   | 14px                                     | 600             | ink                        | Driver name                                                |
| Card title                         | Inter   | 13px                                     | 600             | ink                        | `Next service`                                             |
| Notice, table cell, row            | Inter   | 13px / 1.5                               | 400             | ink                        |                                                            |
| Header descriptor, header buttons  | Inter   | 13.5px                                   | 400             | ink-3 / link               | `ASHOK LEYLAND · UNKNOWN`                                  |
| Card body, info rows, links, notes | Inter   | 12.5px / 1.5                             | 400 (links 500) | ink-3 / ink                |                                                            |
| Labels, captions, pills            | Inter   | 12px / 1.4                               | 400             | ink-3                      | `Odometer`                                                 |
| Legend                             | Inter   | 11.5px                                   | 400             | ink-3                      | `Engine-confirmed km`                                      |
| Small note                         | Inter   | 11px                                     | 400             | ink-5                      | `Read 13h ago`                                             |
| Table header                       | Inter   | 11px                                     | 400             | ink-4 on sunk              |                                                            |
| Axis ticks, scale                  | DM Mono | 10.5–11px                                | 400             | ink-5                      | `21 Oct … Today`                                           |
| Eyebrow                            | Inter   | 10px, uppercase, letter-spacing 0.16em   | 400             | insight                    | `WHY THIS HAPPENED`                                        |

### 3.2 Rules

- Use weights 400, 500 and 600. Don't use 700.
- Use sentence case everywhere. The eyebrow is the only uppercase text. Turn enums into words: `AVAILABLE` becomes `Available`, and `IN_TRANSIT` becomes `In transit`.
- Use these sizes and no others: 10.5, 11, 11.5, 12, 12.5, 13 and 13.5px for text, and 18, 20, 22, 26, 30, 32, 36 and 44px for figures. 14px is for names only. A section head title (section 5) is 18px/600 in Inter, the one text use of 18px. Don't add 9px, 15px or 17px.
- Single-line text uses `line-height: normal`. Paragraphs and notes use 1.5.
- Numbers that line up in a column use DM Mono, right-aligned, with `white-space: nowrap`.

---

## 4. Spacing and layout

### 4.1 Spacing values

Use only these values: `2 3 4 5 6 8 10 12 14 16 18 20 22 24` px.

| Where                                                         | Value                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Page padding                                                  | `16px 20px 28px`                                                                      |
| Gap between page-level blocks (breadcrumb, header card, tabs) | `14px`                                                                                |
| Tab panel content, below the tabs                             | `padding-top: 10px`                                                                   |
| Between cards (grid gap and row gap)                          | `20px`                                                                                |
| Card padding: standard                                        | `18px 20px`                                                                           |
| Card padding: content-heavy panel card                        | `20px 22px`                                                                           |
| Card padding: header or focal card                            | `22px 24px` (top row `22px 24px 18px`)                                                |
| Gap between blocks inside a card                              | `12px` (chart card 14px, panel cards 16–18px)                                         |
| Card head: title to action                                    | `gap: 8px`                                                                            |
| Title to subtitle                                             | `3–4px`                                                                               |
| Info row                                                      | `padding: 8px 0` (registry and telemetry rows `9px 0`)                                |
| Note callout                                                  | `padding: 10px 12px`                                                                  |
| Edge-to-edge strips inside a card                             | notice `12px 24px`, KPI tile `16px 20px`, map caption `12px 16px`, legend `10px 14px` |
| Legend                                                        | `gap: 4px 14px`; key to label `5px`                                                   |

### 4.2 Layout recipes

```css
/* Peer cards that wrap to fit: Next service, Driver, Documents, Fuel */
.x-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 20px;
}

/* A wide card and a narrow card side by side: chart 3/5 and map 2/5 */
.x-feature-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: stretch;
}
.x-feature-row > .x-wide {
  flex: 3 1 560px;
  min-width: 0;
}
.x-feature-row > .x-narrow {
  flex: 2 1 380px;
  min-width: 0;
}

/* Key-value fields in an expanded section */
.x-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: 0 32px;
}

/* A tab panel is a column of cards */
.x-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
```

- Every flex or grid child that holds text gets `min-width: 0`, or long values overflow.
- **Equal heights are required.** Cards in the same row always share one height (`align-items: stretch`, the grid default). The reference does this: Next service stretches to the height of Documents. Pin the card's button or closing note to the bottom with `margin-top: auto` so they line up across the row. The extra space in a shorter card stays at its bottom, under the content; never centre the content in it.
- **Balance the rows.** Pick a column count that divides the number of cards, so no row is left half empty: 2 or 4 cards → that many columns, 3 or 6 → 3 columns. Put cards with similar amounts of content in the same row. If one card would be far taller than its neighbours, give it a full-width row instead of leaving its neighbours mostly empty.
- **Space between cards is always 20px**, both across and down, and comes from the parent's `gap`. Cards never touch, and a group of figures is never drawn as tiles joined by lines (that is the KPI strip, section 6.5, which only lives inside an entity header card).
- One breakpoint, `600px`: cards go to a single column (`flex-basis: 100%`) and horizontal padding drops to 16px.

### 4.3 Alignment and empty space

These rules keep cards tight and lined up. Most "too much space" bugs come from breaking one of them.

**Spacing**

- Space between siblings comes from the parent's `gap`. Use a margin only for a one-off offset: an icon nudged 2px, or `margin-top: auto` to push a CTA to the bottom.
- Don't give cards or text blocks a fixed `height`. Only canvases get one: a chart (160px), a map (`min-height: 220px`) or an illustration. Skeletons use `min-height`.
- Inside a card, don't spread content vertically with `justify-content: space-between`, `space-around` or `center`, and don't give a content block `flex: 1`. The only thing that may grow is a chart or map canvas. When a row stretches a card, the spare height collects at the bottom, above the pinned button (section 4.2).
- An empty state sits right under the card head with its own padding (about 24px top and bottom). It is never centred in a tall empty box.

**Alignment**

- All content in a card starts at the same left edge. Strips that run edge to edge (notice, KPI strip, legend, table head, expandable section) use the card's horizontal padding (20px, or 24px on the header card), so their text lines up with the card title.
- Cards in the same row use the same padding variant.
- In a row, the label is left and the value is right. Text is left-aligned; numbers in columns are right-aligned. Centre text only in empty states and on map markers.
- A big figure and its qualifier share a baseline (`align-items: baseline`). An icon and its text are centred (`align-items: center`). A text column that follows an icon uses a fixed icon column (for example `grid-template-columns: 16px 1fr`), so wrapped lines stay aligned.
- A card head is `display: flex; justify-content: space-between`. The title and the action share the top edge; the action never wraps under the title on desktop.
- KPI tiles and other repeated items use a fixed row template, so values line up even when one tile has no bar or note.
- Wrapping lists (legends, descriptors, pills) use `flex-wrap: wrap` with a two-value gap (`4px 14px`), so the rows and the items are spaced differently.

---

## 5. Page anatomy

```
Breadcrumb            Fleet / Vehicles / WB11S6362
Entity header card    title + pills + descriptor ........ [Outline] [Primary]
  └ notice strip      ✧ Position last reported 13h ago …          Telemetry →
  └ visual row        illustration (sunk)            | mini-map + caption
  └ KPI strip         Odometer | Diesel | DEF | Next service | Documents | Driver
Tabs                  Dashboard  Service  Fuel 0  Documents 0  Trips …
Tab panel             cards in feature rows and card grids
```

A page or tab that is not about one entity (a ledger, a dashboard, a list) has no header card. It stacks, with 20px between each block:

```
Section head          Title · subtitle ....................... [Date] [Filters] [Primary]
Stat cards            Total cost | Trip revenue | Net profit       (separate cards, 20px apart)
Content cards         lists, breakdowns, charts in card grids
```

- **Section head:** no card around it. Title at 18px/600 in ink (letter-spacing −0.2px; a count beside it at 13.5px/500 in ink-3, a location pill at the normal 12px size), a subtitle at 13.5px in ink-3 6px below it, actions on the right (`display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px`). It sits 12px above the cards it heads, closer than the 20px between groups, so it reads as their title (`.x-section-head + * { margin-top: -8px }` inside the 20px stack). Filters that open from it appear in their own card right under it.
- **Breadcrumb:** 13px. Links are ink-3 and turn ink on hover. The `/` separator is ink-6, and the current item is ink at weight 600.
- **Tabs:** the row has `border-bottom: 1px solid var(--ui-line)` and scrolls sideways with the scrollbar hidden. Each tab has padding `10px 14px` and is 13px/500 ink-3; it turns ink on hover. The active tab is ink at weight 600 with a `2.5px` brand underline inset 6px on each side, at `bottom: -1px`, with `border-radius: 2px`. Counts sit 6px after the label in DM Mono 12px ink-3. Put the selected tab in the URL (`?tab=`) so the view can be shared and Back works.
- **Tabs on the grey canvas:** when the page sits on the grey app canvas (most list and ledger pages), the underline gets lost, so the tab row is a white bar instead: `padding: 4px; gap: 4px; border: 1px solid --ui-card-edge-on-grey; border-radius: 12px; background: --ui-card; box-shadow: --ui-shadow-card`. Each tab is `padding: 8px 14px; border-radius: 8px`, 13px/500 ink-3, hover background `--ui-sunk`. The open tab is `--ui-brand-wash` with an inset `1px --ui-brand-tint-2` ring and `--ui-brand-deep` text at 600. The panel below starts 20px under the bar.
- **Hide what can't have data yet.** A tab or card that depends on a module the organisation hasn't started using (for example ERP trips before the first trip) is left out, not shown full of dashes. It appears once there is data.
- **List pages** use `PageShell` and the shared `DataTable`, restyled with scoped CSS to section 9. **Reports** use `ReportFrame`. Don't build a new frame for either.
- Keep each page's CSS in its own file next to its components, with a short class prefix for that feature (the reference uses `vhcard-`, `vdo-`, `vtrips-` and `vtelemetry-`). Don't put feature styles in `index.css`.

---

## 6. Components

All recipes use `x-` as a stand-in for your feature's prefix.

### 6.1 Card

```css
.x-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  background: var(--ui-card);
  border: 1px solid var(--ui-card-edge);
  border-radius: var(--ui-r-card);
  box-shadow: var(--ui-shadow-card);
  color: var(--ui-ink);
  font-family: var(--ui-font);
}
```

A card whose content runs edge to edge, such as a map or a KPI strip, uses `padding: 0; gap: 0; overflow: hidden`. Each strip inside then sets its own padding and a `border-top: 1px solid var(--ui-line)`.

### 6.2 Card head

The title goes on the left and one action on the right. The action is a text link ending in `→`: "Details →", "History →", "Change →", "Open in tracking →".

```css
.x-card-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.x-card-head h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-ink);
}
.x-card-head p {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--ui-ink-3);
} /* optional subtitle */
.x-link {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  color: var(--ui-link);
  font-size: 12.5px;
  font-weight: 500;
  text-decoration: none;
}
.x-link:hover {
  color: var(--ui-link-hover);
  text-decoration: underline;
}
```

A subtitle joins facts with `·`, for example `1,867 km · 65 km/day pace`. Leave out any part that has no value instead of printing an empty one.

### 6.3 Headline figure

```css
.x-figure {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.x-figure strong {
  font: 500 26px/1 var(--ui-font-figure);
}
.x-figure span {
  font-size: 12.5px;
  color: var(--ui-ink-3);
} /* "to go", "overdue" */
```

### 6.4 Stat cards

Summary figures on a page (a ledger total, a count, a share of spend) are separate peer cards in a grid, built like the Next service and Fuel cards: a card head, a headline figure, an optional level track, and a note. They are never tiles joined edge to edge.

```css
.x-stats {
  display: grid;
  grid-template-columns: repeat(var(--x-cols, 4), minmax(0, 1fr)); /* 2, 3 or 4: see 4.2 */
  gap: 20px;
}
.x-stat {
  /* .x-card: 18px 20px padding, 12px gap, 12px radius, card shadow */
}
.x-stat .x-figure strong {
  font: 500 26px/1 var(--ui-font-figure);
  white-space: nowrap;
}
.x-stat-note {
  margin: auto 0 0; /* pinned to the bottom so notes line up across the row */
  font-size: 12px;
  line-height: 1.5;
  color: var(--ui-ink-3);
}
@media (max-width: 1100px) {
  .x-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .x-stats {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

- The head holds the label as the card title (13px/600) and, on the right, either one link ("Details →") or a status that needs action: a toned pill, or a count in `--ui-bad-ink` like "0 of 5 on record".
- The figure uses section 6.3. Its qualifier says what the number is ("this month", "to go").
- A share of a whole draws the 6px level track (section 6.6) under the figure. Give every card in the row the same parts; if one card has a track and its neighbour has none, the neighbour's note still sits at the bottom, so the rows stay aligned.
- A missing figure is `—` with the reason in the note, never `0`.

### 6.5 KPI strip (entity header card only)

KPI tiles sit edge to edge inside the entity header card, with a line between them. Use the strip only there, once per page; everywhere else summary figures are stat cards (section 6.4). Each tile is a `<button>` that opens the tab with the details.

```css
.x-kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(150px, 1fr)); /* tile count */
  overflow-x: auto;
  border-top: 1px solid var(--ui-line);
}
.x-kpis > button {
  display: grid;
  grid-template-rows: 16px 28px 4px 16px; /* label, value, bar, note */
  gap: 8px;
  align-content: start;
  padding: 16px 20px;
  border: 0;
  border-right: 1px solid var(--ui-line);
  background: var(--ui-card);
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}
.x-kpis > button:hover {
  background: var(--ui-sunk);
}
.x-kpis span {
  font-size: 12px;
  color: var(--ui-ink-3);
}
.x-kpis strong {
  font: 500 22px/28px var(--ui-font-figure);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.x-kpis i {
  display: block;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  background: var(--ui-divider);
}
.x-kpis i > b {
  display: block;
  height: 100%;
  background: var(--ui-brand);
}
.x-kpis small {
  font-size: 11px;
  color: var(--ui-ink-5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

Keep the 4px bar row even when a tile has no percentage, so the values in every tile line up. The note says how fresh the reading is ("Read 13h ago") or where it came from.

### 6.6 Level track (progress)

```css
.x-track {
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: var(--ui-line);
}
.x-track > span {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 3px;
  background: var(--ui-brand);
}
.x-scale {
  display: flex;
  justify-content: space-between;
  font: 11px var(--ui-font-mono);
  color: var(--ui-ink-5);
}
```

The fill is brand by default, `--ui-bad` when overdue, and `--ui-warn` at `opacity: .55` when the reading is stale. Clamp the width to 0–100%.

### 6.7 Info rows

```css
.x-rows > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--ui-divider);
  font-size: 12.5px;
}
.x-rows > div > span:first-child {
  color: var(--ui-ink-3);
} /* label */
.x-rows > div > span:last-child {
  text-align: right;
  overflow-wrap: anywhere;
  min-width: 0;
} /* value */
```

Missing values read "Not on record", "Not assigned" or `—` in ink-5. Problem values use `--ui-bad-ink`.

### 6.8 Note callout

```css
.x-note {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 8px; /* icon + text */
  padding: 10px 12px;
  border-radius: var(--ui-r-control);
  background: var(--ui-sunk);
  color: var(--ui-ink-2);
  font-size: 12.5px;
  line-height: 1.5;
}
.x-note b {
  font-weight: 600;
}
```

Use a note to explain a number ("Predicted due **12 Dec** at the 65 km/day pace. The odometer is 2 days old, so the real figure may be closer."). A plain note without an icon is a `<p>` at 12px/1.5 in ink-3.

### 6.9 Notice strip

A notice strip is one line at the top of a card that summarises data freshness or gaps.

```css
.x-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(90deg, rgba(106, 67, 216, 0.06), rgba(47, 88, 238, 0) 70%);
  border-top: 1px solid var(--ui-line);
}
.x-notice > span {
  color: var(--ui-insight);
} /* ✧ */
.x-notice p {
  margin: 0;
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
}
.x-notice > button {
  /* x-link */
  font-size: 12.5px;
  white-space: nowrap;
}
```

### 6.10 Insight card

Use an insight card for content the system derived or predicted: a diagnosis, a recommendation, an anomaly.

```css
.x-insight {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid transparent;
  border-radius: var(--ui-r-card);
  background:
    linear-gradient(var(--ui-card), var(--ui-card)) padding-box,
    linear-gradient(135deg, rgba(47, 88, 238, 0.28), rgba(106, 67, 216, 0.06)) border-box;
  box-shadow: var(--ui-shadow-raised);
}
.x-eyebrow {
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ui-insight);
}
.x-insight-lead {
  font: 400 16px/1.5 var(--ui-font-figure);
  color: var(--ui-ink);
}
```

Keep `--ui-insight` purple for derived content. Facts the system measured stay blue and grey.

### 6.11 Buttons

| Variant     | Use                                       | Spec                                                                                                               |
| ----------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Primary** | One per area: the main action             | bg `--ui-brand`, border `1px solid --ui-link`, white text; hover bg `--ui-brand-strong`                            |
| **Outline** | Page and header actions next to a primary | bg card, border `1px solid --ui-control-edge`, text `--ui-link`; hover bg `--ui-sunk`                              |
| **Tinted**  | The action at the bottom of a card        | bg `--ui-brand-tint`, border `1px solid --ui-brand-tint-2`, text `--ui-brand-strong`; hover bg `--ui-brand-tint-2` |

| Size                    | Height             | Padding     | Font         |
| ----------------------- | ------------------ | ----------- | ------------ |
| Page and header actions | `min-height: 40px` | `9px 16px`  | 13.5px / 400 |
| Inside a card           | `height: 36px`     | `0 12px`    | 13px / 500   |
| Full-width card CTA     | auto               | `12px 16px` | 13.5px       |

All buttons have `border-radius: 8px`. A card's bottom button gets `margin-top: auto` so buttons line up across a row. Use `<button>` or `<a>` for anything clickable.

### 6.12 Pills and badges

```css
.x-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: var(--ui-r-pill);
  background: var(--ui-divider);
  color: var(--ui-ink-3);
  font-size: 12px;
  white-space: nowrap;
}
.x-pill--ok {
  background: var(--ui-ok-tint);
  color: var(--ui-ok);
}
.x-pill--warn {
  background: var(--ui-warn-tint);
  color: var(--ui-warn-ink);
}
.x-pill--bad {
  background: var(--ui-bad-tint);
  color: var(--ui-bad-ink);
}
.x-pill--info {
  background: var(--ui-brand-wash);
  color: var(--ui-brand-deep);
}
```

The neutral pill is the default. Use a tone only when the pill shows a status the user should act on. A count next to a card title is plain text at 12px/500 in ink-3, and turns `--ui-bad-ink` when something is wrong ("1 of 4 on record").

### 6.13 Segmented filter

```css
.x-segment {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: var(--ui-line);
}
.x-segment button {
  padding: 5px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--ui-ink-3);
  font-size: 12.5px;
  cursor: pointer;
}
.x-segment button[aria-pressed='true'] {
  background: var(--ui-card);
  color: var(--ui-ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.x-segment button > span {
  color: var(--ui-ink-5);
} /* count */
```

### 6.14 Avatar, checkbox and dashed chip

- **Avatar:** 44px circle, bg `--ui-brand-tint`, initials in `--ui-brand-deep` at 14px/600. Show `—` when there is no name.
- **Document checkbox:** 14×14px, `1.5px dashed --ui-ink-6`, radius 4. When the document is present it turns solid `--ui-ok` with a `✓`.
- **Missing-value chip:** `padding: 3px 8px; border: 1px dashed var(--ui-ink-6); border-radius: 6px; font-size: 11.5px; color: var(--ui-ink-4)`, for example "No drop".

### 6.15 Expandable section

A full-width `<button>` with `aria-expanded` and `aria-controls` toggles the section. Inside it: `padding: 16px 20px`, the title at 13px/600, and the right side reads "Show 10 fields" or "Hide" at 12px/400 ink-3. The open content uses the field grid from section 4.2, with rows `padding: 9px 0; border-top: 1px solid var(--ui-divider)` and right-aligned values. Codes in it use DM Mono.

---

## 7. Charts

### 7.1 Colour in charts

- One series uses `--ui-brand`. A second series uses the same blue, dashed, with `--ui-brand-tint` fill, when it is the estimated version of the same measure.
- No data is a `--ui-line` grey stub, 2px tall. Never draw a missing value as a zero-height bar or a dip to 0.
- Use status colours only when the series is a status, for example received (`--ui-ok`) against missing.
- Annotations such as cut-offs or thresholds use `--ui-warn`.
- Don't use rainbow palettes. If a chart needs more than two hues, the chart type is probably wrong.

### 7.2 Bar chart (daily values)

Reference: `DistanceCard` in `panels/overview/ReferenceOverviewCards.jsx`.

```css
.x-bars {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 160px;
  min-height: 160px;
  border-bottom: 1px solid var(--ui-line); /* baseline */
}
.x-bar-hit {
  /* full-height button per bar */
  position: relative;
  display: flex;
  align-items: flex-end;
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.x-bar-hit:hover,
.x-bar-hit:focus-visible {
  background: rgba(68, 105, 240, 0.05);
}
.x-bar {
  display: block;
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: var(--ui-brand);
}
.x-bar--est {
  border: 1.5px dashed var(--ui-brand);
  border-bottom: 0;
  background: var(--ui-brand-tint);
}
.x-bar--empty {
  background: var(--ui-line);
  border: 0;
}
.x-dates {
  display: flex;
  justify-content: space-between;
  font: 10.5px var(--ui-font-mono);
  color: var(--ui-ink-5);
}
```

- Bar height is `max(4%, value / max × 100%)`. An empty day is `2px`.
- The axis shows 5 date ticks (days 0, 7, 14, 21 and the last day), and the last one reads "Today".
- The legend goes at the top right of the card: 10×10px keys with radius 2, text at 11.5px in ink-3. An estimated key uses the dashed style.
- Each bar is a `<button>` with an `aria-label` that says everything the tooltip says: `"17 Nov · 212 km · Engine-confirmed"`. The container has `role="group"` and an `aria-label` that explains solid against dashed.
- **Annotation line:** `position: absolute; top: 0; bottom: 0; border-left: 1px solid var(--ui-warn)`. Its label is 11px/500 in `--ui-warn` on a card-coloured background, 6px from the line. Move the label to the left side when the line is in the last third of the chart.

### 7.3 Tooltip

Use the shared `DataTooltip` component. Don't build another tooltip.

```jsx
<DataTooltip
  className="x-tooltip"
  aria-hidden="true"
  label="Daily distance" // 4×18px brand bar + label
  value={formatKm(km)} // 16px, right-aligned
  details={['17 Nov', 'Engine-confirmed']} // full-width lines below
/>
```

The component draws a white box: `--ui-tooltip-edge` border, radius 12, `--ui-shadow-pop`, 16px padding, 12px/1.4 text in ink-3, `max-width: 260px`.

Positioning: put the tooltip inside the hover target and show it on **both** `:hover` and `:focus-visible`.

```css
.data-tooltip.x-tooltip {
  display: none;
  position: absolute;
  left: 100%;
  top: 12px;
  z-index: 10;
}
.data-tooltip.x-tooltip--end {
  left: auto;
  right: 100%;
} /* flip in the right half */
.x-bar-hit:hover .data-tooltip.x-tooltip,
.x-bar-hit:focus-visible .data-tooltip.x-tooltip {
  display: grid;
}
```

- Add `--end` to flip the tooltip when the target is past the middle of its chart, so it never leaves the card.
- Inside SVG, render the tooltip in a `<foreignObject width="238" height="120">` and clamp its x and y to the viewBox.
- The tooltip is `aria-hidden`. Its information also goes in the target's `aria-label`.
- Content order: what it is (label), the number (value), then when and how it was measured (details).

### 7.4 Timeline and status cells

- **Timeline:** a track 10px high, radius 5, in `--ui-divider`. Segments are 14px high with radius 3 and at least 6px wide. Complete is `--ui-ok`, open is `--ui-brand`, and needs-review is white with `1.5px dashed --ui-warn`. A 2px ink tick marks "now". Each segment is a `<button>` with a `DataTooltip`.
- **Status cells (heatmap):** cells 14px high with `gap: 1px` and radius 1. Empty cells are `--ui-divider` with a `1px --ui-line-strong` border. Filled cells are `--ui-ok`. The legend uses 12×8px keys.

### 7.5 Area and line trends (recharts)

Height 170px, margins `{ top: 6, right: 8, left: 0, bottom: 0 }`. Axes have `fontSize={10}`, `tickLine={false}` and `axisLine={false}`; the Y axis is 58px wide. The area uses `type="monotone"`, `stroke="var(--ui-brand)"`, `strokeWidth={2}`, `fill="var(--ui-brand)"` and `fillOpacity={0.14}`. For the tooltip, pass a custom `content` that renders `DataTooltip`; don't use recharts' default box.

---

## 8. Maps

Reference: `panels/overview/ReferenceOverviewMap.jsx` (schematic SVG) and `VehicleHeaderCard.jsx` (live mini-map).

### 8.1 Map card

The map card is an edge-to-edge card (`padding: 0; gap: 0; overflow: hidden`) with three parts:

1. **Head** (`padding: 14px 18px`): on the left, the place name or coordinates at 13px/600, line height 1.35; below it, the state at 12px/1.4 in ink-3, joined with `·` ("Parked · ignition off · 13h ago"). On the right, a link: "Open in tracking →".
2. **Canvas:** background `--ui-sunk`. A live map has `min-height: 220px` and fills its box absolutely.
3. **Legend footer:** `padding: 10px 14px; border-top: 1px solid var(--ui-line)`, 11.5px in ink-3, with 10px round keys. Any explanatory note goes on the right in ink-5 ("Clusters show count within 2 km").

A live mini-map has a caption below it instead of a head: `padding: 12px 16px`, the location in bold at 13px/600, the state at 12px in ink-3 with 3px above it, and "Open map →" on the right.

### 8.2 Schematic SVG map

- `viewBox="0 0 600 380"`, with grid lines in `#ECECEE` (5 vertical, 3 horizontal).
- Cities are 2px dots in `#93939A`, with labels at 10.5px in `#747476`, offset +5/−5.
- **Routes** are `#4469F0` with round caps and joins: solid 2.5px when engine-confirmed, `strokeDasharray="4 4"` at 2px when GPS-only. Break the line at data gaps; never draw across a gap.
- The **vehicle marker** is fill `#4469F0`, stroke `#213EA7`. **Stop clusters** are fill `#93939A` at 0.22 opacity, stroke `#747476`, with the count at 10.5px/600 in the centre. Merge stops within 2 km.
- Marker radius is `clamp(7, 5 + √count × 2.6, 22)`. A selected marker gets a halo of radius r+7 filled with its stroke colour at 0.16 opacity, and its stroke goes from 1.5 to 2.6.
- Markers are `role="button"` with `tabIndex="0"`, handle Enter and Space, and include a `<title>`.
- With no data, show centred 12px text in `#93939A`: "Loading recorded routes…" or "No recorded positions".

### 8.3 Map rules

- Live vehicle states and trip legs use the `--rd-*` map tokens (section 2.4).
- **Never reverse-geocode in a loop or per position.** Show coordinates (`22.5283, 87.3193`) when no stored address exists, and geocode only the single point a user clicks. Per-position geocoding is the cost trap described in `main-backend/CLAUDE.md`.

---

## 9. Tables

```css
.x-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.x-table th {
  background: var(--ui-sunk);
  color: var(--ui-ink-4);
  font-size: 11px;
  font-weight: 400;
  text-align: left;
}
.x-table th,
.x-table td {
  padding: 10px 14px;
  border-top: 1px solid var(--ui-divider);
  text-align: left;
}
.x-table td.is-secondary {
  font-size: 12px;
  color: var(--ui-ink-3);
}
.x-table td.is-num,
.x-table th.is-num {
  font: 12px var(--ui-font-mono);
  text-align: right;
  white-space: nowrap;
}
.x-table tr[aria-selected='true'] td {
  background: var(--ui-selected);
}
.x-table-wrap {
  overflow: auto;
}
```

- A table inside a card runs edge to edge: give the card `padding: 0`, and pad its head and filters `16px 20px 0`.
- Pages that list records use the shared `DataTable`, restyled in a scoped CSS file to the values above. Reports use `ReportFrame`.
- Table headers are sentence case at 11px. Don't use uppercase headers.
- Missing values use the dashed chip (section 6.14) or `—`. Don't leave a cell blank.

---

## 10. States

| State                    | Do                                                                                                                                                                                                                                                                                                                                                                   | Don't                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Loading**              | Render a skeleton in the same card shell, with the same padding, radius and height as the loaded card. Shape it like the content: 30 bars for a chart, one block for a map, title and line blocks for a text card. Use `components/ui/skeleton`, `role="status"`, `aria-busy="true"` and an sr-only "Loading…". Turn off the shimmer under `prefers-reduced-motion`. | Replace the card with a spinner, collapse the layout, or flash zeros.            |
| **Refetching**           | Keep the last good values on screen while new data loads. `useApi` does this for a refetch in the same scope, but returns `data: null` when the `scopeKey` changes (a filter or tab click). If summary figures must survive that, hold the last good values in a ref (see `tabCounts` in `pages/AutoTrips/AutoTripsPage.jsx`).                                       | Blank figures to 0 or `—` while the request runs.                                |
| **Empty**                | Say what is missing, why, and what to do next: "No agreed distance set · Add the distance agreed with the plant…" plus one button. Let the card keep its natural height.                                                                                                                                                                                             | Stretch an empty card to fill space, or show an empty chart frame without words. |
| **Single missing value** | `—`, "Not recorded", "Not on record", "Not assigned", "Timestamp unavailable".                                                                                                                                                                                                                                                                                       | `0`, `null`, `NaN`, `undefined km`.                                              |
| **Stale**                | Draw the mark in `--ui-warn` at `opacity: .55`, write the caption text in `--ui-warn-ink`, and say how old it is ("from 2 Nov").                                                                                                                                                                                                                                     | Show old data as if it were current.                                             |
| **Error**                | In that card only: "Could not load this section", one line of reason, and a "Try again" button. Wrap each panel in `PanelErrorBoundary`.                                                                                                                                                                                                                             | Blank the whole page because one card failed.                                    |

---

## 11. Interaction and accessibility

- **Focus ring:** `outline: 2px solid var(--ui-link); outline-offset: 2px` (3px on links) on `:focus-visible`. Never remove it.
- **Hover:** tiles and rows use background `--ui-sunk`; chart columns use `rgba(68,105,240,.05)`; links underline and turn `--ui-link-hover`. Hover changes only the background and never moves the layout.
- Anything shown on hover is also shown on `:focus-visible`.
- A chart has `role="group"` or `role="img"` and an `aria-label` that explains how it encodes data. Each focusable part has an `aria-label` with its full value.
- Use `<button>` or `<a>` for anything clickable. SVG markers use `role="button"`, `tabIndex="0"` and handle Enter and Space.
- Images and illustrations have a meaningful `alt` or `aria-label`, for example "Illustrative truck, axle count unavailable".

---

## 12. Writing

- Use sentence case. Join facts with a middle dot and spaces: `·`.
- Navigation links end with `→`.
- Put a space between a number and its unit: `8,106 km`, `18.5 L`, `65 km/day`. Use Indian grouping through the shared formatters (`formatKm`, `formatNum`, `formatLitres`).
- Use relative time in captions ("13h ago", via `timeAgo`). Use IST dates in tooltips and notes ("17 Nov", via `formatDateIST` and `shortDate`).
- Name where a value came from when it matters: "Diesel · sensor", "Engine-confirmed km", "GPS-only km", "Entered by a person".
- Write warnings about the data, not about the user: "Expiry can't be checked until these are uploaded."
- A "watch" flag such as a suspicious unload says that a person should look, and that it is not proof of wrongdoing.

---

## 13. Do and don't

| Do                                                         | Don't                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| Use one blue (`#4469f0`) for marks and `#2a4fd6` for links | Mix `#2563eb`, `#1d4ed8`, `#1f3fbf` or Tailwind blues |
| Draw estimates dashed                                      | Draw estimates the same as measurements               |
| Show `—` and the reason                                    | Show 0 for missing data                               |
| Leave 20px between cards and 12px inside them              | Use ad-hoc 15/25/30px gaps                            |
| Use DM Sans for figures only                               | Set body text or labels in DM Sans                    |
| Put status colour on tints and text                        | Fill a large area with red or green                   |
| Give each card one CTA, aligned with `margin-top: auto`    | Put three buttons in a card                           |
| Give cards in a row one height, CTAs pinned to the bottom  | Leave ragged card bottoms or centre content in a card |
| Show page figures as separate stat cards, 20px apart       | Join figures into one card with lines between them    |
| Use `DataTooltip`                                          | Build a new tooltip, or use `title` alone for data    |
| Use scoped CSS with a feature prefix                       | Add feature styles to `index.css`                     |

---

## 14. Parts of the reference page that don't follow the system yet

These are known gaps on the Vehicle Detail page. Don't copy them; fix them when you work on that page.

1. The breadcrumb, tabs and 404/error cards still use the older `v360-*` styles (IBM Plex, `#2563eb`, warm greys `#e7e5e4`/`#6b645e`). Section 5 gives the target values.
2. `panels/Trend.jsx` (recharts) reads the older `--erp`, `--line2` and `--card` variables and uses recharts' default tooltip. Section 7.5 gives the target.
3. Warning badges in `vehicleTrips.css` and `vehicleTelemetry.css` use `#c56200` text, which fails contrast. Documents and Service already use `#a65c00`, which is the standard.
4. The header status pill shows the raw enum (`AVAILABLE`). It should read "Available".
5. The primary-button border is `#213ea7` in `referenceOverview.css` and `#2a4fd6` everywhere else. The standard is `#2a4fd6`.
6. `.data-tooltip strong` sets no weight, so it renders at 700. The standard is 600.

---

## 15. PR checklist

- [ ] Colours come from `--ui-*` tokens (or the same hex values in SVG attributes); no other blues or slate greys.
- [ ] Text uses only the sizes in section 3.2 and weights 400/500/600; figures use DM Sans and codes and numeric columns use DM Mono.
- [ ] Cards use the card recipe: 12px radius, card shadow, `18px 20px` padding, 20px between cards.
- [ ] Cards in a row share one height, rows are balanced (no half-empty last row), CTAs and closing notes line up with `margin-top: auto`, and there is 20px between every pair of cards.
- [ ] Page figures are stat cards (section 6.4); the KPI strip appears only inside an entity header card.
- [ ] Spacing comes from the parent's `gap`; no fixed heights on cards; nothing inside a card is centred vertically or grown with `flex: 1` except a chart or map canvas.
- [ ] Every strip inside a card uses the card's horizontal padding, so all text lines up with the card title.
- [ ] Each missing value shows `—` or a reason, never 0; readings show how fresh they are; estimates are dashed.
- [ ] Loading uses a skeleton in the same card shell; refetching keeps the last values; errors stay inside their card.
- [ ] Tooltips use `DataTooltip`, open on hover and focus, and flip in the right half.
- [ ] Everything clickable is a `<button>` or `<a>` with a visible focus ring and an `aria-label` when its text alone isn't enough.
- [ ] Text is sentence case with `·` separators, and enums are turned into words.
- [ ] The layout works at 600px with no sideways scroll except inside tables and KPI strips.
- [ ] Map: no geocoding per position; live states use the `--rd-*` map tokens.
