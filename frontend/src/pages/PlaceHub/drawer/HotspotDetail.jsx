import { timeAgo } from '../../../utils/formatters';
import { Pencil, Flame, EyeOff, Eye } from 'lucide-react';
import { num } from '../../../utils/formatMoney.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import { PROVENANCE_LABEL, radiusLabel } from '../placeHubModel.js';
import { PROVENANCE_COLOR } from '../placeHubStyle.js';
import Frame from './Frame.jsx';
import Note from './Note.jsx';
import Stats from './Stats.jsx';
import Where from './Where.jsx';

export default function HotspotDetail({ hotspot, canEdit, onClose, onEdit, onToggle }) {
  const own = hotspot.provenance !== 'network';
  return (
    <Frame
      icon={<TypeTile Icon={Flame} color={PROVENANCE_COLOR[hotspot.provenance]} size={40} />}
      eyebrow={PROVENANCE_LABEL[hotspot.provenance]}
      title={hotspot.name}
      onClose={onClose}
      footer={
        own && canEdit ? (
          <>
            <span className="ph-spacer" />
            <button
              type="button"
              className="ph-btn ph-btn--ghost"
              onClick={() => onToggle(hotspot)}
            >
              {hotspot.active ? <EyeOff size={14} /> : <Eye size={14} />}
              {hotspot.active ? 'Dismiss' : 'Reactivate'}
            </button>
            <button
              type="button"
              className="ph-btn ph-btn--primary"
              onClick={() => onEdit(hotspot)}
            >
              <Pencil size={14} /> Edit
            </button>
          </>
        ) : null
      }
    >
      {!hotspot.active && <Note tone="warn">Dismissed — refuels here are no longer flagged.</Note>}
      <Stats
        items={[
          {
            label: 'Incidents',
            value: num(hotspot.incidentCount),
            tone: hotspot.incidentCount ? 'crit' : null,
          },
          {
            label: 'Last incident',
            value: hotspot.lastIncidentAt ? timeAgo(hotspot.lastIncidentAt) : '—',
          },
          {
            label: 'Signal',
            value:
              hotspot.category === 'UNAUTHORISED_REFUEL' ? 'Off-network refuels' : 'Fuel theft',
          },
          { label: 'Radius', value: radiusLabel(hotspot.radiusM) },
        ]}
      />
      <Where lat={hotspot.lat} lng={hotspot.lng} />
      {!own && (
        <Note>
          Seen across fleets on the network. It is shared without naming any fleet, so it cannot be
          edited here.
        </Note>
      )}
    </Frame>
  );
}
