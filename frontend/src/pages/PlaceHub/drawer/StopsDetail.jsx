import { Truck, Clock, Coffee, Briefcase, Wrench, ArrowRight } from 'lucide-react';
import PlaceLabel from '../../../components/ui/PlaceLabel';
import { num } from '../../../utils/formatMoney.js';
import { formatInIST } from '../../../utils/dateUtils';
import { minutesLabel } from '../intelligence/model/unitLabels.js';
import { TypeTile } from '../PlaceHubPanels.jsx';
import { hoursLabel } from '../model/placeLabels.js';
import { STOP_COLOR } from '../placeHubStyle.js';
import Frame from './Frame.jsx';
import Stats from './Stats.jsx';
import Where from './Where.jsx';

/** The three answers a manager gives a stop; each is evidence for that one stop. */
const STOP_ANSWERS = [
  { purpose: 'REST', label: 'Rest / meal', Icon: Coffee },
  { purpose: 'LOAD', label: 'Work', Icon: Briefcase },
  { purpose: 'SERVICE', label: 'Repair', Icon: Wrench },
];

export default function StopsDetail({ group, site, canEdit, busy, onClose, onAnswer, onOpenSite }) {
  const many = group.stops.length > 1;
  return (
    <Frame
      icon={
        site ? (
          <TypeTile type={site.type} size={40} />
        ) : (
          <TypeTile Icon={Clock} color={STOP_COLOR} size={40} />
        )
      }
      eyebrow="Unexplained stops"
      title={site ? site.name : <PlaceLabel lat={group.lat} lng={group.lng} showMap={false} />}
      label={site ? site.name : 'Unexplained stops'}
      onClose={onClose}
    >
      <Stats
        items={[
          { label: 'Unexplained', value: hoursLabel(group.minutes / 60), tone: 'warn' },
          { label: 'Stops · 7 days', value: num(group.stops.length) },
        ]}
      />
      {group.siteId && canEdit && (
        <button type="button" className="ph-btn" onClick={() => onOpenSite(group.siteId)}>
          Say what this place is <ArrowRight size={14} />
        </button>
      )}

      <section className="ph-section">
        <h3>Each stop · newest first</h3>
        <ul className="ph-stops">
          {group.stops.map((st) => (
            <li key={st._id} className="ph-stop">
              <div className="ph-stop-line">
                <span className="ph-truck-chip">
                  <Truck size={11} /> {st.registrationNumber || 'Truck'}
                </span>
                <span className="ph-muted">{formatInIST(st.startAt, 'D MMM, h:mm a')}</span>
                <strong>{minutesLabel(st.dwellMinutes)}</strong>
              </div>
              {canEdit && (
                <div className="ph-btn-row">
                  {STOP_ANSWERS.map((a) => (
                    <button
                      key={a.purpose}
                      type="button"
                      className="ph-btn ph-btn--sm"
                      disabled={busy}
                      onClick={() => onAnswer([st], a.purpose)}
                    >
                      <a.Icon size={12} /> {a.label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {canEdit && many && (
        <section className="ph-section">
          <h3>Were they all the same thing?</h3>
          <div className="ph-btn-row">
            {STOP_ANSWERS.map((a) => (
              <button
                key={a.purpose}
                type="button"
                className="ph-btn ph-btn--sm"
                disabled={busy}
                onClick={() => onAnswer(group.stops, a.purpose)}
              >
                <a.Icon size={12} /> All {group.stops.length} were {a.label.toLowerCase()}
              </button>
            ))}
          </div>
        </section>
      )}

      <Where lat={group.lat} lng={group.lng} />
    </Frame>
  );
}
