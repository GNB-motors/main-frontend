import { Pencil, Trash2 } from 'lucide-react';
import { num } from '../../../utils/formatMoney.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import { placeTypeLabel, radiusLabel, alertSummary } from '../placeHubModel.js';
import Frame from './Frame.jsx';
import Note from './Note.jsx';
import Stats from './Stats.jsx';
import Where from './Where.jsx';
import SiteInsight from './SiteInsight.jsx';
import WarehouseRoster from './WarehouseRoster.jsx';

export default function PlaceDetail({ place, canEdit, onClose, onEdit, onDelete, onReviewed }) {
  const raw = place.raw;
  const isSite = place.source === 'site';
  const shape = place.polygon
    ? `Drawn outline · ${place.polygon.length} points`
    : `Circle · ${radiusLabel(place.radiusM)} radius`;
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

      <Where lat={place.lat} lng={place.lng} shape={shape} address={address} />
      {place.source === 'warehouse' && <WarehouseRoster id={place.sourceId} />}
      {place.source === 'zone' && (
        <Note>A truck idling inside this zone counts as legit idling.</Note>
      )}
    </Frame>
  );
}
