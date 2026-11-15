/** Keep every pass, including return crossings; never substitute missing coverage with zero. */
export function replayTolls(passes = [], playheadTime) {
  const time = playheadTime == null ? NaN : new Date(playheadTime).getTime();
  return passes
    .filter(
      (pass) =>
        Number.isFinite(pass.lat) &&
        Number.isFinite(pass.lng) &&
        Math.abs(pass.lat) <= 90 &&
        Math.abs(pass.lng) <= 180 &&
        Number.isFinite(Date.parse(pass.at)),
    )
    .map((pass) => {
      const passed = Date.parse(pass.at) <= time;
      const action =
        pass.evidence === 'STOP'
          ? 'Stopped at toll plaza'
          : pass.inferred || pass.evidence !== 'ROAD'
            ? 'Crossing inferred'
            : 'Toll crossed';
      return { ...pass, passed, action, label: passed ? action : 'Upcoming in replay' };
    });
}

/**
 * What the server says about its own coverage: a partial set of crossings, and a road
 * it could not match.
 */
export function tollCoverageNote(data) {
  if (!data || data.status !== 'PARTIAL') return null;
  const parts = ['partial'];
  const roadNotMatched = (data.coverage || []).some((c) => c?.reason === 'ROAD_NOT_MATCHED');
  if (roadNotMatched) parts.push('road not matched');
  return parts.join(' · ');
}

export function tollCoverageText(data, { loading = false, error = null } = {}) {
  if (loading) return 'Loading toll crossings…';
  if (error) return 'Toll crossings unavailable. Replay is still available.';
  if (!data || data.status === 'NOT_COMPUTED')
    return 'Toll crossings have not been computed for this period.';
  const partial = tollCoverageNote(data);
  if (partial) return `Toll coverage is incomplete (${partial}). Available crossings are shown.`;
  if (data.status !== 'READY') return 'Toll coverage is incomplete. Available crossings are shown.';
  return data.passes?.length ? null : 'No toll crossings detected in this period.';
}

/**
 * The short form of the toll status, for the chip in the replay bar.
 * Unknown is never zero: when the crossings could not be worked out the chip
 * says so instead of counting nothing.
 */
export function tollChipText(data, { loading = false, error = null, passed = 0, total = 0 } = {}) {
  if (loading) return 'Tolls loading…';
  if (error) return 'Tolls unavailable';
  if (!data || data.status === 'NOT_COMPUTED') return 'Tolls not computed';
  const partial = tollCoverageNote(data);
  if (partial) return `Tolls ${partial}`;
  if (data.status !== 'READY') return 'Tolls partly known';
  if (!total) return 'No toll crossings';
  return `Tolls ${passed}/${total} reached`;
}
