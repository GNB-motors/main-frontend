import { MapPin, Check, Lock } from 'lucide-react';
import StatusBadge from '../../../components/Erp/StatusBadge';
import Facts from './Facts';
import { money, stamp } from './tripFormat';

const TripStages = ({
  suggestion,
  openDrawer,
  stages,
  statusOf,
  openStageId,
  setOpenStageId,
  summaryOf,
  data,
}) => (
  <div className="trip360-stages">
    {/* GPS saw the truck at the drop. Never closes the trip; a person does. */}
    {suggestion && (
      <div className="erp-callout info" style={{ marginBottom: 12 }}>
        <MapPin size={16} />
        <span style={{ flex: 1 }}>
          Truck reached <strong>{suggestion.placeName}</strong> at {stamp(suggestion.arrivedAt)}
          {suggestion.stillThere
            ? ` and has been there ${suggestion.stayedMin} min.`
            : `, stayed ${suggestion.stayedMin} min.`}{' '}
          Close the trip?
        </span>
        <button type="button" className="trip360-btn" onClick={() => openDrawer('close')}>
          Close trip
        </button>
      </div>
    )}
    {stages.map((stage, idx) => {
      const st = statusOf(stage, idx);
      const Icon = stage.icon;
      const blocked = st === 'blocked';
      // The current stage is always open. A finished one opens on click;
      // a locked one has nothing to open.
      const expanded = st === 'current' || openStageId === stage.id;
      const summary = summaryOf(stage);

      if (!expanded) {
        return (
          <section key={stage.id} className={`trip360-stage ${st} is-collapsed`}>
            <header
              className="trip360-stage-head"
              onClick={blocked ? undefined : () => setOpenStageId(stage.id)}
              role={blocked ? undefined : 'button'}
              tabIndex={blocked ? undefined : 0}
              onKeyDown={
                blocked
                  ? undefined
                  : (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenStageId(stage.id);
                      }
                    }
              }
            >
              <span className="trip360-stage-index">{idx + 1}</span>
              <span className="trip360-stage-icon">
                {st === 'done' ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
              </span>
              <h2 className="trip360-stage-title">{stage.label}</h2>
              {summary && !blocked && <span className="trip360-stage-summary">{summary}</span>}
              <div className="trip360-stage-status">
                {blocked ? (
                  <span className="trip360-blocked-note">
                    <Lock size={12} /> After {stage.blockedBy}
                  </span>
                ) : (
                  <StatusBadge status="COMPLETED" />
                )}
              </div>
            </header>
          </section>
        );
      }

      return (
        <section key={stage.id} className={`trip360-stage ${st}`}>
          <header className="trip360-stage-head">
            <span className="trip360-stage-index">{idx + 1}</span>
            <span className="trip360-stage-icon">
              {st === 'done' ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
            </span>
            <h2 className="trip360-stage-title">{stage.label}</h2>
            <div className="trip360-stage-status">
              {blocked ? (
                <span className="trip360-blocked-note">
                  <Lock size={12} /> After {stage.blockedBy}
                </span>
              ) : (
                <StatusBadge status={st === 'done' ? 'COMPLETED' : 'PENDING'} />
              )}
              {st !== 'current' && (
                <button
                  type="button"
                  className="trip360-btn ghost trip360-btn--xs"
                  onClick={() => setOpenStageId(null)}
                >
                  Hide
                </button>
              )}
            </div>
          </header>

          <div className="trip360-stage-body">
            {stage.render === 'advanceCn' ? (
              <>
                <div className="trip360-sub">
                  <p className="trip360-sub-title">Advances</p>
                  {stage.advances.length ? (
                    <ul className="trip360-rows">
                      {stage.advances.map((a) => (
                        <li key={a._id} className="trip360-row">
                          <span>{a.advanceType}</span>
                          <StatusBadge status={a.status} />
                          <span className="trip360-row-amount">{money(a.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="trip360-empty">No advances raised.</p>
                  )}
                  <div className="trip360-stage-actions">
                    <button className="trip360-btn secondary" onClick={() => openDrawer('advance')}>
                      {stage.advances.length ? 'Manage advances' : 'Raise advance'}
                    </button>
                  </div>
                </div>

                <div className="trip360-sub">
                  <p className="trip360-sub-title">Consignment note</p>
                  {data.consignment ? (
                    <Facts
                      items={[
                        { label: 'CN number', value: data.consignment.cnNumber },
                        {
                          label: 'Loaded qty',
                          value: `${data.consignment.loadedQty} ${
                            data.consignment.loadedQtyUnit || 'KL'
                          }`,
                        },
                      ]}
                    />
                  ) : stage.hasCn ? (
                    <Facts
                      items={[
                        { label: 'CN status', value: 'Updated' },
                        { label: 'Loaded qty', value: `${data.loadedQty} KL` },
                      ]}
                    />
                  ) : (
                    <p className="trip360-empty">No consignment note yet.</p>
                  )}
                  <div className="trip360-stage-actions">
                    <button
                      className={`trip360-btn ${stage.hasCn ? 'secondary' : 'primary'}`}
                      onClick={() => openDrawer('cn')}
                    >
                      {stage.hasCn ? 'Update CN' : 'Create CN'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {stage.facts ? (
                  <Facts items={stage.facts} />
                ) : (
                  <p className="trip360-empty">
                    {blocked ? `Available once ${stage.blockedBy} is done.` : 'Not recorded yet.'}
                  </p>
                )}

                {stage.action && (
                  <div className="trip360-stage-actions">
                    <button
                      className={`trip360-btn ${st === 'current' ? 'primary' : 'secondary'}`}
                      disabled={blocked}
                      onClick={() => openDrawer(stage.action.drawer)}
                    >
                      {stage.action.label}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      );
    })}
  </div>
);

export default TripStages;
