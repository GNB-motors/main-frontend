import { Truck, Flame, Droplets } from 'lucide-react';
import PlaceLabel from '../../../components/ui/PlaceLabel';
import { inr, num } from '../../../utils/formatMoney.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import { DRAIN_COLOR } from '../placeHubStyle.js';
import Frame from './Frame.jsx';
import Note from './Note.jsx';
import Stats from './Stats.jsx';
import Where from './Where.jsx';

export default function DrainDetail({ cell, disclaimer, canEdit, onClose, onAdd }) {
  return (
    <Frame
      icon={<TypeTile Icon={Droplets} color={DRAIN_COLOR} size={40} />}
      eyebrow="Fuel drain"
      title={<PlaceLabel lat={cell.lat} lng={cell.lng} showMap={false} />}
      onClose={onClose}
      footer={
        canEdit ? (
          <>
            <span className="ph-spacer" />
            <button
              type="button"
              className="ph-btn ph-btn--primary"
              onClick={() =>
                onAdd('HOTSPOT', { center: { lat: cell.lat, lng: cell.lng }, name: '' })
              }
            >
              <Flame size={14} /> Mark as hotspot
            </button>
          </>
        ) : null
      }
    >
      <Stats
        items={[
          { label: 'Est. loss', value: inr(cell.rupees), tone: 'warn' },
          { label: 'Fuel drops', value: num(cell.events) },
          { label: 'Litres', value: `${num(Math.round(cell.litres))} L` },
          { label: 'Trucks', value: num(cell.vehicles.length) },
        ]}
      />
      <Where lat={cell.lat} lng={cell.lng} shape="A grid cell, not an exact point" />
      {cell.vehicles.length > 0 && (
        <section className="ph-section">
          <h3>Trucks</h3>
          <div className="ph-truck-chips">
            {cell.vehicles.slice(0, 30).map((r) => (
              <span key={r} className="ph-truck-chip">
                <Truck size={11} /> {r}
              </span>
            ))}
          </div>
        </section>
      )}
      {disclaimer && <Note tone="warn">{disclaimer}</Note>}
    </Frame>
  );
}
