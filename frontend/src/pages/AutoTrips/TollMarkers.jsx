import { MarkerF } from '@react-google-maps/api';
import { googleMapsUrl } from '../../utils/googleMapsLink.js';

const AMBER = '#B45309';

/** 22 px round badge with a "₹" glyph; a white disc ringed amber when ahead, filled amber when passed. */
function badge(passed) {
  const fill = passed ? AMBER : '#FFFFFF';
  const ring = passed ? '#FFFFFF' : AMBER;
  const glyph = passed ? '#FFFFFF' : AMBER;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">` +
    `<circle cx="11" cy="11" r="10" fill="${fill}" stroke="${ring}" stroke-width="2"/>` +
    `<text x="11" y="15.5" text-anchor="middle" font-size="12" font-weight="700" font-family="Arial, sans-serif" fill="${glyph}">&#8377;</text>` +
    `</svg>`;
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 22, height: 22 },
    anchor: { x: 11, y: 11 },
  };
}

/**
 * The toll plazas on the replay map. A plaza the replay has already passed is filled, one still
 * ahead is hollow, so the map says how far through its tolls the truck is. Clicking a plaza
 * opens it in Google Maps. Render inside GoogleMap.
 */
export default function TollMarkers({ marks }) {
  return marks.map((m) => (
    <MarkerF
      key={m.id}
      position={m.at}
      icon={badge(m.passed)}
      title={`Toll: ${m.title ?? 'plaza'}`}
      clickable
      onClick={() => {
        if (m.at) window.open(googleMapsUrl({ lat: m.at.lat, lng: m.at.lng, name: m.title }), '_blank', 'noopener,noreferrer');
      }}
      zIndex={5}
    />
  ));
}
