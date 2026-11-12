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

/**
 * The predicted time in plain words: "Predicted 6:40 pm (tank rise)".
 * An empty string when there is no prediction to show.
 */
export const predictedTimeText = (predicted) => {
  if (!predicted || !predicted.at) return '';
  const at = new Date(predicted.at);
  if (Number.isNaN(at.getTime())) return '';
  const clock = at.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `Predicted ${clock} (${PREDICTED_WORDS[predicted.source] || 'our own data'})`;
};

export default predictedTimeText;
