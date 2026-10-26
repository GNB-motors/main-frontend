/**
 * Maps a stored weather row's code to a small set of display categories.
 * Open-Meteo rows carry a numeric WMO `weatherCode`; MET Norway rows carry a
 * `symbolCode` string ("rain", "partlycloudy_day", "fog", …). Either may be
 * present; neither is guessed when both are absent.
 */

export const WX = {
  CLEAR: 'clear',
  PARTLY: 'partly',
  CLOUDY: 'cloudy',
  FOG: 'fog',
  DRIZZLE: 'drizzle',
  RAIN: 'rain',
  SNOW: 'snow',
  THUNDER: 'thunder',
  UNKNOWN: 'unknown',
};

const LABELS = {
  clear: 'Clear sky',
  partly: 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Fog',
  drizzle: 'Drizzle',
  rain: 'Rain',
  snow: 'Snow',
  thunder: 'Thunderstorm',
  unknown: 'Conditions',
};

/** WMO code (Open-Meteo) → category. */
function fromWmo(code) {
  if (code == null || !Number.isFinite(code)) return null;
  if (code === 0) return WX.CLEAR;
  if (code === 1 || code === 2) return WX.PARTLY;
  if (code === 3) return WX.CLOUDY;
  if (code === 45 || code === 48) return WX.FOG;
  if (code >= 51 && code <= 57) return WX.DRIZZLE;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return WX.RAIN;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return WX.SNOW;
  if (code >= 95) return WX.THUNDER;
  return WX.UNKNOWN;
}

/** MET Norway symbol string → category. Order matters (substring checks). */
function fromSymbol(sym) {
  if (!sym) return null;
  const s = String(sym).toLowerCase();
  if (s.includes('thunder')) return WX.THUNDER;
  if (s.includes('snow') || s.includes('sleet')) return WX.SNOW;
  if (s.includes('drizzle')) return WX.DRIZZLE;
  if (s.includes('rain') || s.includes('showers')) return WX.RAIN;
  if (s.includes('fog')) return WX.FOG;
  if (s.includes('partlycloudy') || s.includes('fair')) return WX.PARTLY;
  if (s.includes('clearsky')) return WX.CLEAR;
  if (s.includes('cloudy')) return WX.CLOUDY;
  return WX.UNKNOWN;
}

/** The category for a conditions object ({ weatherCode, symbolCode, ... }). */
export function categoryOf(conditions) {
  if (!conditions) return WX.UNKNOWN;
  return fromSymbol(conditions.symbolCode) || fromWmo(conditions.weatherCode) || WX.UNKNOWN;
}

/** Human label for a category. */
export const labelOf = (category) => LABELS[category] || LABELS.unknown;

/** Weather worth flagging on the map for an UNselected truck: wet/stormy only,
 *  so clear/cloudy trucks stay uncluttered. */
export const isAdverse = (category) =>
  category === WX.RAIN ||
  category === WX.DRIZZLE ||
  category === WX.THUNDER ||
  category === WX.SNOW;

/** Rounds a measured number for display, or returns null when absent. */
export const num = (v, digits = 0) => (Number.isFinite(v) ? Number(v.toFixed(digits)) : null);
