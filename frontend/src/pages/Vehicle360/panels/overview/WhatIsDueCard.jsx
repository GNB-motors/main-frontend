import { buildDueItems } from '../../vehicle360Logic';
import CardHead from './CardHead';

/** Every open obligation on the vehicle, worst first — the "Reminders" list. */
export default function WhatIsDueCard({ prediction, documents, health, onGoTab }) {
  const items = buildDueItems({ prediction, documents, health });
  const worst = items[0]?.tone;

  return (
    <section className={`v360-card ${worst === 'red' ? 'v360-card--alert' : ''}`.trim()}>
      <CardHead title="Reminders" />
      {items.length === 0 ? (
        <div className="v360-empty">
          <span className="v360-empty-title">Nothing outstanding</span>
          <span className="v360-empty-hint">
            No overdue service, no document gaps, and telemetry is current.
          </span>
        </div>
      ) : (
        <div className="v360-due">
          {items.map((d) => (
            <div key={d.id} className={`v360-due-item v360-due-item--${d.tone}`}>
              <span className="v360-due-dot" aria-hidden="true" />
              <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                <span className="v360-due-title">{d.title}</span>
                <span className="v360-due-detail">{d.detail}</span>
                <button
                  type="button"
                  className="v360-link v360-due-cta"
                  onClick={() => onGoTab(d.tab)}
                >
                  {d.cta} →
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
