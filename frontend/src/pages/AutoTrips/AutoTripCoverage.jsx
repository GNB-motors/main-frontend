import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import { getUserRole } from '../../utils/session.js';
import AutoTripService from '../../services/AutoTripService';
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

  return (
    <div
      style={{
        padding: '8px 12px',
        marginBottom: 12,
        borderRadius: 8,
        background: 'var(--muted, #f6f7f9)',
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TriangleAlert size={16} aria-hidden="true" />
        <span style={{ flex: 1 }}>
          {data.trucksMissing} trucks have no trips yet — usually their plant isn&apos;t a confirmed
          pickup place.
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {open ? 'Hide' : 'Show which'}
        </Button>
      </div>

      {open ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 10 }}>
          <div>
            <strong>Places to confirm as a pickup</strong>
            {places.length ? (
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {places.map((p) => (
                  <li key={p.orgSiteId}>
                    <Link to={`/places?place=${p.orgSiteId}`}>{p.name || 'Unconfirmed place'}</Link>{' '}
                    — {p.trucks} truck{p.trucks === 1 ? '' : 's'}, {p.stops} long stops
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: '6px 0 0' }}>
                No long stops at a known place in the last 30 days.
              </p>
            )}
          </div>
          <div>
            <strong>Trucks without trips</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, maxHeight: 220, overflowY: 'auto' }}>
              {(data.missing || []).map((m) => (
                <li key={m.vehicleId}>
                  {m.registrationNumber} — {COVERAGE_REASON_LABEL[m.reason] || m.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
