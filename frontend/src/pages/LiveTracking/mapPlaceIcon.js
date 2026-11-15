import { LAYER_GLYPHS, PLACE_ICON_SIZES, PLACE_TYPE_LAYERS } from '../../config/placeIcons.js';
import { resolveMapColor } from './mapColor.js';
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
  return (
    place.layer ||
    PLACE_TYPE_LAYERS[place.type] ||
    PLACE_TYPE_LAYERS[place.category] ||
    layerOf(place)
  );
}

/** The colour a place is drawn in. */
export function colorForPlace(place) {
  return placeLayerColor(layerForPlace(place));
}

/** The white glyph for a layer, as an SVG fragment. */
function layerGlyph(layer, size, ink = '#ffffff') {
  const paths = LAYER_GLYPHS[layer] || LAYER_GLYPHS.sites;
  return (
    `<g transform="translate(${size * 0.225} ${size * 0.225}) scale(${(size * 0.55) / 24})" ` +
    `fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    paths.map((d) => `<path d="${d}"/>`).join('') +
    '</g>'
  );
}

/**
 * A round pin: the layer colour filled, the layer glyph in white.
 * `size` is the pin's diameter in pixels.
 */
export function mapPlaceIconUrl(
  place,
  {
    size = PLACE_ICON_SIZES.default,
    selected = false,
    hollow = false,
    color: customColor,
    risk = false,
  } = {},
) {
  const layer = layerForPlace(place);
  const color = resolveMapColor(customColor || placeLayerColor(layer));

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${hollow ? '#ffffff' : color}" stroke="${
        risk ? '#c62828' : selected ? '#ffffff' : color
      }" stroke-width="${risk || selected ? 3 : 1}"/>` +
      layerGlyph(layer, size, hollow ? color : '#ffffff') +
      `</svg>`,
  )}`;
}

export function mapPlaceIcon(
  place,
  {
    size = PLACE_ICON_SIZES.default,
    selected = false,
    hollow = false,
    color: customColor,
    risk = false,
  } = {},
) {
  return {
    url: mapPlaceIconUrl(place, { size, selected, hollow, color: customColor, risk }),
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
  };
}

export const tollMarkerIcon = (visited) =>
  mapPlaceIcon(
    { layer: 'tolls' },
    {
      size: visited ? PLACE_ICON_SIZES.tolls.visited : PLACE_ICON_SIZES.tolls.upcoming,
      hollow: !visited,
    },
  );
