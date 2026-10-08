import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getUserRole } from '../../utils/session.js';
import AutoTripService from '../../services/AutoTripService';
import { formatNum } from '../../utils/formatters';
import { COVERAGE_REASON_LABEL } from './autoTripModel';

const CAN_SEE = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];

/**
 * Trucks with no trips, and the places they stop at longest that are not confirmed
 * pickups yet. Confirming one of those places as a pickup is what gives them trips, so
 * each links straight to it on the Places page. Owners and managers only (the API is).
 */
export default function AutoTripCoverage() {
  const canSee = CAN_SEE.includes(getUserRole());
  const [open, setOpen] = useState(false);
  const { data } = useApi(
    (signal) => (canSee ? AutoTripService.coverage({ signal }) : Promise.resolve(null)),
    [canSee],
  );

  if (!data?.trucksMissing) return null;
  const places = data.candidatePlaces || [];
  const n = data.trucksMissing;

  return (
    <div className="atx-banner atx-banner--warn">
      <div className="atx-banner-row">
        <div className="atx-banner-msg">
          <TriangleAlert size={18} strokeWidth={2} aria-hidden="true" />
          <p>
            <strong>
              {formatNum(n)} {n === 1 ? 'truck has' : 'trucks have'} no trips yet.
            </strong>{' '}
            Usually their loading plant hasn&apos;t been added as a pickup place.
          </p>
        </div>
        <button
          type="button"
          className="atx-link"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Hide these trucks' : 'See these trucks →'}
        </button>
      </div>

      {open ? (
        <div className="atx-banner-more atx-cols">
          <div>
            <h4>Places to confirm as a pickup</h4>
            {places.length ? (
              <ul>
                {places.map((p) => (
                  <li key={p.orgSiteId}>
                    <Link to={`/places?place=${p.orgSiteId}`}>{p.name || 'Unconfirmed place'}</Link>{' '}
                    — {p.trucks} truck{p.trucks === 1 ? '' : 's'}, {p.stops} long stops
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>No long stops at a known place in the last 30 days.</p>
            )}
          </div>
          <div>
            <h4>Trucks without trips</h4>
            <ul className="atx-scroll">
              {(data.missing || []).map((m) => (
                <li key={m.vehicleId}>
                  <span className="atx-plate">{m.registrationNumber}</span> —{' '}
                  {COVERAGE_REASON_LABEL[m.reason] || m.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
