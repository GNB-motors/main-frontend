import { Factory, MapPinned, Info } from 'lucide-react';
import { evidenceLines, poiText, roleText } from './facilityText';

/**
 * What trip detection sees at this place: the facility it belongs to (one
 * physical place, however many records the GPS scattered around it), its
 * pickup/drop role and why, and what the map says is here.
 */
export default function FacilityCard({ site }) {
  const f = site?.facility;
  const poi = poiText(site?.poi);
  if (!f && !poi) return null;
  const role =
    f && (f.roles || []).includes('DROP') && !(f.roles || []).includes('PICKUP')
      ? 'DROP'
      : 'PICKUP';
  const lines = f ? evidenceLines(f, role) : [];
  const partOf = f && f.canonicalId && String(f.canonicalId) !== String(site._id);
  return (
    <div className="pi-detail-sec">
      <h4 className="pi-section-title">What trips see here</h4>
      {f ? (
        <p style={{ margin: '4px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Factory size={14} aria-hidden="true" />
          <strong>{roleText(f)}</strong>
          {f.name ? <span>· {f.name}</span> : null}
          {partOf ? <span>· part of a larger facility</span> : null}
        </p>
      ) : null}
      {poi ? (
        <p style={{ margin: '4px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
          <MapPinned size={14} aria-hidden="true" /> On the map: {poi}
        </p>
      ) : null}
      {lines.length ? (
        <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13 }}>
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : null}
      {f?.needsReview ? (
        <div className="pi-callout pi-callout--warn" style={{ marginTop: 8 }}>
          <Info size={15} aria-hidden="true" />
          <span>
            {f.typeSource === 'INFERRED'
              ? 'The system treats this place as a '
              : 'This place might be a '}
            {(f.typeSource === 'INFERRED' ? f.roles : f.suggestions || [])
              .map((r) => (r === 'PICKUP' ? 'pickup' : 'drop'))
              .join(' and ')}{' '}
            — please confirm or correct it below.
          </span>
        </div>
      ) : null}
    </div>
  );
}
