# Handoff — Road-Following Trail on Live Tracking (frontend)

**Branch:** `feat/centralized-corridors-road-snap` (paired with the backend branch of the same name)
**Date:** 2026-09-23 · **Author:** Claude (Opus 4.8)

The backend handoff (`main-backend/HANDOFF_ROUTE_CENTRALIZATION_ROAD_SNAP.md`) has the full picture.
This repo carries the **Live Tracking** integration of the new road-followed, speed-graded trail.

## What shipped
- `pages/LiveTracking/roadTrail.js` (PURE, tested — rule 21): `GRADE_COLOR`, `segmentStyle`,
  `segmentsToPolylines` (collapse graded segments into one polyline per grade run; estimated/straight
  hops kept separate), `gradeSummary`.
- `pages/LiveTracking/roadTrail.test.js`: 6 vitest cases, all green.
- `pages/LiveTracking/LiveTrackingService.jsx`: `getRoadTrail`, `getHotspots`, `refreshHotspots`,
  `getMapCost` (call the new `/api/road-snap/*` + reuse the existing trail service).
- `pages/LiveTracking/LiveTrackingPage.jsx`: when a vehicle trail is shown it also fetches the
  road-followed trail and renders it as **grade-coloured polyline runs** (OVERSPEED red / NORMAL
  green / SLOW amber; estimated straight hops dashed + faded). Falls back to the raw GPS line when
  road-snap is unavailable (404 / empty), so the trail always renders. A "Road-followed" summary
  (total km, estimated split, overspeed/slow km) shows in the Recorded-path panel.

## Verification
- `npx eslint` clean on all touched files.
- `npx vite build` succeeds; bundle 282 KB ≤ 600 KB budget (rule 26).
- `npx vitest run roadTrail.test.js` — 6/6 pass.

## Notes / not done
- The old `RouteIntelligencePage` (registered at `App.jsx:359`) and `RouteDeviation` page are **not**
  removed — that's a paired, destructive change to land with the new centralized-map page (see the
  backend handoff §6).
- Data fetching here follows the existing `LiveTrackingService` (raw `apiClient`) pattern for
  consistency with the surrounding page; a future pass can migrate it to `useApi`/`useMutation`.
