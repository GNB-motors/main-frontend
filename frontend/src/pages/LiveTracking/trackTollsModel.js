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

export function tollCoverageText(data, { loading = false, error = null } = {}) {
  if (loading) return 'Loading toll crossings…';
  if (error) return 'Toll crossings unavailable. Replay is still available.';
  if (!data || data.status === 'NOT_COMPUTED')
    return 'Toll crossings have not been computed for this period.';
  if (data.status !== 'READY') return 'Toll coverage is incomplete. Available crossings are shown.';
  return data.passes?.length ? null : 'No toll crossings detected in this period.';
}
