import { getPref, setPref } from '../../utils/session';
import { defaultLayerSelection } from './trackLegendModel';

/**
 * trackLegendPrefs — what the Track page remembers between visits.
 *
 * All of it goes through utils/session.js, which is the only place in this
 * app allowed to touch localStorage.
 */

const LAYERS_KEY = 'track.layers';
const TRAFFIC_KEY = 'track.traffic';

/**
 * The place layers the owner last chose.
 * A broken or missing value falls back to the defaults rather than to an
 * empty map, because a map with no places looks like a broken product.
 */
export function readLayerSelection() {
  const stored = getPref(LAYERS_KEY);
  if (!stored) return defaultLayerSelection();
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return defaultLayerSelection();
    return { ...defaultLayerSelection(), ...parsed };
  } catch {
    return defaultLayerSelection();
  }
}

/** Remember the place layers the owner chose. */
export function writeLayerSelection(selection) {
  setPref(LAYERS_KEY, JSON.stringify(selection));
}

/** Whether Google's live traffic was left on. Off by default. */
export function readTrafficOn() {
  return getPref(TRAFFIC_KEY) === 'true';
}

/** Remember whether Google's live traffic is on. */
export function writeTrafficOn(on) {
  setPref(TRAFFIC_KEY, String(Boolean(on)));
}
