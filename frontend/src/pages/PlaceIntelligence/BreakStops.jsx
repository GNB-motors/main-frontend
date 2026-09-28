import { Coffee, Briefcase, Wrench, ArrowRight } from 'lucide-react';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { hoursLabel, minutesLabel } from './placeIntelligenceModel';

/** The manager's three answers (plan §4); each is evidence for that one stop. */
const ANSWERS = [
  { purpose: 'REST', label: 'Rest / meal', Icon: Coffee },
  { purpose: 'LOAD', label: 'Work', Icon: Briefcase },
  { purpose: 'SERVICE', label: 'Repair', Icon: Wrench },
];

/**
 * One place's unexplained stops, newest first, each answerable in one click —
 * or all at once when they were all the same thing.
 */
export default function BreakStops({ group, title, busy, onAnswer, onOpenPlace }) {
  return (
    <section className="pi-detail" aria-label={`Unexplained stops at ${title}`}>
      <header className="pi-detail-head">
        <div className="pi-detail-head-main">
          <h3>{title}</h3>
          <p>
            {hoursLabel(group.minutes)} lost over {group.stops.length} stop
            {group.stops.length === 1 ? '' : 's'} by {group.trucks.join(', ')} in the last 7 days
          </p>
          {group.siteId ? (
            <div className="pi-detail-links">
              <button type="button" className="pi-link" onClick={() => onOpenPlace(group.siteId)}>
                Say what this place is <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <div style={{ padding: '6px 16px 4px' }}>
        <ul className="pi-stops">
          {group.stops.map((s) => (
            <li key={s._id}>
              <span className="pi-plate">{s.registrationNumber}</span>
              <span className="pi-stop-when">{formatDateTimeIST(s.startAt)}</span>
              <span className="pi-stop-dur">{minutesLabel(s.dwellMinutes)}</span>
              <span className="pi-stop-actions">
                {ANSWERS.map((a) => (
                  <button
                    type="button"
                    key={a.purpose}
                    className="pi-mini"
                    disabled={busy}
                    onClick={() => onAnswer([s], a.purpose)}
                  >
                    <a.Icon size={12} aria-hidden="true" /> {a.label}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {group.stops.length > 1 ? (
        <div className="pi-answer">
          <p className="pi-answer-q">Were they all the same thing?</p>
          <div className="pi-answer-row">
            {ANSWERS.map((a) => (
              <button
                type="button"
                key={a.purpose}
                className="pshell-btn"
                disabled={busy}
                onClick={() => onAnswer(group.stops, a.purpose)}
              >
                <a.Icon size={14} aria-hidden="true" /> All {group.stops.length} were{' '}
                {a.label.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
