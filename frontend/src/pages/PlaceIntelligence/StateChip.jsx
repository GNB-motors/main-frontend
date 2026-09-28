import { placeState } from './placeIntelligenceModel';

const TONE_CLASS = { ok: 'ok', warn: 'caution', crit: 'critical', neutral: 'inert' };

/** A place's status in plain words, in the shared status-chip tones. */
export default function StateChip({ site }) {
  const s = placeState(site);
  return <span className={`status-chip status-chip--${TONE_CLASS[s.tone]}`}>{s.label}</span>;
}
