# WORKING RULES — GNB overhaul

How to verify, test, and commit on this project. Written 2026-09-06 after a session that
recovered a crashed agent's work. Every rule here exists because skipping it cost something
real. Read this before touching code; it is short on purpose.

---

## 1. Never trust a claim. Re-run it.

Agent reports, commit messages, handoff docs and this file are all *claims*. The only
evidence is a command you ran and the output you read.

This session, three claims were checked:

| Claim | Reality |
|---|---|
| Kimi: "backend overspeed 57/57, corridorEta 33/33" | ✅ true — re-ran, 90/90 |
| Kimi: "frontend vitest 386/386" | ⚠️ stale — actually 407/407 after in-flight work landed |
| Kimi: "all preparation done" | ❌ 2 tests were failing from a real bug in its own lib |

Two of three were wrong or stale. Re-running cost ~40 seconds.

**Corollary:** when you report, state what you ran and what it printed. Never restate a
number from a document as if you measured it.

## 2. When two measurements disagree, enumerate — never average

This is the standing rule on this project and it is the one most often broken.

The backend suite was measured four times and every number differed:

```
Kimi @ HEAD                 56 failed suites / 611 failed tests
Mine @ HEAD (CPU-contended) 59 failed suites / 444 failed tests
Mine @ HEAD (clean)         54 failed suites / 611 failed tests
Baseline @ ee47274          87 failed suites /  96 failed tests
```

Do not average these. Do not pick the convenient one. List them all, then find the
*discriminating* measurement. Here it was the baseline: the pre-change commit failed **more**
suites than HEAD, which settled that the failures were pre-existing and not caused by the new
code. Kimi was about to hold up two finished modules over this for want of that one run.

## 3. "Is this pre-existing?" — the baseline worktree technique

Never answer this from intuition. Answer it by running the same command at the commit before
the change.

```bash
cd /f/gnb/backend/main-backend
git worktree add /tmp/baseline <commit-before-the-change>
cd /tmp/baseline && npm install --no-audit --no-fund   # see pitfall below
SKIP_DB=1 npx jest > baseline.log 2>&1
git worktree remove --force /tmp/baseline              # always clean up
```

**Pitfall that cost 10 minutes:** do *not* `cp -r node_modules` into the worktree on Windows.
It produces `ERR_INVALID_PACKAGE_CONFIG`. Run a real `npm install`.

**Compare signatures, not just totals.** Totals move with CPU load; signatures don't:

```bash
grep -oE "buffering timed out|ECONNREFUSED|Cannot find module '[^']*'" run.log \
  | sort | uniq -c | sort -rn | head
```

Same dominant signature at both commits ⇒ environmental, not your change.

**Never run two heavy suites concurrently.** The first contended run reported 444 failures;
clean, it was 611. Contention invents failures and wastes the comparison.

## 4. Don't `tail` a run you will need to analyse

`npm test 2>&1 | tail -30` throws away the failure list. Redirect the whole thing to a file,
then grep it. This was re-run from scratch once because of it.

```bash
SKIP_DB=1 npx jest > run.log 2>&1; grep -E "^Test Suites:|^Tests:" run.log
```

## 5. The gate — run all of it before every commit

**Frontend** (`f:\gnb\frontend\main-frontend\frontend`):

```bash
npm run lint            # MUST be 0 errors. Warnings are expected (~957) — errors are not.
npx vitest run          # currently 407 passing / 31 files
npx vite build
node scripts/check-bundle.mjs
```

**Backend** (`f:\gnb\backend\main-backend`):

```bash
SKIP_DB=1 npx jest tests/unit/<yours>.test.js   # SKIP_DB=1 or every suite dies on missing Mongo
SKIP_DB=1 npx jest tests/unit/TenantScopeCoverage.test.js   # see §7
SKIP_DB=1 node -e "require('./app/app.js')"     # proves routes register and app boots
npx eslint app/modules/<yours>                  # 0 errors
```

The full backend suite is **not** a gate — it is dominated by pre-existing DB-dependent
failures (§2). Gate on your own suites plus TenantScopeCoverage plus the app-loads check.

## 6. Bundle budget — measured facts, not guesses

`scripts/check-bundle.mjs` fails the build if the entry chunk exceeds **600,000 B**. It is at
**590,423 B**. Rule 26: *the budget only goes down.* Never raise it to get green.

What actually costs entry-chunk bytes — measured, not assumed:

- **Page rollout is nearly free.** Routes are lazy (82 of them) and the chassis is already
  split into its own chunks (`PageShell` 900 B, `DataTable` 4,236 B, `ExportButton` 4,386 B
  are separate files in `dist/assets/`). Converting an existing page cost **+49 B**; adding a
  brand-new page with a route and nav entry cost **+382 B**.
- **Shell work is what eats the budget.** The +8,056 B consumed across the last session came
  from eager shell-level things: command palette, sidebar gradient, dialog provider. Workstream
  H is shell work, so it is the real risk — not the remaining page conversions.

Check where a thing landed:

```bash
ENTRY=$(grep -oE 'assets/index-[^"]+\.js' dist/index.html | head -1)
stat -c%s dist/$ENTRY
ls -la dist/assets/ | sort -k5 -n | tail -20
```

Do **not** grep minified bundles for component names to decide what is in them — names are
mangled, and a zero result proves nothing. Trust the emitted chunk *files*.

## 7. Tenant isolation — review the flag, never blind-skip it

`tests/unit/TenantScopeCoverage.test.js` statically finds Mongoose queries on org-scoped models
whose filter doesn't mention `orgId`. A missed filter is a **cross-customer data leak**.

When it flags you, the test's own header says: do not fix blindly, and do not add
`'UNREVIEWED — see F-02'` just to get green. Read the query and decide:

- Genuinely missing `orgId` → **fix the query**.
- Scoped in a way the static check can't see (e.g. a `$or` union, or `orgId` inside a `match`
  object) → add a skip entry stating *how* it is scoped, *where* the scoping value comes from,
  and *what residual risk* remains.

Worked example from this session — `overspeed.service.js:109` was flagged, and was safe
because the filter is `$or: [{ orgId }, { 'payload.registrationNumber': { $in: regs } }]` and
`regs` derives from `Vehicle.findOne({ _id: vehicleId, orgId })`. The skip entry says exactly
that, and names the residual risk (two orgs sharing a registration number). A fourth test,
"skip list carries a reason for every entry and stays honest", enforces the reason.

## 8. Repo rules that are actually enforced

- `frontend/CLAUDE.md` — 26 numbered rules, the review criteria. Most-hit: **20** lint 0
  errors before commit; **22** a bugfix starts with a failing test that reproduces it; **19**
  every route is `React.lazy()`; **14** files under 400 lines; **24** no `console.log`;
  **26** bundle budget only goes down.
- `backend/CLAUDE.md` — every new route needs `@swagger` JSDoc; every service query filters by
  `orgId`; `ApiError` from services, not ad-hoc `res.status(500)`; new features use the
  `app/modules/<name>/` layout.
- A husky + lint-staged hook runs `eslint --fix` and `prettier --write` on commit. It will
  reformat your staged files. Expect the diff to differ slightly from what you wrote.

## 9. Scope boundary — FMS only

Do not modify `src/pages/Erp*`, `src/components/Erp/`, or `/api/erp/*`. The sidebar
orange→blue gradient is the only ERP-adjacent exception.

`src/components/Erp/PageShell.jsx` is a **different, pre-existing component** from
`src/components/ui/PageShell.jsx`. Eight ERP pages import the ERP one. That is correct, not a
rollout gap. (This session briefly mis-flagged it as a scope violation — checking
`git log` on the files disproved it in one command.)

## 10. Commit discipline

- Small, working increments. The branch is pushed on a schedule whether or not you are
  finished, so **never leave the tree in a non-building state.**
- The message body carries the *why*, the reasoning behind any judgement call, and the gate
  numbers you actually observed. Kimi's batch-2 body is a good model: it documented a
  deliberate deviation ("FilterBar skipped — bounded model rows; chart is already the index")
  rather than hiding it. Subject lines are loose shorthand; put the truth in the body.
- **Never append `Co-Authored-By` or any AI attribution** to commits or PR bodies. Standing
  owner preference.

## 11. Reporting

State what you ran, what it printed, and what is still unfinished. If you skipped something,
say so. If a number here differs from what you measure, report the difference — do not restate
this file. Distinguish *verified* from *claimed* every time.

---

## Current state at time of writing (2026-09-06 07:30 IST)

```
frontend  revamp/frontend-audit-fixes  ahead 20, clean
          eslint 0 errors / 957 warnings · vitest 407/407 · entry 590,423 B / 600,000 B
backend   staging                      ahead 5,  clean
          overspeed 57/57 · corridorEta 33/33 · TenantScopeCoverage 4/4 · app.js loads
```

Remaining: **0.7** 49 of 59 pages · **0.10** 49 files over the 400-line cap
(`TripFormPage` 1,194 is worst) · **0.11** mobile, not started · **0.12** replay/3-D, not
started · **H** redesign, not started.

**Unclosed risk:** none of the new endpoints (`/api/overspeed`, `/api/corridor-eta`,
`/api/search`, `/api/places/resolve`) has been exercised against a running backend. Committed
and unit-tested is not the same as working.
