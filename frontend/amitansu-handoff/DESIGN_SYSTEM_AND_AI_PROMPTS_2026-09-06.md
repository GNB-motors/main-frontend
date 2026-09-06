# GNB — Design System, Information Architecture & AI Design Prompts

**Written:** 2026-09-06 · **Author:** Opus 5
**Companions:** `FRONTEND_UX_AUDIT_2026-09-06.md` (what's broken) · `OVERHAUL_MASTER_PLAN_2026-09-06.md` (data)
**This document answers one question:** how does an outsider open this product and immediately
know where they are, what they're looking at, and what to do?

---

## §0 — THE PRINCIPLE: LABEL AND CATEGORISE BEFORE YOU DECORATE

An external user opening GNB today gets 59 flat pages of unlabelled tables. Numbers appear with
no unit, no period, no source, and no indication of whether they matter. The natural response to
that is to close the tab. **No amount of glassmorphism fixes an uncategorised product** — it just
makes the confusion prettier.

So the order of work is: **categorise → label → hierarchy → theme.** Theme is last, and theme is
subordinate. A visual effect earns its place only where it does a job.

**The rule for every effect in this system:** it must fit like a puzzle piece — sitting in the
space the layout already made for it — never hammered through the content. Concretely:

| Effect | Where it belongs (it does a job) | Where it is forbidden |
|---|---|---|
| **Glass / blur** | Floating panels **over a map**, drawer scrims, popovers, sticky toolbars over scrolling content | Data cards, tables, KPI tiles, forms, anything containing a number to be read |
| **Gradient** | Brand identity surfaces — sidebar, login, empty-state art | Chart fills, status chips, table rows, buttons that aren't the single primary action |
| **Shadow** | Elevation that means "this floats above" — modals, dropdowns, drawers | Every card by default. Flat cards on a tinted ground read cleaner |
| **Motion** | Explaining a change — a truck moving, a value updating, a panel opening | Decoration, counting numbers, entrance animations on page load |
| **Colour** | Status (4 reserved), category identity, one brand accent | Alternating rows, decorative headers, "making it pop" |

Why glass is banned on data: translucency puts a moving, variable-contrast background behind
text. A fuel figure over a scrolling satellite map is unreadable, and the number is the product.
Glass over a map is *right* — it says "this control floats above the world". Glass over a fuel
ledger is a nail through a plank.

**Mellow means:** low-saturation surfaces, one accent, generous spacing, few borders, soft
neutral grounds instead of stark white, and type doing the hierarchy work instead of colour.
It does **not** mean grey mush — status colour stays fully saturated because it must be seen.

---

## §1 — INFORMATION ARCHITECTURE (FMS ONLY — ERP IS NOT RESTRUCTURED)

An owner does not think "I'll open the DefLedger module." He thinks in questions. The navigation
should be those questions, in his order of urgency.

| # | The question he actually asks | Section name | Pages that live here |
|---|---|---|---|
| 1 | *Where are my trucks right now?* | **Live** | Live map, vehicle rail, trip progress, ETAs |
| 2 | *Is anything wrong today?* | **Attention** | Owner alerts, fleet alerts, SOS, route deviation, siphoning hotspots, data-quality issues |
| 3 | *Where is my money going?* | **Money** | Fuel spend, fuel integrity/theft, idling waste, AdBlue, cost per km, trip P&L |
| 4 | *Are my trucks legal and healthy?* | **Fitness** | Documents & expiry, insurance, service due, maintenance, tyres |
| 5 | *How are my people doing?* | **People** | Drivers, driver scorecards, khata/ledger, advances, attendance |
| — | *Set things up* | **Setup** | Vehicles, routes, locations, geofences, users & roles, settings |
| — | *(untouched)* | **ERP & CRM** | Left exactly as it is today. Not restructured, not renamed, not reordered. |

> 🛑 **ERP/CRM is out of scope.** The five FMS sections above replace how *fleet* pages are
> grouped. The existing **ERP & CRM** section keeps its current pages, labels and order — do not
> fold ERP into "Operations" and "Accounts", do not rename anything under it, do not touch its
> pages. The only ERP-adjacent change is the sidebar gradient tinting blue while the user is
> inside an ERP route (§H.3), which the owner asked for directly.

**Rules for the nav:**

- **Setup is visually separated and sits at the bottom.** It is used once a month; today masters
  and daily screens sit side by side with equal weight, which is why the sidebar feels like a
  database browser.
- **Every section has one icon and one accent tint** used consistently — the same tint on the
  section's cards and chart accents. That is how a user builds a spatial memory of the product.
- **Badge counts only where action is required** (Attention, and ERP & CRM's existing badges).
  A badge on Live is noise.
- **Maximum 5 fleet sections + Setup + the existing ERP & CRM group.** Anything else is a
  sub-item, reachable by ⌘K.
- The orange→blue gradient fires on entering any ERP & CRM route. That is the whole of the ERP
  work — the group's contents are not designed, renamed or reordered.

---

## §2 — THE LABELLING CONTRACT (the fix for "bombarded with unlabelled data")

**Every number on screen carries five things.** If any is missing, the number is not shippable.

1. **What it is** — a plain-English noun. "Fuel used", not `fuelConsumptionTodayL`.
2. **Its unit** — ₹, L, km, km/L, h, %. Attached to the value, styled smaller and muted.
3. **Its period** — "today", "last 7 days", "this month". A number without a period is a riddle.
4. **Its comparison** — vs previous period or vs fleet median, with direction and whether that
   direction is good. ↑ fuel spend is bad; ↑ mileage is good. **Never colour an arrow by
   direction alone — colour it by whether it is good news.**
5. **Its source** — measured / estimated / assumed, on hover. Established in the audit doc.

**The anatomy of a metric tile:**

```
┌─────────────────────────────────┐
│ FUEL SPEND            ⓘ  ⋯      │   label (11px, uppercase, muted, letter-spaced)
│                                 │
│ ₹4,82,350                       │   value (32px, tabular numerals, tight)
│                                 │
│ ↑ 12% vs last week      ● 2h    │   comparison (good/bad colour) + freshness dot
└─────────────────────────────────┘
```

- **Indian digit grouping**: `₹4,82,350`, never `₹482,350`.
- **Tabular numerals everywhere.** Columns of figures that don't align are unreadable.
- **Units never inside the big number's type size** — `4,82,350` large, `₹` and `L` smaller.
- **Empty is a sentence, not a dash.** "No fuel logged this week" beats `—`.

**Categorise within a screen too.** A table of 40 columns is uncategorised data. Group columns
under headers (Identity · Status · Performance · Cost), let users hide groups, and pick a
sensible default set. The rest live behind "Columns".

---

## §3 — VISUAL LANGUAGE

### §3.1 Colour

```css
/* Brand */
--brand:        #EE6126;   /* fleet */
--brand-soft:   #FF8B2C;
--erp:          #1E3A8A;   /* ERP/CRM identity */
--erp-soft:     #1E88E5;

/* Status — RESERVED, never decorative */
--ok:      #4CAF50;   /* moving, healthy, paid */
--warn:    #F59E0B;   /* attention, due soon, stale */
--bad:     #F44336;   /* overdue, offline, violation */
--neutral: #94A3B8;   /* parked, unknown, not applicable */

/* Mellow ground — NOT white */
--bg:         #FAFAF9;   /* app background, warm off-white */
--surface:    #FFFFFF;   /* cards sit ON the ground */
--surface-2:  #F5F5F4;   /* nested/secondary surfaces */
--line:       #E7E5E4;   /* hairlines, 1px, low contrast */

/* Text */
--ink:      #1A1A1A;
--ink-2:    #44403C;
--ink-3:    #78716C;
--ink-mute: #A8A29E;
```

**The one rule that matters most: brand orange never means warning.** In a fleet product, orange
is the strongest "caution" signal a user brings with them from the road. Because our brand *is*
orange, warning must be a distinctly yellower amber (`#F59E0B`) and orange must never appear on
a status chip, a chart series meaning "bad", or an alert badge. Confuse these and every screen
becomes ambiguous.

Section tints are **10% opacity washes** of a hue per category — enough to orient, not enough to
compete with status.

### §3.2 Type

One family (Inter / Plus Jakarta Sans — the latter is already in the driver app), one mono for
numbers and registrations (Spline Sans Mono, also already present).

| Role | Size / weight | Notes |
|---|---|---|
| Page title | 24 / 600 | One per screen |
| Section | 16 / 600 | |
| Body | 14 / 400 | The default |
| Table cell | 13 / 400 | Mono + tabular for numbers |
| Label | 11 / 500, +0.06em, uppercase, muted | Metric labels, column groups |
| Metric value | 32 / 600, tabular, -0.02em | |

**Hierarchy comes from size and weight, not colour.** Coloured headings are how the current
product signals importance; that competes with status colour and must stop.

### §3.3 Space and shape

8px base grid. Radii: 8 controls, 12 cards, 16 modals/drawers, full for pills.
Card padding 20px, section gap 24px, page gutter 32px (16px on mobile).
Table rows 44px comfortable / 36px compact — user toggle, remembered.

**Borders over shadows for static content.** A 1px `--line` on `--surface` over `--bg` reads
cleaner and stays legible in dark mode. Shadows are reserved for genuinely floating things.

### §3.4 Where glass actually goes

Exactly four places:

1. **Map control panels** — vehicle rail, filter pod, replay transport bar floating over the map
2. **Drawer scrim** — the dim behind an open drawer
3. **Popovers / hover cards** — provenance card, quick vehicle peek
4. **Sticky page toolbar** once content scrolls beneath it

Spec: `background: rgba(255,255,255,0.72)`, `backdrop-filter: blur(14px) saturate(1.2)`,
`1px solid rgba(255,255,255,0.5)`, soft shadow. **Always pair with a solid fallback** for
browsers without `backdrop-filter`, and never place a primary number inside one.

### §3.5 Dark mode

Not a bonus — fleet control rooms and night dispatchers are real. Same tokens, inverted ground
(`#1C1917` bg, `#292524` surface), status colours lifted ~10% for contrast on dark, glass becomes
`rgba(28,25,23,0.72)`. Every token defined in both from day one, or it never gets done.

---

## §4 — PROMPTS FOR DESIGN AIs

Paste §4.1 first as context, then whichever build prompt you need. These are written for
code-generating design AIs (v0, Lovable, Bolt, Figma Make) and image AIs where noted.

### §4.1 — System context (paste this FIRST, every time)

> You are designing GNB, a fleet management platform for Indian heavy-commercial-vehicle (HCV)
> operators — companies running 20–500 trucks. Users are fleet owners and operations managers,
> aged 30–60, in Kolkata/Delhi/Chennai offices. They are business people, not engineers. Many
> read Hindi more comfortably than English. They use mid-range Windows laptops and Android
> phones. **They have never been trained on this software and never will be.**
>
> The product's job: tell the owner where his trucks are, what's wrong, and where his money is
> leaking — with evidence he can act on.
>
> **Design constraints — all mandatory:**
> - Palette: brand orange `#EE6126`, ERP blue `#1E3A8A`, status green `#4CAF50` / amber `#F59E0B`
>   / red `#F44336` / grey `#94A3B8`. Ground is warm off-white `#FAFAF9`, cards `#FFFFFF`,
>   hairlines `#E7E5E4`. Text `#1A1A1A / #44403C / #78716C`.
> - **Brand orange must NEVER indicate a warning.** Status uses only the four status colours and
>   those colours are used for nothing else.
> - Every number shows: what it is, its unit, its time period, a comparison, and a freshness
>   indicator. Never an unlabelled figure.
> - Indian number formatting: `₹4,82,350` (lakh grouping), not `₹482,350`. Dates `06 Sep 2026`.
>   Times in IST with the zone shown.
> - Tabular/monospaced numerals in all tables so columns align.
> - Glassmorphism is allowed **only** on panels floating over a map, drawer scrims, popovers, and
>   sticky toolbars. **Never** on data cards, tables, KPI tiles or forms.
> - Hierarchy comes from size, weight and spacing — not from coloured headings.
> - Restrained and professional. The reference feeling is a well-cut business suit with one good
>   accent — not a showpiece, not a marketing page, no hero illustrations, no 3-D decoration,
>   no photography, no animated counters.
> - Light and dark themes, both specified.
> - Must work at 1366×768 (the common office laptop) and on a 5.5" Android screen.
>
> Deliver clean, semantic, accessible markup: real `<table>` for tables, labelled inputs,
> visible focus rings, WCAG AA contrast, full keyboard operability.

### §4.2 — Component library

> Using the context above, design a component library. Deliver every component in default, hover,
> focus, active, disabled, loading and error states, in light and dark.
>
> **Core:** buttons (primary/secondary/ghost/danger/link), inputs (text, number, search, date
> range, select, multi-select, textarea), checkbox, radio, toggle, segmented control, tabs,
> breadcrumb, pagination.
>
> **Data:** metric tile (label + big value + unit + comparison + freshness dot, per the anatomy
> in the brief), table row (default/hover/selected/expanded), column-group header, status chip,
> filter chip, freshness chip (dot + relative time + source label), progress bar, sparkline.
>
> **Feedback:** toast, inline error, confirm dialog (names the object, states the consequence,
> action verb on the button — never "OK"), empty state (illustration-free: headline, one
> explanatory sentence, one primary action), skeleton loaders matched to the real layout,
> "nothing is wrong" success state.
>
> **Overlay:** modal, right drawer, popover, hover card, command palette (⌘K).
>
> Show the metric tile in five states: healthy, warning, critical, no-data-yet, and
> feed-unavailable. **These five must be instantly distinguishable at a glance** — this is the
> most important deliverable in the set.

### §4.3 — The main dashboard

> Design the primary dashboard for an owner of 150 trucks. It answers four questions in this
> priority order, top to bottom:
>
> 1. **What needs me today?** A short list of items requiring a decision — each with the vehicle,
>    the issue in plain language, the money at stake, and one action button. When empty it must
>    say so warmly: "Nothing needs your attention — 47 trucks running normally."
> 2. **What is my fleet doing?** A row of states — Moving / Parked / No signal / Not reporting —
>    each clickable to a filtered list. Include a distinct treatment for **"Not reporting"**: this
>    product commonly has only 12 of 151 vehicles sending data, and the dashboard must say that
>    plainly and calmly rather than hiding it. This is the most important state in the design.
> 3. **Where is my money going?** Three or four metric tiles: fuel spend, idling waste, suspected
>    fuel loss, cost per km — each labelled, unitted, period-stamped, compared, with freshness.
> 4. **Where are my trucks?** A map with a scrollable vehicle rail floating over it in a glass
>    panel (the one place glass is correct here).
>
> Dense but breathable. No hero banner, no illustration, no marketing language. Give me light and
> dark, desktop at 1366px, and the phone layout.

### §4.4 — List/table page template

> Design the template every list screen in the product will use — vehicles, trips, drivers,
> alerts, invoices all share it. Show it populated with a vehicle list of 151 rows.
>
> Includes: page title + row count, a filter bar (search, date range, multi-select status chips,
> active-filter count, "clear all", saved-view dropdown), an export button (Excel primary, CSV
> secondary), a sortable table with grouped columns (Identity · Status · Performance · Cost) and
> a column-visibility menu, row density toggle, sticky header, bulk-select with a floating action
> bar, and a footer reading **"Showing 24 of 151 · 2 filters active"**.
>
> Then show the same template in five other states: loading (skeleton), empty-because-filtered,
> empty-because-never-set-up, error, and permission-denied. **Each empty state must explain what
> happened and offer the next action** — a blank table is a design failure.
>
> Also give me the mobile version where rows become cards.

### §4.5 — Trip replay with the map

> Design a trip replay screen. Full-bleed map with the completed route drawn; a directional 3-D
> truck model moves along it. Floating over the map in glass panels: a transport bar (play/pause,
> 1×–8× speed, scrub) at the bottom, and a collapsible trip-summary panel on the right.
>
> Beneath the transport bar, a synchronised speed-over-time graph. Along the timeline, event
> markers: overspeeding (red), idling (amber), stops (grey), refuelling (blue) — clicking one
> seeks to it and opens its detail in the right panel.
>
> **Critical labelling rule:** every location is named — "NH-19 near Dankuni Toll", never
> coordinates. Users are not cartographers. Show a GPS-gap state where the path is visibly
> uncertain (dashed, muted, labelled "GPS gap — 14 min") rather than a confident straight line.
>
> An event detail should read: "78 km/h for 6 minutes on NH-19 near Dankuni" with a "view on map"
> action. Light and dark.

### §4.6 — Navigation shell + the orange→blue transition

> Design the application shell. Left sidebar, collapsible, with five fleet sections —
> Live, Attention, Money, Fitness, People — then a visually separated "Setup" group and an
> existing "ERP & CRM" group, both pinned lower. Each section has one icon and one subtle accent tint.
> Badge counts appear only on Attention and ERP & CRM.
> **Do not design the interior of the ERP & CRM group — it is a single collapsed item, out of
> scope. Only the five fleet sections and Setup get designed.**
>
> The sidebar carries a gradient. In fleet sections it is orange (`#EE6126` → `#F2754A`). When the
> user enters an ERP & CRM route it transitions smoothly to blue
> (`#1E3A8A` → `#1E88E5`) over about 350ms, and back on leaving. Show: collapsed, expanded, both
> colour states, and a mid-transition frame.
>
> **Text and icons must meet WCAG AA against both gradients — give me the exact text colours that
> satisfy both.** Nothing else on the page changes colour; this is an orientation cue, not a theme
> switch.
>
> Top bar: organisation/branch switcher, global search (⌘K), a session-wide data-freshness
> indicator, notifications, profile.

### §4.7 — Settings written as sentences

> Design a settings screen where technical thresholds read as plain sentences with inline inputs,
> not as a form of labelled fields. Examples:
>
> - "Alert me when a truck goes over `[60]` km/h for more than `[3]` minutes."
> - "Flag idling when the engine runs over `[5]` minutes without moving."
> - "Warn me `[30]` days before a document expires."
>
> Each sentence gets a one-line explanation beneath it and shows what it would have matched over
> the last 30 days ("This would have flagged 47 events last month") so the user can calibrate
> before saving. Group into: Alerts · Thresholds · Notifications · Data & privacy · Team.

### §4.8 — Mobile manager app

> Design 6 React Native screens for an Indian fleet supervisor on a mid-range Android phone,
> often one-handed, often on bad connectivity, sometimes in sunlight:
> (1) Fleet Now — vehicle list with status and freshness; (2) Alerts with inline acknowledge;
> (3) Approvals queue; (4) Trip detail with a small map and an arrival estimate;
> (5) Fuel Review — correcting a failed OCR reading beside the photo of the bill;
> (6) an incoming driver SOS with live location.
>
> Large touch targets (min 48px), high contrast, minimal text, bottom-anchored primary actions,
> and an explicit offline indicator on every screen. Labels must work in both Hindi and English —
> Hindi strings run noticeably longer, so no fixed-width labels.

### §4.9 — Visual direction (for image AIs — Midjourney / Ideogram)

> UI design mood board for a professional fleet-management dashboard for Indian trucking
> companies. Warm off-white background, white cards with hairline borders, restrained orange
> accent, generous whitespace, clean sans-serif typography, tabular numbers, subtle depth.
> Calm, precise, trustworthy — the feeling of a well-organised control room, not a consumer app.
> Enterprise software aesthetic, muted and confident. Frosted-glass panel floating over a map.
> No people, no trucks as decoration, no 3-D illustration, no gradients on data, no neon.
> --ar 16:9 --style raw

---

## §5 — HOW TO JUDGE WHAT COMES BACK

Reject any design that fails these, however good it looks:

1. A number appears without a label, unit or period.
2. Brand orange is used to mean warning.
3. An empty state is a blank area with no explanation and no next action.
4. Glass or blur sits behind a number that must be read.
5. A location is shown as coordinates.
6. Status is shown as a raw constant (`INSUFFICIENT_DATA`, `NO_TELEMATICS`).
7. There is no visible difference between "zero", "no data yet" and "feed down".
8. It only works on a wide screen.
9. It requires explanation to use.
10. Motion exists that explains nothing.

Point 7 is the one designers miss most, and it is the defect this whole rebuild exists to remove.
