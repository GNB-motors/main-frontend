import typeStyle from './placeTypes';
import { placeTitle } from './model/siteSummary.js';
import { effectiveType, endpointLabel } from './model/siteType.js';

/** One end of a leg: the place's readable name with its type icon. */
export default function LegEnd({ site, fallback }) {
  const type = site ? effectiveType(site).type : fallback;
  const { Icon, color } = typeStyle(type);
  return (
    <span className="pi-leg-end" style={{ '--pi-type': color }}>
      <Icon size={14} aria-hidden="true" />
      {site ? placeTitle(site) : endpointLabel(fallback)}
    </span>
  );
}
