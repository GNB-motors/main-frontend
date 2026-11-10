import { Pencil, Trash2 } from 'lucide-react';
import { num } from '../../../utils/formatMoney.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import { alertSummary } from '../model/mergePlaces.js';
import { placeTypeLabel } from '../model/placeGroups.js';
import { radiusLabel } from '../model/placeLabels.js';
import { isNum, areaM2Of } from '../model/placeGeometry.js';
import Frame from './Frame.jsx';
import Note from './Note.jsx';
import Stats from './Stats.jsx';
import Where from './Where.jsx';
import SiteInsight from './SiteInsight.jsx';
import WarehouseRoster from './WarehouseRoster.jsx';

/** The real area of a place: hectares once it is big, square metres before. */
function areaLabel(areaM2) {
  if (!isNum(areaM2) || areaM2 <= 0) return null;
  if (areaM2 >= 10000) return `${(areaM2 / 10000).toFixed(1)} ha`;
  return `${Math.round(areaM2)} m2`;
}

/**
 * The places this one is joined with: named when the merged list knows them,
 * counted when it does not.
 */
function joinedLabel(place, places) {
  if (!place?.groupId) return null;
  const self = place.sourceId ? String(place.sourceId) : '';
  const ids = (place.groupMembers || []).filter((id) => String(id) !== self);
  if (!ids.length) return null;
  const names = new Map((places || []).map((p) => [String(p.sourceId), p.name]));
  const named = ids.map((id) => names.get(String(id))).filter(Boolean);
  if (named.length) return `Joined with: ${named.join(', ')}`;
  return `Joined with ${ids.length} places`;
}

export default function PlaceDetail({
  place,
  places,
  canEdit,
  onClose,
  onEdit,
  onDelete,
  onReviewed,
}) {
  const raw = place.raw;
  const isSite = place.source === 'site';
  const area = place.areaSource === 'STOP_AREA' ? areaLabel(place.areaM2) : null;
  const shape = area
    ? `Area: ${area} from where trucks stood`
    : place.polygon
      ? `Drawn outline · ${place.polygon.length} points`
      : `Circle · ${radiusLabel(place.radiusM)} radius`;
  // The busiest part: where the trucks stood, drawn darker on the map.
  const core = place.coreParts ? areaLabel(areaM2Of(place.coreParts)) : null;
  const joined = joinedLabel(place, places);
  const address =
    place.source === 'warehouse'
      ? [raw.address, raw.city, raw.state, raw.pincode].filter(Boolean).join(', ')
      : raw.address?.formatted || '';
  const editable = canEdit && !place.readOnly && !isSite;

  return (
    <Frame
      icon={<TypeTile type={place.type} size={40} />}
      eyebrow={placeTypeLabel(place.type)}
      title={place.name}
      onClose={onClose}
      footer={
        editable && (
          <>
            <span className="ph-spacer" />
            <button
              type="button"
              className="ph-btn ph-btn--ghost ph-btn--danger"
              onClick={() => onDelete(place)}
            >
              <Trash2 size={14} /> {place.source === 'warehouse' ? 'Deactivate' : 'Delete'}
            </button>
            <button type="button" className="ph-btn ph-btn--primary" onClick={() => onEdit(place)}>
              <Pencil size={14} /> Edit
            </button>
          </>
        )
      }
    >
      {place.readOnlyReason && <Note>{place.readOnlyReason}</Note>}

      {place.source === 'warehouse' && (
        <Stats
          items={[
            { label: 'Vehicles based here', value: num(raw.vehicleCount || 0) },
            { label: 'Code', value: raw.code || '—' },
          ]}
        />
      )}
      {place.source === 'zone' && (
        <Stats
          items={[
            { label: 'Alerts', value: alertSummary(place.alerts.entry, place.alerts.exit) },
            { label: 'Shape', value: place.polygon ? 'Outline' : 'Circle' },
          ]}
        />
      )}
      {isSite && (
        <SiteInsight place={place} canAnswer={canEdit && !place.readOnly} onAnswered={onReviewed} />
      )}

      <Where
        lat={place.lat}
        lng={place.lng}
        shape={shape}
        address={address}
        extra={[core ? `Busiest part: ${core}` : null, joined].filter(Boolean)}
      />
      {place.source === 'warehouse' && <WarehouseRoster id={place.sourceId} />}
      {place.source === 'zone' && (
        <Note>A truck idling inside this zone counts as legit idling.</Note>
      )}
    </Frame>
  );
}
