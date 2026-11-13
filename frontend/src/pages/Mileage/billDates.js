/**
 * Bill dates, told plainly.
 *
 * A bill shows its year only when the year really is on the bill. When the
 * photo gives a day and a month but no year, the year stays unknown: the text
 * says so instead of guessing one.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTH_NAMES = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

/** What we say when the bill gives a day and a month but no year. */
export const YEAR_NOT_CONFIRMED = 'year not confirmed — check the bill';

const ZONE = 'Asia/Kolkata';

const ISO_DATE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(.*)$/;
const NUMERIC_DATE = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/;
const DAY_FIRST = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?,?\s*(\d{4})?$/;
const MONTH_FIRST = /^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?$/;

const pad = (n) => (n < 10 ? `0${n}` : String(n));

function fromInstant(when) {
  const parts = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: ZONE,
  }).formatToParts(when);
  const read = (type) => parts.find((part) => part.type === type)?.value ?? '';
  const month = MONTH_NAMES[read('month').toLowerCase()];
  if (month === undefined) return null;
  return { day: Number(read('day')), month, year: Number(read('year')) };
}

function parseParts(text) {
  const iso = ISO_DATE.exec(text);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]) - 1;
    const day = Number(iso[3]);
    if (month < 0 || month > 11 || day < 1 || day > 31) return null;
    const tail = (iso[4] || '').trim();
    // A time with a zone is a real instant, so it is read in the plant's own
    // clock (Asia/Kolkata). A time without one is a wall clock already.
    if (tail && /(Z|[+-]\d{2}:?\d{2})$/i.test(tail)) {
      const when = new Date(`${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}${tail.replace(' ', 'T')}`);
      if (!Number.isNaN(when.getTime())) return fromInstant(when);
    }
    return { day, month, year };
  }

  const numeric = NUMERIC_DATE.exec(text);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    let year = Number(numeric[3]);
    if (year < 100) year += 2000;
    if (month < 0 || month > 11 || day < 1 || day > 31) return null;
    return { day, month, year };
  }

  const dayFirst = DAY_FIRST.exec(text);
  if (dayFirst) {
    const month = MONTH_NAMES[dayFirst[2].toLowerCase()];
    if (month === undefined) return null;
    return {
      day: Number(dayFirst[1]),
      month,
      year: dayFirst[3] ? Number(dayFirst[3]) : null,
    };
  }

  const monthFirst = MONTH_FIRST.exec(text);
  if (monthFirst) {
    const month = MONTH_NAMES[monthFirst[1].toLowerCase()];
    if (month === undefined) return null;
    return {
      day: Number(monthFirst[2]),
      month,
      year: monthFirst[3] ? Number(monthFirst[3]) : null,
    };
  }

  return null;
}

/**
 * The date as it should be read: "1 Nov 2026".
 * A day and a month without a year stays "2 Nov" — no year is invented.
 */
export function formatBillDate(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  if (!text) return '';
  const parts = parseParts(text);
  if (!parts) return '';
  const monthName = MONTHS[parts.month] || '';
  if (!monthName) return '';
  return parts.year ? `${parts.day} ${monthName} ${parts.year}` : `${parts.day} ${monthName}`;
}

/**
 * The date plus what is still not known about it.
 * `yearWarning` is empty when the bill itself gave the year.
 */
export function billDateInfo(value) {
  const text = formatBillDate(value);
  if (!text) return { text: '', yearWarning: '' };
  return {
    text,
    yearWarning: /\b\d{4}\b/.test(text) ? '' : YEAR_NOT_CONFIRMED,
  };
}

export default formatBillDate;
