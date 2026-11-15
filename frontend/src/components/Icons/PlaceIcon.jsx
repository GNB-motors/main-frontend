import { LAYER_GLYPHS, PLACE_TYPE_LAYERS } from '../../config/placeIcons.js';

/** The same category glyph used by map markers, place lists, controls and legends. */
export default function PlaceIcon({ type, layer, size = 18, ...props }) {
  const paths = LAYER_GLYPHS[layer || PLACE_TYPE_LAYERS[type]] || LAYER_GLYPHS.sites;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
