import { formatIstDate } from '../../utils/redesign/format';
import { cadenceSentence, cellNumber, isUnknownCell, reasonGroup } from './performanceCells';

/**
 * The gaps of a performance table, said once instead of on every row.
 *
 * A column that is blank on every row is left out of the table and explained
 * by one line in the briefing ("Top-gear share and over-rev share are not
 * shown: …") rather than a struck-through badge and the same reason repeated
 * fifty times. A dash on a single row is explained in that row's drawer.
 */

const midSentence = (label) =>
  /^[A-Z][a-z]/.test(label) ? `${label.charAt(0).toLowerCase()}${label.slice(1)}` : label;

const capitalise = (text) => (text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : text);

export const joinLabels = (labels) => {
  const [first, ...rest] = labels;
  if (!rest.length) return first ?? '';
  const tail = rest.map(midSentence);
  return `${[first, ...tail.slice(0, -1)].join(', ')} and ${tail[tail.length - 1]}`;
};

/**
 * The server writes its reasons about one row ("This driver has no push
 * telemetry in this window."). Said about a whole column, the subject goes.
 */
export function subjectless(reason) {
  const text = String(reason || '').trim();
  const has = /^(?:this|the) (?:driver|truck) has no (.+)$/i.exec(text);
  if (has) return `no ${has[1]}`;
  const reported = /^(?:this|the) (?:driver|truck) reported no (.+?) in this window\.?$/i.exec(
    text,
  );
  if (reported) return `no ${reported[1]} reported in this window.`;
  const notReport = /^(?:this|the) (?:driver|truck) does not report (.+?)\.?$/i.exec(text);
  if (notReport) return `${notReport[1]} is not reported.`;
  return midSentence(text);
}

const reasonText = (entry) =>
  entry.group.kind === 'cadence'
    ? cadenceSentence({
        minMinutes: Math.min(...entry.minutes),
        maxMinutes: Math.max(...entry.minutes),
        requiredS: entry.group.requiredS,
      })
    : entry.group.text;

/**
 * `columns` is `[{ key, label, cell: (row) => cell }]`. Returns the keys of the
 * columns with no number on any row, and one note per reason those columns
 * share.
 */
export function columnGaps(rows, columns) {
  const hidden = new Set();
  const merged = new Map();
  if (!rows.length) return { hidden, notes: [] };

  columns.forEach((column) => {
    const cells = rows.map((row) => column.cell(row));
    if (!cells.every(isUnknownCell)) return;
    hidden.add(column.key);
    const groups = new Map();
    cells.forEach((cell) => {
      const group = reasonGroup(cell);
      const entry = groups.get(group.key) ?? { group, count: 0, minutes: [] };
      entry.count += 1;
      if (group.kind === 'cadence') entry.minutes.push(group.minutes);
      groups.set(group.key, entry);
    });
    // The reason most of the column carries speaks for the column.
    const main = [...groups.values()].sort((a, b) => b.count - a.count)[0];
    const existing = merged.get(main.group.key);
    if (existing) {
      existing.labels.push(column.label);
      existing.minutes.push(...main.minutes);
    } else {
      merged.set(main.group.key, {
        labels: [column.label],
        group: main.group,
        minutes: [...main.minutes],
      });
    }
  });

  const notes = [...merged.values()].map((entry) => ({
    labels: entry.labels,
    reason: reasonText(entry),
  }));
  return { hidden, notes };
}

/** "Top-gear share and over-rev share are not shown: readings arrive …" */
export function hiddenLine(note) {
  const verb = note.labels.length > 1 ? 'are' : 'is';
  return `${joinLabels(note.labels)} ${verb} not shown: ${subjectless(note.reason)}`;
}

/** "DNA score: no DNA day in this window." — one line of the empty state. */
export function reasonLine(note) {
  return { labels: joinLabels(note.labels), reason: capitalise(subjectless(note.reason)) };
}

/** The median of the numbers a column has, and how many rows had one. */
export function columnMedian(rows, cellOf) {
  const values = rows
    .map((row) => cellNumber(cellOf(row)))
    .filter((n) => n !== null)
    .sort((a, b) => a - b);
  if (!values.length) return { median: null, known: 0 };
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  return { median, known: values.length };
}

/** The sources that appear among the shown cells, for the legend. */
export function sourcesPresent(rows, cellsOf) {
  const present = new Set();
  rows.forEach((row) => {
    cellsOf(row).forEach((cell) => {
      if (!isUnknownCell(cell) && cell?.source) present.add(cell.source);
    });
  });
  return present;
}

/** "23 Oct → 21 Nov", or null when the server sent no window. */
export function windowLabel(window) {
  if (!window?.from || !window?.to) return null;
  return `${formatIstDate(window.from)} → ${formatIstDate(window.to)}`;
}
