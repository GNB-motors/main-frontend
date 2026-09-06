# HANDOFF — Workstream H (design), steps 3–6 — session 2

Paste this as the opening message of a fresh Claude session. Self-contained.
Supersedes `HANDOFF_WORKSTREAM_H_2026-09-06.md` — that one's two blockers are now resolved.

**Shareable copy** — passwords removed; ask Devayan for the two logins.

---

You are continuing the visual design application on the GNB fleet platform. Steps 1 and 2 are
done and committed; steps 3–6 are yours.

## Read first

1. `f:\gnb\WORKING_RULES_2026-09-06.md` — verification discipline. Non-optional. Exact gate
   commands, and why the full backend jest suite is not a gate.
2. `f:\gnb\SONNET_DESIGN_INSTRUCTIONS_2026-09-06.md` — the Workstream H brief, §3/§3a (sidebar
   analysis) and §6 (step list). **§6 step 1 is stale** — it names `TripFormPage.jsx` as the top
   WS0.10 target; that file was deleted as unrouted dead code.
3. Design source of truth: `f:\gnb\Application Shell Design Proposal\*.dc.html` — six real HTML
   artboards. **Not** the PNG "DESIGN SYSTEM" sheet, which is template filler (its dashboard is a
   laundry business) and the owner rejected it.

## ⚠️ You are not alone in this repo

Kimi runs concurrently in the **same working tree** (not a worktree), doing WS0.7/WS0.10 page
conversions in `src/pages/*`.

**Kimi was paused at 14:00 IST mid-`FieldAgentFuelUploadPage`.** Its work was complete and green,
so it was committed on its behalf as `813c5b1` and pushed. The tree is clean; when Kimi resumes it
should move to the next page, not re-do that one. If you resume it, tell it the commit already
exists.

- **Yours:** `src/index.css`, `src/components/ui/*`, `src/components/Sidebar.css`,
  `DashboardLayout.*`
- **Kimi's:** `src/pages/*`
- **`git add <explicit paths>` only. Never `git add -A` or `git add .`.** A broad add sweeps up
  Kimi's staged files — this happened once (`8cb102a` swallowed Kimi's staged deletions).
  Run `git status -s` and `git diff --cached --stat` before every commit.
- **The gate is a moving target while Kimi works.** At 13:45 IST a gate run reported
  `FAIL src/pages/FieldAgentFuel/fuelUploadUtils.test.js`. Eight minutes later, same commit:
  576/576 passed. It was Kimi mid-edit, not a real regression. Before you chase a red gate,
  re-run it — don't file a bug against another agent's half-written file.
- **`git status -sb | head -1` shows only the branch line and hides every dirty file.** It fooled
  me into calling a dirty tree clean. Use `git status --porcelain` when you actually need to know.

## Done — do not redo

**`44b4cc3` — step 1, design tokens** (deliberately a visual no-op). In `src/index.css`, existing
`:root` brand block ~line 449:

```
--orange #EE6126   --orange-solid #B8460F   --orange-hover #9E3B0B
--orange-tint #FDF1EB   --accent-ink #B8460F
--erp #1E3A8A   --erp-tint #EEF2FB   --erp-ink #16296B
--ds-line #E7E5E4   --ds-sunk #F5F5F4
--ds-radius-sm/md/lg 8/12/16px   --ds-shadow   --ds-shadow-lg
```

**`30753f9` — step 2, neutral nav rail.** Appended as an override block at the end of
`src/components/Sidebar.css` (supersedes the §H.3 gradient at the top of that file; kept as an
override so it reverts as one unit).

Both are confirmed live in a real browser: `--orange` resolves to `#ee6126` and `--orange-tint`
to `#fdf1eb` on `document.documentElement` at `localhost:5173`.

## Three decisions already settled — build on them, don't reopen

**1. Orange is an accent, not a surface.** The canvas floods the rail with `#EE6126` under a
`rgba(20,12,6,.38)` scrim, compositing to `#9B411A` — a dark brick. That is the "weirdly dark"
rail the owner rejected, and the same maroon defect still live on prod. The scrim is not ported.
Rail is neutral; orange appears on the active item, the logo, the mode indicator.

**2. Two oranges, because one can't do both jobs.** `#EE6126` is ~3.4:1 on white — fine for a 3px
edge or a chip, **fails AA for text**. Use `--accent-ink` (`#B8460F`, ~5.8:1) for orange text and
icons. Never set label text in `--orange` on a light surface.

**3. Brand must not out-shout status.** Orange sits between `--critical` (#D13A40) and `--caution`
(#D98E13) in hue. On an ops screen those mean *a truck needs attention*. Keep brand quieter — that
is the functional reason the rail is neutral, not taste.

**Light-only for now.** Dark mode deferred by the owner. `.dark` does not override the new tokens,
so dark inherits light values — `--orange-tint` is near-white and is **not** safe as a surface on
a dark ground. Don't ship a dark-mode claim.

## ✅ The backend is up — you are not styling blind

The previous handoff said you couldn't see your own work. That is fixed.

**The dev box changed IP.** `13.232.78.42` is dead. The live box is **`43.205.43.18`**.
`frontend/.env` already points at `https://43.205.43.18.nip.io/v1` (old value preserved in
`.env.bak-2026-09-06`). Everything documented in `HANDOFF.md` §3 with the old IP needs mental
substitution.

**Local Docker is wedged and you do not need it.** The `docker-desktop` WSL distro is `Stopped`
while Docker Desktop's UI processes run, so `docker version` hangs on the named pipe.
`docker desktop start` no-ops ("already running"); `docker desktop restart` fails to stop its own
processes. A stale docker port-proxy squats on `:3000`. Unwedging needs force-killing Docker
Desktop. **Don't bother** — the dev box serves everything.

**Verified end-to-end** (real Chromium at `localhost:5173`, not curl alone): page renders, CORS
allowlist accepts `localhost:5173`, `POST /v1/api/auth/login` returns a real app-level response.
The chain dev-server → nginx → Express → Mongo works.

**Logins:**
- `test@gmail.com` / `<ask Devayan>` — normal user, org has 10 vehicles
- `superadmin@gnbedge.in` / `<ask Devayan>` — super admin

**Vite is already running** on `http://localhost:5173` serving this branch.

## ✅ Backend deployed — the four "never hit" endpoints are live

They were built and pushed but never deployed; the box was 5 commits behind. Deployed this
session: `3327204` → `443bcb7`, fast-forward, `docker compose restart app`. No `package.json`
change, no new env vars.

Verified with a real token:

| Endpoint | Result |
|---|---|
| `GET /api/search?q=JH02` | **200** — real vehicles `JH02BX1429`, `JH02BX4980` |
| `POST /api/places/resolve` | **200** — graceful `UNMAPPED` |
| `GET /api/corridor-eta/stats` | **200** — `sampleSize: 0` |
| `GET /api/overspeed/events` | **422** — *"missing data is not zero events"* (correct refusal) |

**Probe them at their real paths.** `tenantGuard` does *not* 401 on an unmatched sub-path, so a
bare `GET /api/overspeed` returns 404 even when mounted. The routers define `GET /events`,
`GET /stats`, `POST /resolve`, and `GET /` respectively.

## ⚠️ Two data landmines — these will waste your day

**1. The database is `test`, not `express-msc-db`.** `docker-compose.yml` defaults `MONGO_URI` to
`express-msc-db`. That database exists and is **completely empty** — every collection returns 0,
which reads exactly like "the feature is broken." The app uses db `test`. Catch it by
cross-checking a collection you know has data: `vehicles` = 0 in `express-msc-db`, 27 in `test`.

**2. The demo org has zero telemetry.** In db `test`: `livevehiclepositionhistories` = **77,141**,
`livevehiclepositions` = 152 — but **all 10 vehicles on `test@gmail.com` return 0 trail points
across all of 2026**. The 77k breadcrumbs belong to a different org among the 27 vehicles. Also
`trips` = 0 and `arrivalevents` = 0 org-wide, which is why corridor-eta reports `sampleSize: 0`.

Consequence: live tracking, overspeed, corridor ETA and any replay UI render **empty** on that
login. That is the data, not your CSS. Don't "fix" it in the frontend.

## ⚠️ Vercel builds in UTC — pin IST on anything that renders a wall clock

The Vercel build ran `npm run build`, which runs the test suite, and failed on
`src/lib/etaBand.test.js`: `expected 'Arriving Mon ~8AM–1PM' to be 'Arriving Mon ~2PM–7PM'`.
A 5h30m gap. `formatBand` used bare `dayjs`, which formats in the runtime's ambient timezone —
right on an Indian laptop, wrong in a UTC container. Fixed in `472e85b` by pinning
`Asia/Kolkata` via the dayjs `utc`+`timezone` plugins.

**The convention already existed** in `pages/FuelComparison/formatIST.js` and
`pages/FuelIntegrity/fiDates.js`; `etaBand.js` was the one module that never pinned a zone. If
you add anything that formats a date or time for display, pin IST the same way — otherwise it
passes on your machine and breaks the Vercel build. Reproduce any suspected case with
`TZ=UTC npx vitest run`.

## Your steps

3. **Primitives** — buttons, inputs, chips, cards per `GNB Components.dc.html`, in
   `src/components/ui/`. High visual return, low risk: all 25 chassis pages consume them.
4. **Dashboard widgets** — `GNB Dashboard.dc.html` has the real ones: *Fleet right now*,
   *Needs you today*, *Idling waste*, *Fuel spend*, *Cost per km*, plus honest failure states
   ("Nothing needs your attention", "Feed down", "No signal"). Build against existing data hooks.
   **Do not invent metrics no endpoint serves** — render the empty state and say so in the commit.
   Given the telemetry gap above, expect to be writing empty states for real.
5. **List template** — `GNB List Template.dc.html` maps onto the existing chassis. Restyle
   `PageShell`/`FilterBar`/`DataTable` **once**; every converted page inherits it. Never restyle
   pages individually. **Highest-leverage step** — it also covers whatever Kimi converts while
   you work.
6. **Settings / Trip Replay** — only if time remains. See the note on the junior below.

## Verified state — gate run at 14:05 IST, not copied from a log

```text
frontend  revamp/frontend-audit-fixes   813c5b1   level with origin (pushed this session)
          eslint  0 errors / 886 warnings
          vitest  576 passed (45 files)
          build   ok
          bundle  590,668 B <= 600,000 B   (9,332 B headroom)
backend   staging   443bcb7   level with origin AND deployed to the dev box
```

WS0.7 chassis: **26 of 70** non-ERP pages → **44 left**.
WS0.10: **46** non-ERP files over 400 lines.
WS0.11 mobile and WS0.12 replay: not started.
The 38 `Erp*` page directories are outside all of these counts.

CSS costs 0 bytes against the bundle guard, so steps 3–6 are essentially free against the
9,341 B headroom.

## Open items

- **The Vercel deployment may be stale.** `main-frontend-wine.vercel.app/login` was showing a
  dark maroon panel with blue inputs — not the neutral rail. If that project tracks
  `revamp/frontend-audit-fixes`, the push made this session will rebuild it. If it tracks
  something older, teammates are looking at the old design. Confirm before pointing anyone at it.
- **Trip Replay as a junior task.** Backend already exists:
  `GET /api/livetracking/positions/:reg/trail` (`from`/`to`/`limit` ≤ 5000). Well-isolated —
  collides with neither Kimi nor Workstream H. But `trips` = 0, so it must be scoped as *vehicle
  path replay over a time window*, not trip-scoped; and it needs the org that owns the 77k
  breadcrumbs, or fixtures. Do not hand a junior the `test@gmail.com` login for this.
- **Two stale worktrees**: `backend/main-backend-wa` and `backend/wt-p0` both track remote
  branches marked `[gone]`, each with a dirty file. Unrelated to today.

## Working preferences the owner has stated

- **Don't auto-drive the browser.** No unprompted Playwright walkthroughs. Probing APIs headlessly
  is welcome; when verification needs the UI, say what page and what to look for, then stop and
  ask. The owner is usually at the machine and will just look.
- Evidence before claims, always. Re-run rather than cite a log.
