import { renderToStaticMarkup } from 'react-dom/server';
import {
  BadgeCheck,
  Cross,
  Factory,
  Fuel,
  Landmark,
  ParkingSquare,
  Shield,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import { placeLayerColor } from '../../utils/redesign/tone';

/**
 * mapPlaceIcon — the pin for a landmark on the Track map.
 *
 * A landmark is a small round pin in its layer colour with the layer's
 * icon in white, so a driver can tell a pump from a hospital at a glance.
 * Google's own labels sit under these.
 */

/** The lucide icon for each place layer. */
const LAYER_ICONS = {
  plants: Factory,
  sites: Factory,
  pumps: Fuel,
  dhabas: UtensilsCrossed,
  hospitals: Cross,
  police: Shield,
  workshops: Wrench,
  tyres: Wrench,
  dealers: BadgeCheck,
  parking: ParkingSquare,
  tolls: Landmark,
  weighbridges: Landmark,
};

/** The layer a place belongs to, when the API did not say. */
function layerOf(place) {
  const category = String(place.category || '').toLowerCase();
  if (category.includes('hospital') || category.includes('medical')) return 'hospitals';
  if (category.includes('police')) return 'police';
  if (category.includes('dhaba') || category.includes('food')) return 'dhabas';
  if (category.includes('pump') || category.includes('fuel')) return 'pumps';
  if (category.includes('workshop') || category.includes('service')) return 'workshops';
  if (category.includes('tyre')) return 'tyres';
  if (category.includes('dealer')) return 'dealers';
  if (category.includes('parking')) return 'parking';
  if (category.includes('toll')) return 'tolls';
  if (category.includes('weigh')) return 'weighbridges';
  if (category.includes('plant')) return 'plants';
  return 'sites';
}

/** The layer a place belongs to. */
export function layerForPlace(place) {
  return place.layer || layerOf(place);
}

/** The colour a place is drawn in. */
export function colorForPlace(place) {
  return placeLayerColor(layerForPlace(place));
}

/** The white glyph for a layer, as an SVG fragment. */
function layerGlyph(layer, size) {
  const Icon = LAYER_ICONS[layer] || Factory;
  const markup = renderToStaticMarkup(
    Icon({ size, color: 'currentColor', strokeWidth: 2.4, 'aria-hidden': 'true' }),
  );
  // The markup is already an <svg>; only its size and colour are ours.
  return markup
    .replace('<svg', `<svg width="${size}" height="${size}"`)
    .replace(/currentColor/g, '#ffffff');
}

/**
 * A round pin: the layer colour filled, the layer icon in white.
 * `size` is the pin's diameter in pixels.
 */
export function mapPlaceIcon(place, { size = 22, selected = false } = {}) {
  const layer = layerForPlace(place);
  const color = placeLayerColor(layer);
  const glyphSize = Math.round(size * 0.55);

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
        `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${color}" stroke="${
          selected ? '#ffffff' : 'rgba(0,0,0,0.20)'
        }" stroke-width="${selected ? 3 : 1}"/>` +
        `<g transform="translate(${size / 2 - glyphSize / 2} ${size / 2 - glyphSize / 2})">` +
        layerGlyph(layer, glyphSize) +
        `</g></svg>`,
    )}`,
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
  };
}
