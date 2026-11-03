import { placeLayerColor } from '../../utils/redesign/tone';

/**
 * mapPlaceIcon — the pin for a landmark on the Track map.
 *
 * A landmark is a small round pin in its layer colour with the layer's
 * glyph in white, so a driver can tell a pump from a hospital at a glance.
 * Google's own labels sit under these.
 *
 * The glyphs are drawn here as plain SVG paths rather than pulled in from
 * the icon library: they are on the map at every zoom, and a handful of
 * hand-written paths cost a fraction of what shipping a renderer for them
 * would.
 */

/** The glyph for each place layer, as SVG path data on a 24×24 grid. */
const LAYER_GLYPHS = {
  plants: ['M3 21h18V10l-6 4V10l-6 4V6H3z'],
  sites: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'],
  pumps: ['M12 3s6 6.6 6 10.5a6 6 0 0 1-12 0C6 9.6 12 3 12 3z'],
  dhabas: ['M6 3v6a2 2 0 0 0 4 0V3', 'M8 11v10', 'M16 3v18', 'M16 3c2 2 2 6 0 8'],
  hospitals: ['M9 4h6v5h5v6h-5v5H9v-5H4V9h5z'],
  police: ['M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z'],
  workshops: ['M15 3a5 5 0 0 0-4.6 7L4 16.4V20h3.6l6.4-6.4A5 5 0 0 0 21 9l-3 3-3-3z'],
  tyres: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v10', 'M7 12h10'],
  dealers: ['M12 3l2.5 1.5L16 4l1 2.5L19.5 7v3L21 12l-1.5 2.5V17L17 18l-1 2.5-3 .5L12 21l-1.5-1.5L8 20l-1-2.5L4.5 17v-2.5L3 12l1.5-2.5V7L7 6.5 8 4l2.5.5z', 'M9 12l2 2 4-4'],
  parking: ['M9 3h4a4 4 0 0 1 0 8H9z', 'M9 11v10'],
  tolls: ['M12 3l9 5H3z', 'M5 8v8', 'M9.5 8v8', 'M14.5 8v8', 'M19 8v8', 'M3 20h18'],
  weighbridges: ['M3 8h18', 'M6 8v12', 'M18 8v12', 'M6 14h12'],
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
  const paths = LAYER_GLYPHS[layer] || LAYER_GLYPHS.sites;
  return (
    `<g transform="translate(${size * 0.225} ${size * 0.225}) scale(${size * 0.55 / 24})" ` +
    'fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    paths.map((d) => `<path d="${d}"/>`).join('') +
    '</g>'
  );
}

/**
 * A round pin: the layer colour filled, the layer glyph in white.
 * `size` is the pin's diameter in pixels.
 */
export function mapPlaceIcon(place, { size = 22, selected = false } = {}) {
  const layer = layerForPlace(place);
  const color = placeLayerColor(layer);

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
        `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${color}" stroke="${
          selected ? '#ffffff' : 'rgba(0,0,0,0.20)'
        }" stroke-width="${selected ? 3 : 1}"/>` +
        layerGlyph(layer, size) +
        `</svg>`,
    )}`,
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
  };
}
