import React from 'react';
import { X, Home, AlertTriangle, MapPin, RefreshCw, ArrowRightLeft } from 'lucide-react';
import dayjs from 'dayjs';
import {
  CLOSE_KIND_LABEL,
  FLAG_LABEL,
  SOURCE_LABEL,
  durationHours,
  formatDuration,
  reconciliation,
} from './tourLogic.js';

const fmt = (d) => (d ? dayjs(d).format('DD MMM, HH:mm') : '—');

/**
 * One cycle in full: where it went, what it covered, and which ERP trips ran inside it.
 */
export default function VehicleTourDetail({ tour, busy, onClose, onRollup, onShiftHome }) {
  if (!tour) return null;

  const isOpen = tour.status === 'OPEN';
  const kind = tour.closeKind ? CLOSE_KIND_LABEL[tour.closeKind] : null;
  const recon = reconciliation(tour);
  const canShift = tour.closeKind === 'DIFFERENT_WAREHOUSE' && Boolean(tour.endWarehouseId);

  return (
    <div className="vtour-drawer-backdrop" role="dialog" aria-modal="true">
      <aside className="vtour-drawer">
        <header className="vtour-drawer-head">
          <div>
            <h2>{tour.registrationNumber}</h2>
            <p className="vtour-sub">
              {fmt(tour.startedAt)} → {isOpen ? 'still out' : fmt(tour.endedAt)}
            </p>
          </div>
          <button type="button" className="vtour-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="vtour-drawer-body">
          {/* Route: yard to yard */}
          <section className="vtour-route">
            <div className="vtour-node">
              <Home size={14} />
              <div>
                <strong>{tour.startWarehouse?.name || 'Start yard'}</strong>
                <span>{fmt(tour.startedAt)}</span>
              </div>
            </div>
            <div className="vtour-line">
              <span>{formatDuration(durationHours(tour.startedAt, tour.endedAt))}</span>
            </div>
            <div className={`vtour-node${isOpen ? ' is-open' : ''}`}>
              <MapPin size={14} />
              <div>
                <strong>
                  {isOpen ? 'Still out' : tour.endWarehouse?.name || 'Away from any warehouse'}
                </strong>
                <span>{isOpen ? 'no return yet' : fmt(tour.endedAt)}</span>
              </div>
            </div>
          </section>

          {kind ? <p className={`vtour-kind vtour-kind--${kind.tone}`}>{kind.text}</p> : null}

          {(tour.flags || []).length > 0 && (
            <ul className="vtour-flags">
              {tour.flags.map((f) => (
                <li key={f}>
                  <AlertTriangle size={12} /> {FLAG_LABEL[f] || f}
                </li>
              ))}
            </ul>
          )}

          {/* Distance. An open cycle has none on purpose — a half-finished
              warehouse-to-warehouse span is not a measurable number. */}
          <section className="vtour-stats">
            {isOpen ? (
              <p className="vtour-note">
                Distance is measured once the vehicle is back at a yard. A cycle still in progress
                is not counted in any total.
              </p>
            ) : (
              <>
                <div className="vtour-stat">
                  <span>Cycle distance</span>
                  <strong>{tour.distanceKm != null ? `${tour.distanceKm} km` : '—'}</strong>
                  <em>{SOURCE_LABEL[tour.distanceSource] || tour.distanceSource || '—'}</em>
                </div>
                <div className="vtour-stat">
                  <span>Side trips</span>
                  <strong>{tour.sideTripCount ?? 0}</strong>
                  <em>{tour.sideTripDistanceKm != null ? `${tour.sideTripDistanceKm} km` : '—'}</em>
                </div>
                {recon && (
                  <div className={`vtour-stat${recon.isClean ? '' : ' is-warn'}`}>
                    <span>Unattributed</span>
                    <strong>{recon.gap} km</strong>
                    <em>{recon.isClean ? 'reconciles' : 'belongs to no trip'}</em>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Side trips — the user's own trips that ran inside this cycle. */}
          <section>
            <h4>Side trips</h4>
            <ul className="vtour-side-list">
              {(tour.sideTrips || []).map((t) => (
                <li key={t._id}>
                  <div>
                    <strong>{t.tripNumber}</strong>
                    <span className="vtour-muted">
                      {t.fromLocation || '—'} → {t.toLocation || '—'}
                    </span>
                  </div>
                  <div className="vtour-side-right">
                    <span className="vtour-state">{t.state}</span>
                    <span className="vtour-muted">
                      {t.totalKm != null ? `${t.totalKm} km` : '—'}
                    </span>
                  </div>
                </li>
              ))}
              {!(tour.sideTrips || []).length && (
                <li className="vtour-empty-row">
                  No ERP trips recorded inside this cycle. The cycle is still measured — it is built
                  from GPS, not from trips.
                </li>
              )}
            </ul>
          </section>
        </div>

        <footer className="vtour-drawer-foot">
          {!isOpen && (
            <button type="button" className="vtour-btn" onClick={onRollup} disabled={busy}>
              <RefreshCw size={14} className={busy ? 'vtour-spin' : ''} /> Recompute
            </button>
          )}
          {canShift && (
            <button
              type="button"
              className="vtour-btn vtour-btn--primary"
              onClick={onShiftHome}
              disabled={busy}
              title="Every later cycle will measure from this yard instead"
            >
              <ArrowRightLeft size={14} /> Vehicle shifted here
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}
