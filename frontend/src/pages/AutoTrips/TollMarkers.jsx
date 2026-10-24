import { MarkerF } from '@react-google-maps/api';

const AMBER = '#B45309';
/** A small square: a toll gate reads differently from the round stop and place markers. */
const SQUARE = 'M -5,-5 L 5,-5 L 5,5 L -5,5 Z';

function icon(passed) {
  return {
    path: SQUARE,
    scale: 1,
    fillColor: passed ? AMBER : '#FFFFFF',
    fillOpacity: 1,
    strokeColor: AMBER,
    strokeWeight: 2,
  };
}

/**
 * The toll plazas on the replay map. A plaza the replay has already passed is filled, one still
 * ahead is hollow, so the map says how far through its tolls the truck is. Render inside GoogleMap.
 */
export default function TollMarkers({ marks }) {
  return marks.map((m) => (
    <MarkerF key={m.id} position={m.at} icon={icon(m.passed)} title={m.title} zIndex={5} />
  ));
}
