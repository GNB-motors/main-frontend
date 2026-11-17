import { buildTripLog } from './trackPlayback';

/** Determine vehicle status from raw point */
function getPointStatus(point, summary) {
  if (!point) {
    return {
      kind: 'STOP',
      title: 'Stopped',
      detail: summary?.km ? `${summary.km} km recorded` : 'Parked',
    };
  }
  const spd = Number(point.speedKmh ?? 0);
  const ign = point.ign;
  if (spd > 3) {
    return {
      kind: 'MOVING',
      title: `Moving · ${Math.round(spd)} km/h`,
      detail: summary?.km ? `In motion · ${summary.km} km recorded` : 'In motion on route',
    };
  }
  if (ign === true) {
    return {
      kind: 'IDLING',
      title: 'Idling · Engine ON',
      detail: 'Stationary with engine running',
    };
  }
  return {
    kind: 'STOP',
    title: 'Stopped · Engine OFF',
    detail: summary?.km ? `Parked · ${summary.km} km recorded` : 'Parked',
  };
}

export function journeyLogRows(track, effectivePoints = track?.points || []) {
  const stops = track?.stops || [];
  const summary = track?.summary;
  const baseRows = buildTripLog(stops, track?.events || []);
  if (!effectivePoints.length && !baseRows.length) return [];
  if (!effectivePoints.length) return baseRows;

  const firstPoint = effectivePoints[0];
  const lastPoint = effectivePoints[effectivePoints.length - 1];
  const firstPointMs = new Date(firstPoint.t).getTime();
  const lastPointMs = new Date(lastPoint.t).getTime();

  const result = [...baseRows];

  // 2. If the vehicle was active after the last event/stop before track end:
  if (result.length > 0) {
    const lastRow = result[result.length - 1];
    const lastRowStartMs = new Date(lastRow.at).getTime();
    const lastRowEndMs = lastRow.gapEndAt
      ? new Date(lastRow.gapEndAt).getTime()
      : lastRowStartMs + (Number(lastRow.durationMin) || 0) * 60000;

    const endStatus = getPointStatus(lastPoint, summary);

    // If significant time (>= 10 min) elapsed after last event
    if (lastPointMs - lastRowEndMs >= 10 * 60000) {
      const activeMin = Math.round((lastPointMs - lastRowEndMs) / 60000);
      result.push({
        key: `moving-${lastRowEndMs}-${lastPointMs}`,
        at: new Date(lastRowEndMs).toISOString(),
        endAt: lastPoint.t,
        kind: 'MOVING',
        reason: 'MOVING',
        title: 'Moving',
        text: summary?.maxKmh
          ? `In motion on route · Top ${summary.maxKmh} km/h`
          : 'In motion on route',
        durationMin: activeMin,
        place: null,
        isGap: false,
      });

      // Status at the end of the track replay window
      result.push({
        key: `status-end-${lastPoint.t}`,
        at: lastPoint.t,
        kind: endStatus.kind,
        reason: endStatus.kind,
        title: endStatus.title,
        text: endStatus.detail,
        durationMin: null,
        place: null,
        isGap: false,
      });
    } else if (lastPointMs - lastRowEndMs > 3 * 60000 && lastRow.kind !== 'STOP') {
      result.push({
        key: `status-end-${lastPoint.t}`,
        at: lastPoint.t,
        kind: endStatus.kind,
        reason: endStatus.kind,
        title: endStatus.title,
        text: endStatus.detail,
        durationMin: null,
        place: null,
        isGap: false,
      });
    }
  } else if (effectivePoints.length >= 2) {
    // Entire track window has no stops or events:
    const totalMin = Math.round((lastPointMs - firstPointMs) / 60000);
    const startStatus = getPointStatus(firstPoint, summary);
    const endStatus = getPointStatus(lastPoint, summary);

    result.push({
      key: `status-start-${firstPoint.t}`,
      at: firstPoint.t,
      kind: startStatus.kind,
      reason: startStatus.kind,
      title: startStatus.kind === 'MOVING' ? 'Moving' : startStatus.title,
      text: startStatus.detail,
      durationMin: totalMin,
      place: null,
      isGap: false,
    });

    result.push({
      key: `status-end-${lastPoint.t}`,
      at: lastPoint.t,
      kind: endStatus.kind,
      reason: endStatus.kind,
      title: endStatus.title,
      text: endStatus.detail,
      durationMin: null,
      place: null,
      isGap: false,
    });
  }

  const journeyRows = result.map((row) => {
    if (!['MOVING', 'STOP', 'IDLING'].includes(row.kind) || row.stopId) return row;
    // Anchor a synthetic movement to its first recorded fix, never an interpolated location.
    const point = effectivePoints.find(
      (item) =>
        Date.parse(item.t) >= Date.parse(row.at) &&
        Date.parse(item.t) <= Date.parse(row.endAt || row.at),
    );
    const name = row.place?.name?.trim() || point?.place?.name?.trim() || point?.address?.trim();
    const speed = Number.isFinite(point?.speedKmh) ? `${Math.round(point.speedKmh)} km/h` : null;
    return {
      ...row,
      title: name || (row.kind === 'MOVING' ? 'Place not identified' : row.title),
      place: row.place || point?.place || null,
      fixAt: point?.t || null,
      lat: point?.lat,
      lng: point?.lng,
      text: [row.text, speed].filter(Boolean).join(' · '),
    };
  });
  // Events can start before the first GPS fix when a stop overlaps the window.
  const firstRow = journeyRows[0];
  const startAt = firstRow && Date.parse(firstRow.at) < firstPointMs ? firstRow.at : firstPoint.t;
  if (firstRow && Date.parse(firstRow.at) === Date.parse(startAt)) {
    return [{ ...firstRow, isStart: true }, ...journeyRows.slice(1)];
  }
  const startPlace = stops.find(
    (stop) =>
      Date.parse(stop.startAt) <= Date.parse(startAt) &&
      Date.parse(stop.endAt || stop.startAt) >= Date.parse(startAt),
  )?.place;
  return [
    {
      key: `replay-start-${startAt}`,
      at: startAt,
      kind: 'START',
      isStart: true,
      title:
        startPlace?.name?.trim() ||
        (startAt === firstPoint.t
          ? firstPoint.place?.name?.trim() || firstPoint.address?.trim()
          : null) ||
        'Starting point',
      text: 'Beginning of this replay window.',
      durationMin: null,
      place: startPlace || firstPoint.place || null,
      fixAt: startAt === firstPoint.t ? firstPoint.t : null,
      lat: firstPoint.lat,
      lng: firstPoint.lng,
      isGap: false,
    },
    ...journeyRows,
  ];
}
