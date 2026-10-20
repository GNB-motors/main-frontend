import { styleOfType } from './placeHubStyle.js';

// Lives at this path because PlaceHubDrawer imports it from here.
export function TypeTile({ type, color: override, Icon: IconOverride, size = 34 }) {
  const { Icon, color } = styleOfType(type);
  const C = IconOverride || Icon;
  const c = override || color;
  return (
    <span
      className="ph-tile"
      style={{ width: size, height: size, color: c, background: `${c}1a`, borderColor: `${c}33` }}
      aria-hidden="true"
    >
      <C size={Math.round(size * 0.5)} />
    </span>
  );
}
