---
name: gnb-frontend
description: How to build UI in the GNB fleet-management frontend (main-frontend/frontend — Vite + React 19 + Tailwind v4 + shadcn/base-ui). Use for any page, component, modal, table, chart, route, or styling work in this repo. Covers the data layer (apiClient/services), design tokens, the three coexisting styling systems, routing + feature-flag wiring, and the specificity traps in index.css.
---

# GNB Frontend

App root is `main-frontend/frontend/` (not the repo root). Run everything from there.

```bash
npm run dev      # vite, http://localhost:5173
npm run lint     # eslint — must pass before done
npm run build    # vite build; only for verifying a prod-only issue
```

Plain JavaScript + JSX. **No TypeScript, no tests.** `@/` → `src/`. Env: `VITE_API_BASE_URL`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_PROFILE_AUTO_FETCH`.

## Before writing code

Grep the feature name across `src/pages/`, `src/utils/`, and `src/App.jsx`. Read the nearest existing page that does the same *shape* of thing (table+filters, detail view, wizard, modal form) and match it. `CHANGELOG.md` is maintained per-branch and is the fastest map of recent work — read the top entries, and add one when your change is user-visible.

The newest, cleanest reference implementations:
- Table + filters + pagination → [KhataLedger/components/DriversTab.jsx](frontend/src/pages/KhataLedger/components/DriversTab.jsx)
- Tabbed page shell → [KhataLedger/KhataLedgerPage.jsx](frontend/src/pages/KhataLedger/KhataLedgerPage.jsx)
- Service module → [KhataLedger/KhataLedgerService.js](frontend/src/pages/KhataLedger/KhataLedgerService.js)

Older pages (Trip, RequestForm, Drivers, Onboarding) use class services, `Component/` folders, and hand-written CSS. Read them for behavior; don't copy their structure into new code.

## Feature layout

```
src/pages/<Feature>/
  <Feature>Page.jsx          # route component
  <Feature>Service.js        # all API calls for the feature
  utils.js                   # enums, label maps, badge colors, formatters
  components/                # sub-components (lowercase — older folders use Component/)
```

Shared-across-features code goes in `src/components/` (component dir + colocated `.css` if it needs one) or `src/utils/`. Don't add new top-level dirs under `src/`.

## Data layer

Every request goes through `apiClient` from `@/utils/axiosConfig`. It injects `Authorization` and `X-Org-Id`, auto-logs-out on 401, and attaches `error.userMessage` on 429. Default timeout is 10s — pass a larger `timeout` for uploads/OCR.

Never import `axios` directly and never use `fetch` in new code. A handful of legacy files do (`SuperAdminPage`, `LoginPageService`, `VehicleService`, …); leave them, don't add more.

Service modules are plain object literals with async methods:

```js
import apiClient from '../../utils/axiosConfig';

const unwrap = (res) => res.data?.data || res.data;

const KhataLedgerService = {
  getDrivers: async (params = {}) => unwrap(await apiClient.get('/api/khata/drivers', { params })),
  createExpense: async (data) => unwrap(await apiClient.post('/api/expenses', data)),
};

export default KhataLedgerService;
```

Components never call `apiClient` directly — they call the service. Backend envelopes are inconsistent, so unwrap defensively at the call site too: `data.results || data.items || data || []`.

## Page conventions

Pages render inside `DashboardLayout` → `.page-content`. Standard page root and header:

```jsx
<div className="space-y-5 p-1">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
        <BookOpen size={24} style={{ color: 'var(--primary-color, #4f46e5)' }} />
        Khata Ledger
      </h1>
      <p className="text-sm text-muted-foreground">One line saying what this page is for</p>
    </div>
    {/* primary action */}
  </div>
  {/* content */}
</div>
```

**Use `space-y-5`, not `space-y-6`, at page root.** `index.css` has `.page-content > .space-y-6 { background: var(--canvas); border-radius: 20px; padding: 24px }` plus heading-font rules targeting `> div:first-child h1`. That is the Overview "operations console" treatment and it will silently swallow any other page that uses `space-y-6` at the top level.

Other recurring patterns, all visible in `DriversTab.jsx`:
- **Search** — 400ms debounce: `searchInput` state → `setTimeout` in an effect → `search` state → included in the fetch callback's deps.
- **Fetching** — `useCallback` fetcher with filters in deps, called from an effect. `eslint-plugin-react-hooks` runs at `recommended-latest`, so exhaustive-deps is enforced; don't suppress it.
- **Pagination** — server-driven `{ page, totalPages, totalResults }` in a `meta` state; reset to page 1 on any filter change.
- **Loading** — `Skeleton` from `@/components/ui/skeleton`, `TableShimmer` for tables, `LottieLoader` for full-page waits.
- **Errors** — `toast.error(err?.response?.data?.message || err?.message || 'Failed to load X')` from `react-toastify`. Don't render raw error objects.
- **Tab state in URL** — `useSearchParams`, so tabs survive a refresh and are linkable.

`console.log/warn/info/debug` are stripped at build time by the Vite `pure` config; `console.error` survives. Debug logs are fine to leave, error logs are meaningful.

## Styling

Three systems coexist. In order of preference for new code:

1. **Tailwind v4 + shadcn** — the default. There is no `tailwind.config.js`; the theme lives in `src/index.css` under `@theme inline`. Compose classes with `cn()` from `@/lib/utils`.
2. **Inline `style={{}}`** — acceptable, and required for anything keyed to the runtime theme color (`var(--primary-color)`), since Tailwind can't emit a class for a value that changes at runtime.
3. **A colocated `.css` file** — only when extending a page that already has one.

MUI (`@mui/material`, `@mui/x-data-grid`, `@mui/x-date-pickers`) is used in ~15 files. Don't introduce it into a page that doesn't already use it.

### UI primitives

`src/components/ui/` is shadcn style `base-nova`, built on **`@base-ui/react`, not Radix**. Copying stock shadcn/Radix snippets from the web will not work — read the local file first. Available: `avatar, badge, button, calendar, card, dialog, input, label, pagination, popover, select, separator, skeleton, table, tabs`, plus `TableShimmer`. Adding a new primitive: `npx shadcn@latest add <name>` from `frontend/`, then check it against `components.json` (`style: base-nova`, `tsx: false`).

Icons are `lucide-react` at `size={16..24}`. `@mui/icons-material` only inside MUI pages.

**Dialogs** use `@/components/ui/dialog`, whose overlay/content sit at `z-[10050]`/`z-[10051]` — deliberately above legacy side panels and map overlays that live at 9999–10001. Any custom overlay you write must clear those too.

### Tokens

Read the token blocks at the top of [index.css](frontend/src/index.css) before picking a color. The important ones:

- `--primary-color` / `--primary` — **per-org runtime theme color.** `colorTheme.js:applyThemeToRoot()` writes it onto `:root` from localStorage on layout mount and on the `themeColorChange` event. Never hardcode indigo `#4f46e5` for a themed accent; use `var(--primary-color, #4f46e5)`.
- shadcn oklch tokens (`--background`, `--foreground`, `--muted-foreground`, `--border`, `--card`, `--destructive`, `--chart-1..5`) — reach for the Tailwind classes (`text-muted-foreground`, `bg-card`) rather than the raw vars.
- Console tokens (`--canvas`, `--ink`, `--accent` teal, `--signal-high/med/low`) — Overview-page vocabulary. Don't spread them elsewhere without a reason.
- Fonts: Montserrat body, `--font-display` Space Grotesk, `--font-mono` JetBrains Mono.

Numeric data uses the `.num` class (tabular JetBrains Mono) — every ₹ amount, km/L, %, and timestamp in a table or stat. Vehicle registrations use `.reg-plate`. Section labels use `.console-eyebrow`.

Money is ₹ (`formatCurrency` in the feature's `utils.js`). Dates go through `@/utils/dateUtils` (`formatDateIST`, `formatDateTimeIST`, …) — the fleet runs on IST and raw `toLocaleDateString()` will be wrong for users elsewhere. Entity display names go through `@/utils/dataFormatters` (`getDriverName`, `getVehicleRegistration`), which handle the populated-vs-ObjectId-string ambiguity the API returns.

### The no-`!important` rule

`index.css` states it and holds to it: overrides win by specificity, scoped under `.page-content` or a component class chain. Keep it that way. If a style isn't applying, find the competing selector and out-specify it — don't reach for `!important`, and be careful not to write a `.section`-vs-`.cta` pair of rules that cancel each other on padding/margin.

Charts are `recharts`; tooltip, grid, and axis-tick styling is already themed globally in `index.css`.

## Wiring a new page

1. `src/App.jsx` — add the `<Route>` inside the `DashboardLayout` group (public routes and `/superadmin` are separate groups above it).
2. `src/utils/sideNavUtils.js` — add to `SIDE_NAV_ITEMS`. It's the single source of truth for the sidebar; `Sidebar.jsx` just maps it. A `type: 'link'` item needs `{ key, to, label, icon }`; a `type: 'group'` needs `children[]` and `matchRoutes[]` (include deep/hidden routes so the group stays expanded).
3. **Feature flag** — the `key` gates visibility via `isEnabled(key)`; `key: null` means always show. Flags come from `/api/auth/me` → `organization.featureFlags` through `useFeatureFlags()` in `@/contexts/FeatureFlagsContext`. A route with no nav entry is still reachable by URL; gate in-page too if it must be hidden.
4. `src/utils/featureFlagRoutes.js` — if the feature is a plausible landing page, add it to `FLAG_TO_ROUTE` (order = preference after login).
5. Sub-routes (`/feature/:id`, `/feature/add`) are siblings in `App.jsx`, not nav entries.

## Definition of done

- `npm run lint` passes. Note `no-unused-vars` is an **error** with `varsIgnorePattern: '^[A-Z_]'`.
- Loaded the page in `npm run dev` and exercised the real flow — there are no tests, so this is the only verification that exists.
- Loading, empty, and error states all render something deliberate. An empty table needs a sentence telling the user what to do, not a blank box.
- Responsive down to mobile: the header row pattern (`flex-col` → `sm:flex-row`) and horizontally scrollable table wrappers.
- Keyboard focus visible, `prefers-reduced-motion` respected (already honored for cards in `index.css`).
- New route: `App.jsx` + `sideNavUtils.js` + flag key all wired.
- `CHANGELOG.md` entry if the change is user-visible.

## Design judgment

Two different modes, and picking the wrong one is the most common way UI work here goes wrong:

**Inside the dashboard** (anything under `DashboardLayout`) consistency beats novelty. This is an operations tool used daily by fleet owners and managers; it should feel like one instrument, not a gallery. Match the neighboring page, use the existing tokens and primitives, and spend effort on density, scan-ability, and honest empty/error states instead of on a new visual idea. Numbers in mono, one accent, quiet chrome.

**Net-new marketing or standalone surfaces** (landing, contact, onboarding, a pitch page) are where a real point of view belongs. For those, [frontend_SKILL.md](frontend_SKILL.md) at the repo root is the design-direction reference — brainstorm tokens and a signature element before coding, avoid the templated cream/serif/terracotta defaults, and let the subject (trucks, diesel, routes, weighbridges, khata ledgers) supply the vocabulary.

Copy is design material in both modes: name things the way an owner or manager would say them, active voice on buttons, the same verb from button to toast ("Add Fuel" → "Fuel added"), and errors that say what went wrong and what to do next.
