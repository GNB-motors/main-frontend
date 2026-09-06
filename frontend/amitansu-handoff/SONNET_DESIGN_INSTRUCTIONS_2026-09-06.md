# SONNET — Workstream H (design application). Read fully before any edit.

You are applying the visual design to the GNB fleet platform. This runs on a hard deadline
with a live presentation at the end of it. **The single worst outcome is a broken build or a
broken page.** A partially-applied design that works beats a fully-applied design that doesn't.

Read `f:\gnb\WORKING_RULES_2026-09-06.md` first. It is the verification discipline for this
project and it is not optional.

---

## 0. Do NOT start until Kimi is finished

Kimi is working the same two repos. Two agents editing the same tree will corrupt each other's
work. Before your first edit, confirm Kimi has stopped:

```bash
cd /f/gnb/frontend/main-frontend && git log -1 --format="%h %ar %s"
cd /f/gnb/backend/main-backend  && git log -1 --format="%h %ar %s"
git status -s        # in both
```

Start only when **all** of these hold:
- The newest commit in each repo is **more than 20 minutes old**, and
- `git status -s` is **empty in both repos** (no half-written files from a crashed agent), and
- The owner has confirmed Kimi's quota is exhausted.

If `git status` is dirty, Kimi died mid-run. **Do not delete or stash its files.** Validate
them, get them green, commit them, and only then start your own work. (That is exactly what
happened at 06:40 today — two sub-agents' files were on disk, one had a real bug, and all of
it was recoverable.)

## 1. Prime directive: never leave the tree broken

The branch is pushed on a schedule whether or not you are finished.

- **One logical change per commit.** Every commit must build. Never batch the whole redesign
  into one commit — if step 4 breaks something you must be able to `git revert` step 4 alone.
- **Run the full gate before every commit:**
  ```bash
  cd /f/gnb/frontend/main-frontend/frontend
  npm run lint            # MUST be 0 errors (≈957 warnings is normal)
  npx vitest run          # MUST be 407+ passing
  npx vite build
  node scripts/check-bundle.mjs
  ```
- If the gate fails and you cannot fix it in **two attempts**, `git checkout -- .` and report.
  Do not keep pushing at a broken build.
- Never raise the bundle budget in `scripts/check-bundle.mjs` (frontend rule 26).

## 2. The source of truth is the canvas, NOT the PNG sheet

Two design artifacts exist. They are not equal.

| Artifact | Status |
|---|---|
| `f:\gnb\Application Shell Design Proposal\*.dc.html` (6 artboards) | ✅ **Authoritative.** Real GNB fleet content, proper token separation, honest empty states. |
| The PNG "DESIGN SYSTEM" sheet | ⚠️ **Reference for tokens only.** Its dashboard is template filler from a laundry business ("Total Revenue", "Premium Wash", "Dry Cleaning"). The owner has explicitly rejected it as below the mark. |

**Never copy content, layout or IA from the PNG sheet.** Take colour/type/radius values from it
only where the canvas agrees.

The canvas artboards: `GNB App Shell`, `GNB Dashboard`, `GNB Components`, `GNB List Template`,
`GNB Settings`, `GNB Trip Replay`. They are plain HTML — read them, don't guess from the
thumbnails.

## 3. The orange problem — the owner's explicit feedback

The owner rejected both PNG variants: the watercolour one reads **too dark**, the flat one is
**"too bright, hurting eyes, looks weird."** Both failures have the same cause: the design
floods the entire full-height nav rail with
`linear-gradient(168deg, #F2754A 0%, #EE6126 55%, #E15318 100%)`. At that surface area a
fully-saturated orange is punishing to look at for an 8-hour dispatcher shift.

### 3a. The "weirdly dark" sidebar — root cause found, do not re-diagnose

The rail does not render as the bright orange its gradient specifies. `GNB App Shell.dc.html`
line 68 lays a full-bleed overlay across the whole rail:

```html
<span aria-hidden="true" style="position:absolute; inset:0; background: var(--nav-scrim);">
--nav-scrim: rgba(20,12,6,.38)
```

38% of a near-black brown over `#EE6126` composites to:

```
R = 0.62×238 + 0.38×20 = 155
G = 0.62×97  + 0.38×12 =  65     →  rgb(155,65,26) = #9B411A
B = 0.62×38  + 0.38×6  =  26
```

`#9B411A` is a dark brick/maroon — the exact "weirdly dark" the owner flagged, and the same
"maroon sidebar" defect still live on prod. The scrim exists to keep white nav labels legible
over a bright gradient, but at .38 it destroys the brand colour and delivers mud: neither
legibility nor identity.

**Do not port `--nav-scrim` at .38.** The §3 treatment below removes the need for it entirely —
a neutral rail needs no scrim, because dark labels on a light surface are legible without one.
If the owner instead wants to keep a coloured rail, drop the scrim to ~.10 and darken the
*gradient stops themselves* so the colour is chosen rather than muddied. Never stack a heavy
neutral scrim on a brand colour and call the result the brand colour.

There is also a **functional** problem, which matters more than taste. In this product:

```
--red:    #F44336   = alert, something is wrong
--amber:  #F59E0B   = caution
--orange: #EE6126   = brand
```

All three are neighbours in hue. A wall of brand orange competes with the two colours that are
supposed to mean *"a truck needs your attention right now."* Brand colour must not shout louder
than alert colour on an operations screen.

**The owner decided this on 2026-09-06. It is settled — build it, do not re-open it:**

> **Neutral rail, orange accents.** Reduce the area of saturated colour; keep the identity.

**Do this — reduce the area, keep the identity:**

- Nav rail background: the neutral surface (`--card` / its dark equivalent), **not** orange.
- Orange appears only as: the active nav item (`--orange-tint` background, `--orange-solid`
  `#B8460F` label, 3px `--orange` left edge), the logo mark, and the mode indicator.
- Keep the FMS↔ERP signal: FMS = orange accents, ERP = blue accents (`--erp: #1E3A8A`). The
  mode switch still reads clearly; it just stops being a wall of colour.
- Use `--orange-solid: #B8460F` for orange **text and icons**. `#EE6126` fails contrast on
  white at body sizes; the canvas already defines the deeper value for exactly this.

Build this, then **screenshot it and show the owner before rolling it across every page.**
This is the one judgement call in the whole workstream — get it confirmed once, cheaply, rather
than applying it 59 times and being told it's wrong.

## 4. ⚠️ Biggest breakage risk: the canvas has no dark mode

The app supports dark mode via a `.dark` class (5 blocks in `src/index.css`). **The design
canvas is light-only — it defines no dark tokens at all.**

If you paste the canvas's light values into `:root` and stop, **dark mode ships broken.** This
has already bitten this project once (commit `39834fb`, "dark-mode active highlight was mud").

So: for **every** token you add or change, define the `.dark` counterpart in the same commit.
After each visual step, check both themes before committing. If you cannot derive a sensible
dark value, stop and ask — do not guess and do not leave it undefined.

## 5. Current brand tokens — the change is small and centralised

Good news: this is a token change, not a rewrite.

```
Defined in exactly one file:  src/index.css
--gnb-300: #5B9BE5    --gnb-400: #2E6FC0    --gnb-500: #1B4D8F     ← currently BLUE
Usage: 81 references across 20 files (77 of them --gnb-400)
```

The design makes the brand **orange**, so this is a brand inversion. Because it is centralised,
do it at the token level in `index.css` first and let it propagate. **Do not** hand-edit 20
files.

**Watch out:** `--gnb-400` is used as a *chart* colour (e.g. `FuelSpendPage` bars). After the
recolour, confirm on the fuel and mileage charts that brand-orange series are still visually
distinct from red-alert and amber-caution series. If they collide, keep charts on the blue
ramp and use orange for chrome only — say so in the commit message.

## 6. Order of work — stop at any point and the app still works

Commit after each step, gate before each commit.

1. **Tokens.** Add the canvas palette to `src/index.css` (`--orange`, `--orange-solid`,
   `--orange-tint`, `--accent-ink`, `--erp`, `--line`, `--sunk`, `--ink`, tints/inks for
   green/red/amber/grey, `--shadow`, `--shadow-lg`, radius 8/12/16). **Add `.dark` values for
   every one.** Change nothing visual yet — this commit should be a no-op on screen.
2. **App shell.** Nav rail + top bar per `GNB App Shell.dc.html`, with the §3 reduced-orange
   treatment. Screenshot both themes. **Show the owner. Wait for confirmation.**
3. **Primitives.** Buttons, inputs, chips, cards per `GNB Components.dc.html` — the shadcn
   components in `src/components/ui/`. This is where you get the most visual change for the
   least risk, because every page already uses them.
4. **Dashboard widgets.** The owner noted the widgets aren't there. `GNB Dashboard.dc.html` has
   the real ones: *Fleet right now*, *Needs you today*, *Idling waste*, *Fuel spend*,
   *Cost per km*, and the empty/failure states ("Nothing needs your attention", "Feed down",
   "No signal"). Build these against the existing data hooks — **do not invent metrics that no
   endpoint serves.** If a widget needs data that doesn't exist, render its honest empty state
   and say so in the commit.
5. **List template.** `GNB List Template.dc.html` maps onto the existing chassis
   (`PageShell` / `FilterBar` / `DataTable`). Restyle the chassis once; every converted page
   inherits it. Do not restyle pages individually.
6. **Settings / Trip Replay.** Only if time remains.

## 7. Bundle budget — this workstream is the one that threatens it

Entry chunk is at **590,423 B** against a **600,000 B** guard: ~9.5 KB of headroom.

Measured on this project: page rollout is nearly free (+49 B to +382 B, routes are lazy and the
chassis is already split into its own chunks). **Shell-level work is what consumes the entry
chunk** — the last session's +8,056 B came from the command palette, sidebar gradient and
dialog provider. Steps 2 and 3 above are shell work. So:

- Run `node scripts/check-bundle.mjs` after **every** step, not just at the end.
- CSS-only changes are effectively free. New eager JS in the shell is not.
- Any new heavy dependency must be a dynamic `import()` inside a handler, the way
  `ExportButton` loads `xlsx`. Adding a dependency at all needs justification (rule 25).
- If you approach the guard, the fix is to lazy-load or delete — never to raise the budget.

## 8. Do not touch

- `src/pages/Erp*`, `src/components/Erp/`, `/api/erp/*` — out of scope, all of it.
  The **only** ERP-adjacent item in scope is the sidebar accent switching to blue on ERP routes.
- `src/components/Erp/PageShell.jsx` is a **different, pre-existing component** from
  `src/components/ui/PageShell.jsx`. Eight ERP pages import the ERP one. That is correct.
  Do not "unify" them.
- Backend. This workstream is frontend-only.
- `scripts/check-bundle.mjs` budget value.
- Any test file, unless you are fixing a test you legitimately broke.

## 9. Repo rules that get enforced on you

`frontend/CLAUDE.md` is 26 numbered rules and is the review criteria. The ones this workstream
trips over: **19** every route lazy · **14** files under 400 lines · **16** UI primitives from
`components/ui/` + `lucide-react` only, no new component libraries · **17** interactive elements
are `<button>`/`<a>`, never `<div onClick>` · **18** every `<img>` has a real `alt` · **24** no
`console.log` · **26** budget only goes down.

A husky + lint-staged hook runs `eslint --fix` and `prettier --write` on your staged files, so
the committed diff will differ slightly from what you wrote. That is expected.

**Never append `Co-Authored-By` or any AI attribution to commit messages.** Standing owner
preference.

## 10. Stop and ask — do not improvise on these

- ~~The §3 orange treatment~~ — **decided: neutral rail, orange accents.** Build it. Still
  screenshot the shell in both themes and show the owner once before rolling it across pages,
  but do not wait on an answer to proceed.
- Any token you cannot derive a dark-mode value for.
- Anything that would require an ERP change.
- Anything that would need a new backend endpoint.
- The gate failing twice on the same change.
- Any choice between "matches the mockup exactly" and "doesn't break a working page" — the
  working page wins every time, and you report the deviation rather than silently resolving it.

## 11. How to report

State what you ran and what it printed. Distinguish what you **verified** from what you
**assume**. Name what you did not finish. If a number in this document differs from what you
measure, report the difference — do not restate this file.

---

### State when this was written (2026-09-06 ~07:45 IST)

```
frontend  revamp/frontend-audit-fixes   ahead 20, clean
          eslint 0 errors · vitest 407/407 · entry 590,423 B / 600,000 B
backend   staging                       ahead 5,  clean
```

Unclosed: `/api/overspeed`, `/api/corridor-eta`, `/api/search`, `/api/places/resolve` are
committed and unit-tested but have never been exercised against a running backend. If the demo
touches those pages, that gap matters more than any styling.
