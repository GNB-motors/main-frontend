# 09 — Unused Packages (delete list)

Goal: identify packages that can be **safely removed** from `frontend/package.json`, separated from packages that only *look* unused (CSS imports, peer deps, dynamic imports) and must stay.

**How this was verified:** every `dependency` was grepped for real `import`/`from` usage in `src/`, then cross-checked against CSS `@import`s (`src/index.css`), `vite.config.js`, `components.json`, and peer-dependency relationships. Counts below are import-site file counts.

---

## ✅ Safe to remove now

### `shadcn` — unused runtime dependency
- **Evidence:** `grep "from 'shadcn'"` / `import 'shadcn'` in `src/` = **0 files**. `shadcn` is a **CLI generator** (it scaffolds components into `components/ui/`), not a runtime library. `components.json:2` references `https://ui.shadcn.com/schema.json` — that's the generator's config, not a runtime import. The generated components import from `@base-ui/react` + `lucide-react` + `clsx` + `tailwind-merge`, never from `shadcn`.
- **Action:** Remove from `dependencies`. If the team still scaffolds components, run it on demand with `npx shadcn@latest add ...` (or move it to `devDependencies`).
- **Risk:** None — it ships zero runtime code today.
- **Command:** `npm remove shadcn`

---

## 🔶 Product decision — the deck.gl / three 3D stack (remove *together* only if the 3D truck is cut)

These six packages exist **only** to render the 3D truck in `pages/RouteReplay/truck3d/Truck3DLayer.jsx` (the sole importer of deck.gl/loaders.gl):

| Package | Direct imports in `src/` | Note |
|---|---|---|
| `@deck.gl/google-maps` | 1 (`Truck3DLayer.jsx`) | the overlay |
| `@deck.gl/mesh-layers` | 1 | mesh layer |
| `@deck.gl/core` | 0 | **transitive peer** of the two above — don't remove individually |
| `@loaders.gl/gltf` | 1 | GLTF loader |
| `@loaders.gl/core` | 1 | loader core |
| `@loaders.gl/draco` | 0 | **companion** decoder for compressed meshes (also `public/draco/` vendored) — don't remove individually |

- **Install footprint:** ~84 MB (`@loaders.gl` ~47 MB + `three` ~25 MB + `@deck.gl` ~12 MB) for one feature file; it produces a multi-MB lazy chunk on the RouteReplay route.
- **`three`** (2 files) is used by **both** `Truck3DLayer.jsx` *and* `pages/Vehicle360/VehicleModel3D.jsx` — so `three` stays as long as the Vehicle360 3D model stays; only drop it if **both** 3D features go.
- **Action:** This is a **product call**, not a safe auto-delete. If the 3D truck replay is deprecated, remove all of `@deck.gl/core`, `@deck.gl/google-maps`, `@deck.gl/mesh-layers`, `@loaders.gl/core`, `@loaders.gl/draco`, `@loaders.gl/gltf` together (and `three` only if Vehicle360's 3D is also removed), delete `Truck3DLayer.jsx`, and drop the vendored `public/draco/`. Verify `npm run build` passes afterward.

---

## ⚠️ Looks unused but is NOT — keep these

| Package | Why it looked unused | Why it must stay |
|---|---|---|
| `tw-animate-css` | 0 JS imports | Imported in CSS: `src/index.css:27` `@import 'tw-animate-css';` |
| `@fontsource-variable/geist` | 0 JS imports | Imported in CSS: `src/index.css:29` `@import '@fontsource-variable/geist';` (the app font) |
| `cropperjs` | 0 direct imports | **Peer dependency** of `react-cropper` (used in `components/ImageCropper/ImageCropper.jsx`). Removing it breaks the cropper. Add a one-line PR note (rule 25). |
| `@deck.gl/core`, `@loaders.gl/draco` | 0 direct imports | Transitive peers/companions of the 3D stack above — only removable with the whole stack. |
| `@sentry/react` | 1 import, looks optional | Intentionally **async-loaded** (`utils/sentry.js:184` `import('@sentry/react')`) to stay out of the main chunk. Required. |
| `@tailwindcss/vite`, `tailwindcss` | not JS-imported in pages | Build/CSS pipeline (`vite.config.js`, `src/index.css:2`). Required. |
| `clsx`, `tailwind-merge`, `class-variance-authority` | low import counts (1–2) | Core of the `components/ui/` primitive layer (`cn()` helper, variant configs). Required. |

---

## 🔁 Not "unused" but **consolidation candidates** (duplicate capability)

These are used, so they're not delete-now items — but each is a dependency the codebase could shed by consolidating (details in the linked files):

| Package | Usage | Consolidation |
|---|---|---|
| `dayjs` | 28 files | Overlaps `utils/dateUtils.js` (native `Intl`). Extend `dateUtils` with IST-pinned parse/add/diff, codemod, drop `dayjs`. → [`04-architecture-code-quality.md`](04-architecture-code-quality.md) ARCH-7 |
| `leaflet` + `@react-google-maps/api` + `@deck.gl/*` | 3 map stacks | Pick a map strategy; drop one stack. → [`08-dependencies-build.md`](08-dependencies-build.md) DEP-1 |
| `framer-motion` | 2 files | Low usage (~2–3 transitions). Evaluate replacing with CSS transitions to drop ~5.6 MB. |
| `shadcn` → `devDependencies` | — | If kept for scaffolding, belongs in dev, not runtime. |

---

## Suggested order
1. `npm remove shadcn` (zero risk). 
2. Decide the 3D-truck product question → if cut, remove the deck.gl/loaders.gl stack together.
3. Schedule the `dayjs` and map-stack consolidations as refactors (they need codemods/decisions, not just `npm remove`).
4. After any removal: `npm run build` must still pass lint + test + the 600 KB bundle check; diff `dist/assets` sizes to confirm the intended chunks shrank.
