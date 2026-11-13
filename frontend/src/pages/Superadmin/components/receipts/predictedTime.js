/**
 * The predicted time of a fill — shown as a suggestion, never as a read time.
 *
 * A photo with no time of its own gets a time predicted from our own data:
 * the tank-sensor rise of that truck, the GPS dwell at the pump, or both.
 * The words below are what a person reads: "Predicted 6:40 pm (tank rise)".
 */

/** The words for each source of a predicted time. */
export const PREDICTED_WORDS = {
  SENSOR_RISE: 'tank rise',
  GPS_AT_PUMP: 'GPS at pump',
  BOTH: 'tank rise and GPS at pump',
};

/** A time on a clock, the way a person reads it. */
const clock = (value) =>
  new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
  });

/** The time of a tank rise, the way a person reads it. */
const dayClock = (value) =>
  `${new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
  })}, ${clock(value)}`;

/**
 * The fill time of a photo: the day and the time, the way a person reads it.
 * No year — the bill has to confirm that.
 */
const fillDate = (value) => {
  if (!value) return '';
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return '';
  return dayClock(at);
};

/** The words for where a fill time came from. */
export const FILL_TIME_SOURCE_WORDS = {
  stamp: 'Photo stamp',
  printed: 'Printed bill',
  person: 'Set by a person',
  manual: 'Set by a person',
  predicted: 'Detected fill · suggestion',
};

/**
 * The fill time of a row and the source it came from.
 *
 * Only time.value and time.source are read. The time a message arrived is
 * never the time the tank was filled, so it is never used here.
 */
export const fillTimeInfo = (time) => {
  const value = fillDate(time?.value);
  const key = String(time?.source ?? '').trim().toLowerCase();
  if (!value) {
    return { value: '', source: '', sourceKey: key, sourceKnown: false, missing: true };
  }
  const words = FILL_TIME_SOURCE_WORDS[key];
  return {
    value,
    source: words || 'Source not recorded',
    // The source itself, so the words of the source vocabulary can be used.
    sourceKey: key,
    sourceKnown: Boolean(words),
    missing: false,
  };
};

/**
 * The fill time of a draft: its own read time, else the printed bill's own
 * date. The WhatsApp received time is never a fallback.
 */
export const fillTimeFromDraft = (draft) => {
  // The server only sets `time.value` after its year rule decided the year
  // (photo stamp, else the truck's detected fill), so that year is confirmed.
  // A bare printed bill date never passed that rule: its year is not.
  const info = fillTimeInfo(draft?.time);
  if (!info.missing) return { ...info, yearConfirmed: true };
  const printed = fillDate(draft?.billDatetime);
  if (!printed) return { ...info, yearConfirmed: false };
  return {
    value: printed,
    source: 'Printed bill',
    sourceKey: 'printed',
    sourceKnown: true,
    missing: false,
    yearConfirmed: false,
  };
};

/** The fill time in plain words, or why there is none. */
export const fillTimeText = (time) => {
  const info = fillTimeInfo(time);
  return info.missing ? 'Fill time not read from the photo.' : info.value;
};

/** Does the date a person reads carry a year? */
export const dateTextHasYear = (text) => /\b\d{4}\b/.test(String(text || ''));

/** The words for how sure a suggestion is. */
const CONFIDENCE_WORDS = {
  HIGH: 'two clues agree',
  MEDIUM: 'one clue',
  LOW: 'weak',
};

/** The time in plain words, or nothing when there is no time. */
const time = (value) => {
  if (!value) return '';
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return '';
  return clock(at);
};

/**
 * The predicted time in plain words: "Predicted 6:40 pm (tank rise)".
 * An empty string when there is no prediction to show.
 */
export const predictedTimeText = (predicted) => {
  if (!predicted || !predicted.at) return '';
  const at = new Date(predicted.at);
  if (Number.isNaN(at.getTime())) return '';
  const source = PREDICTED_WORDS[predicted.source] || 'our own data';
  // A truck that is only likely says so: it may be another truck.
  const truck = predicted.evidence?.truckStatus === 'likely' ? ', likely truck' : '';
  const sure = CONFIDENCE_WORDS[predicted.confidence]
    ? `, ${CONFIDENCE_WORDS[predicted.confidence]}`
    : '';
  // A forwarded chat can be days after the fill, so the day is always shown.
  return `Predicted ${dayClock(at)} (${source}${sure}${truck})`;
};

/**
 * How we know, in plain words — the lines a person reads to check the
 * prediction themselves.
 */
export const predictedEvidenceLines = (evidence) => {
  if (!evidence) return [];
  const lines = [];

  // The words the matcher wrote: which rise, the odometer, the pump litres,
  // or the several rises a person has to pick from.
  const plain = Array.isArray(evidence.plainLines) ? evidence.plainLines.filter(Boolean) : [];
  lines.push(...plain);
  if (evidence.odometerNote) lines.push(evidence.odometerNote);

  const sensor = evidence.sensor;
  if (sensor && sensor.at && !plain.length) {
    const litres = sensor.litres ? ` of ${sensor.litres} L` : '';
    const pump = sensor.pumpName ? ` at ${sensor.pumpName}` : '';
    lines.push(`Tank rise${pump}${litres} at ${time(sensor.at)}.`);
  }

  const gps = evidence.gps;
  if (gps && gps.at) {
    const place = gps.place?.name || 'the pump';
    const readings = gps.fixes ? `, ${gps.fixes} readings` : '';
    const radius = gps.radiusM ? ` within ${gps.radiusM} m` : '';
    lines.push(`At ${place} from ${time(gps.at)} to ${time(gps.until)}${readings}${radius}.`);
  }

  const also = evidence.alsoSeen;
  if (also && also.at) {
    const place = (typeof also.place === 'string' ? also.place : also.place?.name) || 'the pump';
    const why = also.why ? ` — ${also.why}` : ' — the tank rose outside that visit';
    lines.push(`Also seen: at ${place} from ${time(also.at)} to ${time(also.until)}${why}.`);
  }

  if (evidence.truckStatus === 'likely') {
    lines.push('The truck itself is only likely, so a person has to pick it.');
  }

  return lines;
};

/** The litres the matched rise (or the pump photo) suggests, else null. */
export const suggestedLitres = (predicted) => {
  const value = predicted?.litres ?? predicted?.evidence?.litresSuggestion?.litres ?? null;
  const n = Number(value);
  return value != null && Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * The matched tank rise in the words the drawer uses. Either half that was not
 * measured stays a dash; nothing is filled in for it.
 */
export const matchedRiseText = (predicted) => {
  const at = predicted?.at ? fillDate(predicted.at) : '—';
  const litres = suggestedLitres(predicted);
  return `Matched tank rise: ${at} · ${litres != null ? `${litres} L` : '—'}`;
};

/** Several rises fit and none was picked: the person has to choose. */
export const severalRisesText = (predicted) => {
  const ev = predicted?.evidence;
  if (!ev || predicted?.at || ev.status !== 'several') return '';
  return 'Several tank rises fit — choose one.';
};

export default predictedTimeText;
