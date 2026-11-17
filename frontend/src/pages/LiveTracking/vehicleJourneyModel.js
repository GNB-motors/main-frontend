import { journeyLogRows } from './journeyLogRows';

const position = (point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng);
const KIND = {
  LADEN: 'Loaded running',
  EMPTY: 'Empty running',
  REPOSITION: 'Repositioning',
  UNKNOWN: 'Recorded running',
};

export function journeyPlaces(track) {
  const visited = new Set(
    (track?.stops || [])
      .filter((stop) => stop.place?.id)
      .map((stop) => `${stop.place.kind}:${stop.place.id}`),
  );
  const pointPlaces = journeyLogRows(track).filter((row) => row.fixAt && row.place?.id);
  const namedPoints = new Set(pointPlaces.map((row) => `${row.place.kind}:${row.place.id}`));
  return [
    ...(track?.stops || []).map((stop, index) => ({
      id: `stop:${index}:${stop.startAt}`,
      title: stop.place?.name || 'Place not identified',
      kind: 'stop',
      stopId: stop.id || null,
      siteId: stop.orgSiteId || null,
      unidentified: !stop.place?.name?.trim(),
      place: stop.place || null,
      at: stop.startAt,
      endAt: stop.endAt,
      durationMin: stop.durationMin,
      description: stop.reasonWhy,
      ...(position(stop)
        ? { lat: stop.lat, lng: stop.lng }
        : position(stop.place)
          ? { lat: stop.place.lat, lng: stop.place.lng }
          : {}),
    })),
    ...journeyLogRows(track)
      .filter(
        (row) =>
          row.fixAt &&
          !row.stopId &&
          position(row) &&
          !(track?.stops || []).some(
            (stop) =>
              Date.parse(row.fixAt) >= Date.parse(stop.startAt) &&
              Date.parse(row.fixAt) <= Date.parse(stop.endAt || stop.startAt),
          ) &&
          !visited.has(`${row.place?.kind}:${row.place?.id}`),
      )
      .map((row) => ({
        ...row,
        id: `point:${row.fixAt}`,
        kind: 'point',
        unidentified: !row.place?.name?.trim(),
        description: 'Recorded GPS location on this journey',
      }))
      .filter((row, index, rows) => rows.findIndex((item) => item.fixAt === row.fixAt) === index),
    ...(track?.landmarks || [])
      .filter(
        (place) =>
          position(place) &&
          !visited.has(`${place.kind}:${place.id}`) &&
          !namedPoints.has(`${place.kind}:${place.id}`),
      )
      .map((place, index) => ({
        id: `landmark:${place.id || index}`,
        title: place.name,
        kind: 'landmark',
        place,
        lat: place.lat,
        lng: place.lng,
        description: Number.isFinite(place.distanceFromPathM)
          ? `${Math.round(place.distanceFromPathM)} m from the recorded path`
          : 'Near the recorded path',
      })),
  ];
}

export function journeyRoutes(track) {
  return (track?.segments || [])
    .filter((segment) => segment.kind !== 'GAP')
    .map((segment, index) => {
      const start = Date.parse(segment.fromT);
      const end = Date.parse(segment.toT);
      const path = (track?.points || []).filter(
        (point) => position(point) && Date.parse(point.t) >= start && Date.parse(point.t) <= end,
      );
      return {
        id: `section:${index}:${segment.fromT}`,
        title: KIND[segment.kind] || 'Recorded running',
        at: segment.fromT,
        endAt: segment.toT,
        km: segment.km,
        durationMin: Number.isFinite(start) && end >= start ? (end - start) / 60000 : null,
        path,
      };
    });
}
