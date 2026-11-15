/** The same signed difference everywhere: displayed sensor litres minus billed litres. */
export function fillBillView(fill) {
  const hasBill = Number.isFinite(fill?.claimedLitres) && fill.claimedLitres > 0;
  const hasSensor = Number.isFinite(fill?.litres);
  const varianceL =
    hasBill && hasSensor
      ? Math.round(
          (Math.round(fill.litres * 10) / 10 - Math.round(fill.claimedLitres * 10) / 10) * 10,
        ) / 10
      : null;
  const comparable = hasBill && hasSensor && fill.billComparable !== false;
  const flagged = comparable && fill.billFlag === true;
  const varianceText =
    varianceL == null ? '—' : `${varianceL > 0 ? '+' : ''}${varianceL.toFixed(1)} L`;
  return {
    hasBill,
    comparable,
    flagged,
    varianceL,
    varianceText,
    statusText: !hasBill
      ? 'No bill on file'
      : !comparable
        ? 'Bill comparison unavailable'
        : `${flagged ? 'Mismatch' : 'Within tolerance'} · ${varianceText} (sensor − billed)`,
  };
}
