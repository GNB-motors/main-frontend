import typeStyle from './placeTypes';
import { typeLabel } from './placeIntelligenceModel';

/**
 * The place type as a coloured tile. Hollow (dashed) when it is only the
 * engine's guess, solid once a person has confirmed it — the same rule as
 * the map markers.
 */
export default function TypeBadge({ type, hollow = false, large = false }) {
  const { Icon, color } = typeStyle(type);
  const cls = ['pi-badge', hollow && 'pi-badge--hollow', large && 'pi-badge--lg']
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls} style={{ '--pi-type': color }} title={typeLabel(type)}>
      <Icon size={large ? 22 : 18} aria-hidden="true" />
    </span>
  );
}
