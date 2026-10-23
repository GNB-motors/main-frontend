import { Truck } from 'lucide-react';
import { inr, num } from '../../../utils/formatMoney.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import { hoursLabel } from '../model/placeLabels.js';
import { IDLE_COLOR, idleTone } from '../placeHubStyle.js';
import Frame from './Frame.jsx';
import Stats from './Stats.jsx';
import Where from './Where.jsx';
import AddHere from './AddHere.jsx';

export default function IdleSpotDetail({ spot, canEdit, onClose, onAdd }) {
  const tone = idleTone(spot.excessShare);
  const center = { lat: spot.lat, lng: spot.lng };
  return (
    <Frame
      icon={<TypeTile Icon={Truck} color={IDLE_COLOR[tone]} size={40} />}
      eyebrow="Idle spot · last 7 days"
      title={spot.zoneNames[0] || 'Unnamed spot'}
      onClose={onClose}
    >
      <Stats
        items={[
          { label: 'Burned', value: inr(spot.rupees), tone: tone === 'excess' ? 'crit' : null },
          { label: 'Excess share', value: `${Math.round(spot.excessShare * 100)}%` },
          { label: 'Idle time', value: hoursLabel(spot.hours) },
          { label: 'Idles', value: num(spot.events) },
        ]}
      />
      <div className="ph-split" aria-label="Legit versus excess">
        <span style={{ width: `${(1 - spot.excessShare) * 100}%`, background: IDLE_COLOR.legit }} />
        <span style={{ width: `${spot.excessShare * 100}%`, background: IDLE_COLOR.excess }} />
      </div>
      <Where lat={spot.lat} lng={spot.lng} shape="About 250 m around this point" />
      <section className="ph-section">
        <h3>Trucks ({num(spot.trucks.length)})</h3>
        <div className="ph-truck-chips">
          {spot.trucks.slice(0, 30).map((r) => (
            <span key={r} className="ph-truck-chip">
              <Truck size={11} /> {r}
            </span>
          ))}
        </div>
      </section>
      {spot.excessShare > 0 && <AddHere canEdit={canEdit} onAdd={onAdd} center={center} name="" />}
    </Frame>
  );
}
