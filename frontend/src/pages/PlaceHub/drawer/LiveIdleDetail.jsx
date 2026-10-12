import { Truck } from 'lucide-react';
import { inr } from '../../../utils/formatMoney.js';
import { formatInIST } from '../../../utils/dateUtils';
import { TypeTile } from '../PlaceHubPanels.jsx';
import { durationLabel } from '../placeHubModel.js';
import { IDLE_COLOR } from '../placeHubStyle.js';
import Frame from './Frame.jsx';
import Stats from './Stats.jsx';
import Where from './Where.jsx';
import AddHere from './AddHere.jsx';

export default function LiveIdleDetail({ event, canEdit, onClose, onAdd }) {
  const excess = event.legitimacy === 'excess';
  const center = { lat: Number(event.lat), lng: Number(event.lng) };
  return (
    <Frame
      icon={
        <TypeTile Icon={Truck} color={excess ? IDLE_COLOR.excess : IDLE_COLOR.legit} size={40} />
      }
      eyebrow="Idling now"
      title={event.registrationNumber || 'Unknown truck'}
      onClose={onClose}
    >
      <Stats
        items={[
          { label: 'Idling for', value: durationLabel(event.durationMin) },
          { label: 'Burned so far', value: inr(event.rupees), tone: excess ? 'crit' : null },
          { label: 'Fuel', value: `${(Number(event.litres) || 0).toFixed(1)} L` },
          { label: 'Verdict', value: excess ? 'Excess' : 'Legit', tone: excess ? 'crit' : 'ok' },
        ]}
      />
      <Where
        lat={center.lat}
        lng={center.lng}
        shape={event.zoneName ? `Inside ${event.zoneName}` : 'Outside every warehouse and zone'}
      />
      <p className="ph-muted">Since {formatInIST(event.startAt, 'D MMM, h:mm a')}</p>
      {excess && <AddHere canEdit={canEdit} onAdd={onAdd} center={center} name="" />}
    </Frame>
  );
}
