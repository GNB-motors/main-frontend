const position = (point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng);
const KIND = {
  LADEN: 'Loaded running',
  EMPTY: 'Empty running',
  REPOSITION: 'Repositioning',
  UNKNOWN: 'Recorded running',
};

export function journeyPlaces(track) {
  return [
    ...(track?.stops || []).map((stop, index) => ({
      id: `stop:${index}:${stop.startAt}`,
      title: stop.place?.name || 'Recorded stop',
      at: stop.startAt,
      endAt: stop.endAt,
      durationMin: stop.durationMin,
      description: stop.reasonWhy,
      ...(position(stop.place) ? { lat: stop.place.lat, lng: stop.place.lng } : {}),
    })),
    ...(track?.landmarks || []).filter(position).map((place, index) => ({
      id: `landmark:${place.id || index}`,
      title: place.name,
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
