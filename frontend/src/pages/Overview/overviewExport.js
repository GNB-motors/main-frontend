/**
 * Builds the row matrix for the Overview XLSX export. Pure — the caller owns
 * the XLSX workbook side effects so this stays unit-testable.
 */

export const buildOverviewExportRows = ({
  selectedDays,
  health,
  vehicles,
  drivers,
  trips,
  kilometers,
  money,
  utilization,
  downtime,
}) => {
  const m = money?.money || {};
  return [
    ['Metric', 'Value'],
    ['Date range', `Last ${selectedDays} days`],
    ['Fleet health score', health?.score ?? '—'],
    ['Fleet health grade', health?.grade ?? '—'],
    ['Total vehicles', vehicles?.total ?? 0],
    ['Active vehicles', vehicles?.active ?? 0],
    ['Total drivers', drivers?.total ?? 0],
    ['Total trips', trips?.total ?? 0],
    ['Distance (km)', kilometers?.total ?? 0],
    ['Fuel cost (₹)', m.fuelCostInr ?? 0],
    ['DEF cost (₹)', m.defCostInr ?? 0],
    ['Idling waste (₹)', m.idlingWasteInr ?? 0],
    ['Detour waste (₹)', m.detourWasteInr ?? 0],
    ['Theft loss (₹)', m.theftLossInr ?? 0],
    ['Bill fraud suspect (₹)', m.billFraudSuspectInr ?? 0],
    ['Recoverable waste (₹)', money?.totalWasteInr ?? 0],
    ['Empty running (%)', utilization?.fleet?.emptyKmPct ?? '—'],
    ['Downtime exposure (₹)', downtime?.totalExposureInr ?? 0],
  ];
};
