/**
 * Pure presentation helpers for the Place Intelligence page — no React, so
 * they are unit-tested directly. They live in ./model/ by concern; this entry
 * keeps the old import path for pages outside Place Hub (AutoTrips).
 */
export {
  SITE_TYPE_LABEL,
  ANSWER_TYPES,
  PURPOSE_LABEL,
  PURPOSE_COLOR,
  EVIDENCE_LABEL,
  REASON_LABEL,
} from './model/siteVocabulary.js';
export {
  aType,
  typeLabel,
  endpointLabel,
  confidencePct,
  suggestion,
  effectiveType,
} from './model/siteType.js';
export {
  tripDropNote,
  labelReviewNote,
  placeState,
  hasRisk,
  placeTitle,
  coordsLabel,
  placeSubtitle,
  riskSentence,
  placeStats,
} from './model/siteSummary.js';
export { evidenceLines, purposeShares } from './model/siteEvidence.js';
export { PLACE_FILTERS, filterPlaces, groupBreaks } from './model/siteLists.js';
export { boundsOf, bboxAround } from './model/mapBounds.js';
export { impactSummary, isImpactGate, messageOf } from './model/requestOutcome.js';
export { gateRows } from './model/shadowGates.js';
export { minutesLabel, hoursLabel, kmLabel } from './model/unitLabels.js';
