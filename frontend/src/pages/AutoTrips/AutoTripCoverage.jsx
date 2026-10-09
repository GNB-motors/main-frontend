import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getUserRole } from '../../utils/session.js';
import AutoTripService from '../../services/AutoTripService';
import { formatNum } from '../../utils/formatters';
import { COVERAGE_REASON_LABEL, placeHubHref } from './autoTripModel';
import './AutoTrips.css';

const CAN_SEE = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];
const REASON_ORDER = ['NO_CONFIRMED_PICKUP', 'NO_STOPS'];
const plural = (n, word) => `${formatNum(n)} ${word}${n === 1 ? '' : 's'}`;

/**
 * Trucks with no trips, and the places they stop at longest that are not confirmed
 * pickups yet. Confirming one of those places as a pickup is what gives them trips, so
 * each opens it in Place Hub. Owners and managers only (the API is).
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
    <div className="atx-scope atx-banner atx-banner--warn">
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
              <>
                <p className="atx-cov-note">Bar = trucks that stop there for long</p>
                <PlaceBars places={places} />
              </>
            ) : (
              <p style={{ margin: 0 }}>No long stops at a known place in the last 30 days.</p>
            )}
          </div>
          <div>
            <h4>Trucks without trips</h4>
            <ReasonGroups missing={data.missing || []} total={n} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlaceBars({ places }) {
  const max = Math.max(...places.map((p) => p.trucks || 0), 1);
  return (
    <ul className="atx-cov-bars">
      {places.map((p) => (
        <li key={p.orgSiteId} className="atx-cov-bar-row">
          <Link to={placeHubHref(p.orgSiteId)} className="atx-cov-bar-label">
            {p.name || 'Unconfirmed place'}
          </Link>
          <span className="atx-cov-track" aria-hidden="true">
            <span
              className="atx-cov-bar atx-cov--NO_CONFIRMED_PICKUP"
              style={{ width: `${((p.trucks || 0) / max) * 100}%` }}
            />
          </span>
          <span className="atx-cov-val">
            <strong>{plural(p.trucks, 'truck')}</strong> · {plural(p.stops, 'stop')}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ReasonGroups({ missing, total }) {
  const groups = REASON_ORDER.map((reason) => ({
    reason,
    trucks: missing.filter((m) => m.reason === reason),
  }))
    .concat(
      [...new Set(missing.map((m) => m.reason))]
        .filter((r) => !REASON_ORDER.includes(r))
        .map((reason) => ({ reason, trucks: missing.filter((m) => m.reason === reason) })),
    )
    .filter((g) => g.trucks.length);

  return (
    <div className="atx-cov-groups">
      {groups.map((g) => (
        <section key={g.reason} className="atx-cov-group">
          <div className="atx-cov-bar-row">
            <span className="atx-cov-bar-label">{COVERAGE_REASON_LABEL[g.reason] || g.reason}</span>
            <span className="atx-cov-track" aria-hidden="true">
              <span
                className={`atx-cov-bar atx-cov--${g.reason}`}
                style={{ width: `${(g.trucks.length / Math.max(total, 1)) * 100}%` }}
              />
            </span>
            <span className="atx-cov-val">
              <strong>{plural(g.trucks.length, 'truck')}</strong>
            </span>
          </div>
          <ul className="atx-cov-plates">
            {g.trucks.map((m) => (
              <li key={m.vehicleId} className="atx-plate">
                {m.registrationNumber}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
