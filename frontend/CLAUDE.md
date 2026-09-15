# GNB Motors Frontend — Coding Rules

Machine-readable review criteria for every PR. 4 sections, 26 rules.

## 1. Hooks & State (7 rules)

1. All hooks run on every render — no early `return` above any hook. Guards go below hooks or inside effects.
2. `key` is always a stable unique id (`item._id`, `item.id`) — never `key={index}`.
3. An effect that only calls setters and has no subscriptions/timers/network → delete it; compute inline or with `useMemo`.
4. Debounced input → `useDeferredValue`, not timer+state+effect.
5. More than 8 `useState` in one component → consolidate into `useReducer` with typed actions.
6. Dialog/modal state is a discriminated union: `{ kind: 'add' } | { kind: 'edit', item } | { kind: 'delete', item } | null` — not N booleans + nullable objects.
7. `useMemo`/`useCallback` only under a `React.memo` boundary — otherwise remove the hook.

## 2. Data & Boundaries (6 rules)

8. All data fetching goes through `useApi` / `useMutation` — no raw `apiClient` calls in components.
9. Every fetch passes an `AbortSignal`; navigation away aborts the request.
10. Every API response is parsed with its zod schema (`schemas/`) before use.
11. `localStorage` is touched only by `utils/session.js` — nothing else calls it directly.
12. API failures surface as typed `ApiError` with status, requestId, and response body — never bare `e.message`.
13. No empty catch blocks — handle, comment why it's safe to ignore, or rethrow.

## 3. Components & Files (6 rules)

14. One component per file; files stay under 400 lines. Split when crossing the cap.
15. One export per file (companion variant/config exports like shadcn `buttonVariants` are the documented exception).
16. UI primitives come from shadcn (`components/ui/`) + `lucide-react` icons only — no new component libraries.
17. Interactive elements are `<button>`/`<a>` — not `<div onClick>`.
18. Every `<img>` has a meaningful `alt`.
19. Every route is `React.lazy()` — the app shell, providers, ErrorBoundary, and the Suspense fallback are the only eager imports.

## 4. Process (7 rules)

20. `npm run lint` is always 0 errors before committing.
21. New logic goes in a pure module (`.js`) with unit tests next to it — follow the `lemu/graph/` pattern.
22. A bugfix starts with a failing test that reproduces the bug.
23. Comments state invariants and *why*, not *what* — the code says what.
24. No `console.log` in committed code — use `utils/logger.js` when logging is needed.
25. Adding a dependency requires justification in the PR (size, license, maintenance).
26. The bundle budget (`scripts/check-bundle.mjs`) only goes down — never raise it.
