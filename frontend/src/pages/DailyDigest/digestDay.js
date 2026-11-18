import { istDayString } from '../../utils/dateUtils';
import { formatIstDate } from '../../utils/redesign/format';

/**
 * How the digest names the day it shows, so no label says "today" about
 * a day that is not today (a past day is named by its date), and so the parts that are always
 * read live can say they are not about a past day.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const noonOf = (day) => new Date(`${day}T12:00:00+05:30`);

function isToday(day, now = new Date()) {
  return day === istDayString(now);
}

function isYesterday(day, now = new Date()) {
  return day === istDayString(new Date(now.getTime() - DAY_MS));
}

/** "10 Nov". */
function short(day) {
  return formatIstDate(noonOf(day));
}

/** The day's work card: "Today so far", else the date ("Work on 17 Nov") — never "yesterday". */
function workTitle(day, now = new Date()) {
  if (isToday(day, now)) return 'Today so far';
  return `Work on ${short(day)}`;
}

/** For a part read live on a past day: "not for 10 Nov"; null on today. */
function notFor(day, now = new Date()) {
  return isToday(day, now) ? null : `not for ${short(day)}`;
}

const digestDay = { isToday, isYesterday, short, workTitle, notFor };

export default digestDay;
