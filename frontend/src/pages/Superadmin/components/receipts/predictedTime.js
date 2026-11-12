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
  return `Predicted ${clock(at)} (${source}${truck})`;
};

/**
 * How we know, in plain words — the lines a person reads to check the
 * prediction themselves.
 */
export const predictedEvidenceLines = (evidence) => {
  if (!evidence) return [];
  const lines = [];

  const sensor = evidence.sensor;
  if (sensor && sensor.at) {
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
    const place = also.place?.name || 'the pump';
    lines.push(
      `Also seen: at ${place} from ${time(also.at)} to ${time(also.until)} — ${also.why}.`,
    );
  }

  if (evidence.truckStatus === 'likely') {
    lines.push('The truck itself is only likely, so a person has to pick it.');
  }

  return lines;
};

export default predictedTimeText;
