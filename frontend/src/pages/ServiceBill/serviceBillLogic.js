/**
 * Service Bill — pure formatting and classification.
 *
 * The one rule this file exists to enforce: AN ABSENT NUMBER IS NOT A ZERO.
 * `formatMoney(null)` returns "Not recorded", never "₹0", and `formatFigure`
 * refuses to render a figure whose amount is missing no matter what its
 * provenance claims. Everything else here is display, so it is safe to unit
 * test and impossible to get wrong quietly.
 */

/** Where a money figure came from — must be shown next to the figure. */
export const PROVENANCE = {
  ENTERED: 'ENTERED',
  EXTRACTED: 'EXTRACTED',
  ESTIMATED: 'ESTIMATED',
  UNKNOWN: 'UNKNOWN',
};

export const PROVENANCE_LABEL = {
  ENTERED: 'Entered',
  EXTRACTED: 'Extracted from the bill',
  ESTIMATED: 'Estimated from your history',
  UNKNOWN: 'Not known',
};

export const STATE_STYLE = {
  NO_BILL: { label: 'No bill yet', color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
  AWAITING_OWNER: { label: 'Awaiting owner', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  IN_LEDGER: { label: 'Approved', color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  TURNED_DOWN: { label: 'Turned down', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },
};

export const SIGNAL_LABEL = {
  maintenanceRecord: 'Service logged',
  oemCounter: 'OEM counter moved',
  workshopDwell: 'Stood at a workshop',
};

/**
 * Money, or an honest absence of it. null / undefined / non-numeric / negative
 * all read as "not known" — the difference between "₹0" and "we don't know" is
 * the whole point of this screen.
 */
export function formatMoney(amount) {
  const value = Number(amount);
  if (amount === null || amount === undefined || !Number.isFinite(value) || value <= 0) {
    return 'Not recorded';
  }
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/**
 * A figure with its provenance. A figure with no amount renders as its missing
 * reason, never as a number — even if the payload wrongly claims one.
 */
export function formatFigure(figure, { prefix = '' } = {}) {
  if (!figure || figure.amount === null || figure.amount === undefined) {
    const why = figure?.missing ? MISSING_REASON[figure.missing] || figure.missing : 'Not known';
    return prefix ? `${prefix}${why}` : why;
  }
  return `${prefix}${formatMoney(figure.amount)}`;
}

export const MISSING_REASON = {
  NO_BILL: 'No bill yet',
  NO_AMOUNT_RECORDED: 'No amount on the service record',
  NO_RECORD_LOGGED: 'No service record logged',
  NO_HISTORY: 'No history to learn from',
  INSUFFICIENT_HISTORY: 'Not enough history to estimate',
  NOT_RECORDED: 'Not recorded',
};

/** Provenance as a short, human line. Confidence rides along when OCR made it. */
export function provenanceText(figure) {
  if (!figure) return PROVENANCE_LABEL.UNKNOWN;
  if (figure.amount === null || figure.amount === undefined) return PROVENANCE_LABEL.UNKNOWN;
  if (figure.kind === PROVENANCE.EXTRACTED) {
    const conf = Number.isFinite(Number(figure.ocrConfidence))
      ? ` · ${Math.round(Number(figure.ocrConfidence))}% confidence`
      : '';
    const field = figure.ocrField ? ` from the bill's "${figure.ocrField}"` : '';
    return `Extracted${field}${conf}`;
  }
  if (figure.kind === PROVENANCE.ESTIMATED) return PROVENANCE_LABEL.ESTIMATED;
  return PROVENANCE_LABEL.ENTERED;
}

/** The signed difference between the bill and the service record, never averaged. */
export function deltaText(comparison) {
  if (!comparison || comparison.delta === null || comparison.delta === undefined) return null;
  const delta = Number(comparison.delta);
  if (delta === 0) return 'Same amount on both sides';
  const rupees = `₹${Math.abs(Math.round(delta)).toLocaleString('en-IN')}`;
  return `${delta > 0 ? 'Bill is' : 'Service record is'} ${rupees} more`;
}

/**
 * How long a bill has been missing, in the only terms the data supports: against
 * what this org normally takes. Never "overdue" — there is no payment term here
 * to be overdue against, and inventing one would be a lie about a contract.
 */
export function lagText(lag) {
  if (!lag || lag.daysOpen === null || lag.daysOpen === undefined) return '';
  const days = Number(lag.daysOpen);
  const open = `Open ${days} day${days === 1 ? '' : 's'}`;
  if (lag.verdict === 'NO_BASELINE') return `${open} · no baseline for your org yet`;
  if (lag.verdict === 'BILL_RECEIVED') return `Billed after ${days} day${days === 1 ? '' : 's'}`;
  const median = Number(lag.orgMedianDays);
  if (!Number.isFinite(median)) return open;
  if (lag.verdict === 'LONGER_THAN_TYPICAL') {
    return `${open} · longer than your usual ${median} day${median === 1 ? '' : 's'}`;
  }
  return `${open} · within your usual ${median} day${median === 1 ? '' : 's'}`;
}

export function formatIstDay(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** The "bill pending" list reads as a table, so give it its columns. */
export const ITEM_COLUMNS = [
  { key: 'service', label: 'Service' },
  { key: 'signals', label: 'Signals that agreed' },
  { key: 'state', label: 'Bill state' },
  { key: 'serviceAmount', label: 'Service record' },
  { key: 'billAmount', label: 'Bill' },
  { key: 'lag', label: 'How long' },
];

/** Filter pills for the list. `MISMATCH` is the one the owner most needs. */
export const STATE_FILTERS = [
  { key: 'OPEN', label: 'Needs a bill' },
  { key: 'MISMATCH', label: 'Bills disagree' },
  { key: 'NO_BILL', label: 'No bill yet' },
  { key: 'AWAITING_OWNER', label: 'Awaiting owner' },
  { key: 'IN_LEDGER', label: 'Approved' },
  { key: 'ALL', label: 'Everything' },
];

export function filterItems(rows, filter) {
  if (!filter || filter === 'ALL') return rows;
  if (filter === 'OPEN') return rows.filter((r) => r.open);
  if (filter === 'MISMATCH') return rows.filter((r) => r.comparison?.verdict === 'DISAGREES');
  return rows.filter((r) => r.state === filter);
}

/**
 * What the workshop bill itself reads (D4's OCR, `row.billReading`), as a figure
 * and a note. Only a reviewed reading is a number; an unreviewed one is shown as
 * what the OCR read, labelled as not trusted yet. Never ₹0 for unknown.
 * @returns {{figure: string, note: string}|null}
 */
export function readingText(reading) {
  if (!reading) return null;
  const conf = Number.isFinite(Number(reading.ocrConfidence))
    ? ` · ${Math.round(Number(reading.ocrConfidence))}% OCR confidence`
    : '';
  if (Number.isFinite(Number(reading.amount)) && reading.amount !== null) {
    if (reading.kind === 'CORRECTED') {
      const ocr = Number.isFinite(Number(reading.ocrValue)) && reading.ocrValue !== null ? ` (OCR read ${formatMoney(reading.ocrValue)})` : '';
      return { figure: formatMoney(reading.amount), note: `Corrected by a reviewer${ocr}` };
    }
    return { figure: formatMoney(reading.amount), note: `Read off the workshop bill and reviewed${conf}` };
  }
  if (reading.missing === 'NOT_REVIEWED') {
    return {
      figure: 'Awaiting review',
      note: `OCR read ${formatMoney(reading.proposal)}${conf} — not trusted until someone reviews it`,
    };
  }
  if (reading.missing === 'REVIEWER_KEPT_RECORD') {
    return {
      figure: 'Record kept',
      note: `The bill read ${formatMoney(reading.disagreesWithRecord)}; the reviewer kept the record's figure`,
    };
  }
  return { figure: 'Not read', note: `No total read off the bill (${reading.missing || 'unknown reason'})` };
}
