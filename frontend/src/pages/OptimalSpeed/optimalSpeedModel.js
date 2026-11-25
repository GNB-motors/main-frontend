const known = (value) => value != null && value !== '' && Number.isFinite(Number(value));

/** A sum over the trucks that have the value, and how many of them did. */
function total(rows, key) {
  const present = rows.filter((row) => known(row[key]));
  return {
    value: present.length ? present.reduce((sum, row) => sum + Number(row[key]), 0) : null,
    trucks: present.length,
  };
}

/** "40–50 km/h", "70+ km/h", or null when the truck has no best band yet. */
export function bandLabel(minKmh, maxKmh) {
  if (!known(minKmh) || !known(maxKmh)) return null;
  return maxKmh >= 999 ? `${minKmh}+ km/h` : `${minKmh}–${maxKmh} km/h`;
}

/** Distance and diesel of one truck's speed bands, for fleet km/L. */
function bandTotals(profile) {
  let km = 0;
  let litres = 0;
  let bestLitres = 0;
  let inBandKm = 0;
  for (const band of profile.bands ?? []) {
    const distance = Number(band.distanceKm) || 0;
    if (!distance || !(band.efficiencyKmpl > 0)) continue;
    km += distance;
    litres += distance / band.efficiencyKmpl;
    if (profile.optimalEfficiencyKmpl > 0) bestLitres += distance / profile.optimalEfficiencyKmpl;
    if (band.minKmh === profile.optimalMinKmh) inBandKm += distance;
  }
  return { km, litres, bestLitres, inBandKm };
}

/** Everything the page's cards show, read from the profile rows. */
export function summarizeProfiles(rows) {
  const fleet = rows.map(bandTotals).reduce(
    (sum, truck) => ({
      km: sum.km + truck.km,
      litres: sum.litres + truck.litres,
      bestLitres: sum.bestLitres + truck.bestLitres,
      inBandKm: sum.inBandKm + truck.inBandKm,
    }),
    { km: 0, litres: 0, bestLitres: 0, inBandKm: 0 },
  );

  const bands = new Map();
  for (const row of rows) {
    const label = bandLabel(row.optimalMinKmh, row.optimalMaxKmh);
    if (label) bands.set(label, (bands.get(label) ?? 0) + 1);
  }
  const [commonBand = null, commonBandTrucks = 0] = [...bands].sort((a, b) => b[1] - a[1])[0] ?? [];

  const speeds = rows.filter((row) => known(row.avgSpeedKmh));
  const priced = rows.filter((row) => known(row.potentialSavingsInr));
  const top = priced.reduce(
    (best, row) => (!best || row.potentialSavingsInr > best.potentialSavingsInr ? row : best),
    null,
  );

  return {
    count: rows.length,
    savingsInr: total(rows, 'potentialSavingsInr'),
    savingsL: total(rows, 'potentialSavingsL'),
    distanceKm: fleet.km || null,
    inBandKm: fleet.km ? fleet.inBandKm : null,
    pctInBand: fleet.km ? (fleet.inBandKm / fleet.km) * 100 : null,
    fleetKmpl: fleet.litres ? fleet.km / fleet.litres : null,
    bestKmpl: fleet.bestLitres ? fleet.km / fleet.bestLitres : null,
    commonBand,
    commonBandTrucks,
    avgSpeedKmh: speeds.length
      ? speeds.reduce((sum, row) => sum + Number(row.avgSpeedKmh), 0) / speeds.length
      : null,
    mostlyOutside: rows.filter(
      (row) => known(row.pctDistanceInOptimalBand) && row.pctDistanceInOptimalBand < 50,
    ).length,
    top,
    windows: total(rows, 'sampleWindows').value,
    computedAt:
      rows
        .map((row) => row.computedAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null,
  };
}
