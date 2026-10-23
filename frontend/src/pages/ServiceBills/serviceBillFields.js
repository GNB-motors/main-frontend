/**
 * serviceBillFields — the presentation rules for a bill's claimed figures.
 *
 * Pure, so they can be tested without a browser. The rules they encode:
 *
 *   - A value is never shown without the confidence that came with it, and a
 *     value nobody reported a confidence for is shown as UNREAD, not as a number.
 *   - A blank is never rendered as 0, an em dash with no explanation, or a
 *     fallback. It carries the reason the extractor gave.
 *   - A figure the record already disagrees with is shown twice, next to each
 *     other. There is no blended number here, and there must not ever be one.
 *   - A typed figure and an extracted figure never look the same: every
 *     extracted value carries its source label.
 */

/** Reasons the extractor can give, in the words a reviewer needs to act on. */
export const BLANK_REASON_LABEL = {
  NOT_ON_BILL: 'Not printed on this bill',
  PRINT_FAINT: 'Print too faint to read',
  CROPPED_OUT: 'Cropped out of the photo',
  COVERED: 'Covered by another document in the photo',
  BLANK_ON_BILL: 'Left blank on the bill',
  ILLEGIBLE: 'Illegible in the photo',
  NO_CONFIDENCE: 'Extractor reported no confidence for this field',
  BELOW_ORG_CONFIDENCE_FLOOR: 'Below this org’s confidence floor',
  OCR_FAILED: 'Scan did not run',
  NOT_A_BILL: 'This image does not look like a service bill',
};

export const STATUS_LABEL = {
  PROPOSED: 'Read from the bill',
  BLANK: 'Not read',
  ACCEPTED: 'Accepted',
  CORRECTED: 'Corrected by reviewer',
  REJECTED: 'Not used',
  KEPT_RECORDED: 'Record kept as is',
};

export const MONEY_FIELDS = ['subTotal', 'gstAmount', 'grandTotal'];

const inr = (v) =>
  `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const asDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const sameDate = (a, b) => {
  const da = asDate(a);
  const db = asDate(b);
  return !!da && !!db && da.getTime() === db.getTime();
};

/** Render one field's extracted value for display. Never invents a value. */
export function formatFieldValue(field) {
  if (!field) return null;
  if (field.status === 'BLANK' || field.value === null || field.value === undefined) {
    return null;
  }
  if (field.field === 'invoiceDate') {
    return asDate(field.value)?.toISOString().slice(0, 10) ?? String(field.value);
  }
  if (MONEY_FIELDS.includes(field.field)) return inr(field.value);
  if (field.field === 'odometerKm') return `${Number(field.value).toLocaleString('en-IN')} km`;
  return String(field.value);
}

export function formatLineItemAmount(item) {
  const amount = item?.confirmedAmount ?? item?.amount;
  if (amount === null || amount === undefined) return null;
  return inr(amount);
}

/**
 * The confidence word shown beside a figure. Deliberately coarse: the reviewer
 * needs to know whether to look at the paper, not a decimal place. This is a
 * label on the extractor's own number, never a gate of its own — the org's
 * floor (server side) is the only thing that blanks a field.
 */
export function confidenceBand(confidence) {
  if (confidence === null || confidence === undefined) return 'none';
  if (confidence >= 85) return 'high';
  if (confidence >= 60) return 'medium';
  return 'low';
}

export const CONFIDENCE_BAND_LABEL = {
  high: 'confident',
  medium: 'readable',
  low: 'faint',
  none: 'no confidence reported',
};

/** One row model for the review table. */
export function buildFieldRows(extraction) {
  const recorded = {
    grandTotal: extraction?.maintenanceRecord?.amount,
    invoiceDate: extraction?.maintenanceRecord?.date,
    vendorName: extraction?.maintenanceRecord?.workshop,
    odometerKm: extraction?.maintenanceRecord?.currentKm,
  };
  const disagreements = new Map(
    (extraction?.disagreements || []).map((d) => [d.field, d]),
  );

  return (extraction?.fields || []).map((field) => {
    const recordedValue = recorded[field.field];
    const hasRecorded =
      recordedValue !== null && recordedValue !== undefined && recordedValue !== '';
    const extracted = formatFieldValue(field);
    const differs = disagreements.get(field.field)?.differs ?? false;
    return {
      field: field.field,
      label: field.label || field.field,
      extracted,
      confidence: field.confidence ?? null,
      band: confidenceBand(field.confidence),
      status: field.status,
      statusLabel: STATUS_LABEL[field.status] || field.status,
      blankReason: field.status === 'BLANK' ? field.blankReason || 'NOT_ON_BILL' : null,
      blankLabel: BLANK_REASON_LABEL[field.blankReason] || 'Not read from the bill',
      recorded:
        recordedValue === null || recordedValue === undefined
          ? null
          : field.field === 'invoiceDate' && sameDate(recordedValue, recordedValue)
            ? asDate(recordedValue).toISOString().slice(0, 10)
            : field.field === 'grandTotal'
              ? inr(recordedValue)
              : String(recordedValue),
      recordedSource: 'RECORD',
      differs: hasRecorded && differs,
      actionable: field.status === 'PROPOSED',
    };
  });
}

/** Counts for the page header — honest counts, blanks included. */
export function summariseRows(rows) {
  const total = rows.length;
  const proposed = rows.filter((r) => r.status === 'PROPOSED').length;
  const blank = rows.filter((r) => r.status === 'BLANK').length;
  const faint = rows.filter((r) => r.band === 'low' || r.band === 'none').length;
  const disagreed = rows.filter((r) => r.differs).length;
  return { total, proposed, blank, faint, disagreed };
}

export function scanStatusLabel(scanStatus) {
  if (scanStatus === 'SUCCESS') return 'Bill read in full';
  if (scanStatus === 'PARTIAL') return 'Partly read';
  if (scanStatus === 'FAILED') return 'Nothing read from this photo';
  return scanStatus || 'Unknown';
}

/** Queue rows: one line per bill photo. */
export function buildQueueRows(bills) {
  return (bills || []).map((b) => {
    const fields = b.fields || [];
    const proposed = fields.filter((f) => f.status === 'PROPOSED');
    const total = fields.find((f) => f.field === 'grandTotal');
    const vendor = fields.find((f) => f.field === 'vendorName');
    return {
      id: b._id,
      vehicleId: b.vehicleId,
      uploadedAt: b.createdAt,
      reviewed: !!b.reviewedAt,
      scanStatus: b.scanStatus,
      scanStatusLabel: scanStatusLabel(b.scanStatus),
      vendor: vendor && vendor.status === 'PROPOSED' ? vendor.value : null,
      total: formatFieldValue(total),
      totalConfidence: total?.confidence ?? null,
      totalBand: confidenceBand(total?.confidence),
      photo: b.sourceFile?.publicUrl || null,
      fieldsRead: proposed.length,
      fieldsTotal: fields.length,
      // A bill with blanks needs a person; a bill read in full still does, but
      // the reason differs and the queue says so.
      needsReview: !b.reviewedAt,
    };
  });
}

/** The review payload for a decision. Blank fields are never sent as a value. */
export function buildReviewPayload(decisions, lineItems) {
  const fields = {};
  for (const [field, decision] of Object.entries(decisions || {})) {
    if (!decision || !decision.action) continue;
    const payload = { action: decision.action };
    if (decision.action === 'CORRECT' && decision.value !== undefined) {
      payload.value = decision.value;
    }
    fields[field] = payload;
  }
  return lineItems && Object.keys(lineItems).length ? { fields, lineItems } : { fields };
}