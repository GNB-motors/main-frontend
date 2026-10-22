import { Link } from 'react-router-dom';
import ProviderMark from './ProviderMark.jsx';
import FleetVehicleChips from './FleetVehicleChips.jsx';
import { connectionBadge, planPhrases } from '../pages/Settings/ialertAccountsModel.js';
import {
  ialertAccountTitle,
  ialertFreshness,
  ialertRenewalNote,
  ialertVehiclesByAccount,
} from '../lib/fleetConnections';
import { timeAgo } from '../utils/formatters';

const CHIP_TONE = { ok: 'ok', warn: 'warn', crit: 'crit', grey: 'info' };

/**
 * The Ashok Leyland iALERT half of the Fleet connections panel. Data comes from
 * the panel (one fetch, refreshed by "Check again"); this only lays it out.
 * @param {{ rows: object[]|null, vehicles: object[], loading: boolean, failed: boolean,
 *           onNavigate: () => void }} props
 */
export default function FleetConnectionsIalert({ rows, vehicles, loading, failed, onNavigate }) {
  const list = rows || [];
  const regsByAccount = ialertVehiclesByAccount(list, vehicles);

  let body;
  if (!rows && loading) {
    body = <p className="fleet-section-note">Checking iALERT…</p>;
  } else if (!rows && failed) {
    body = <p className="fleet-section-note">Couldn&apos;t check iALERT right now. Press Check again in a moment.</p>;
  } else if (!list.length) {
    body = (
      <p className="fleet-section-empty">
        No iALERT account is connected yet. In the GNB Edge extension press <strong>Connect iALERT</strong> and
        sign in to iALERT; it connects by itself.
      </p>
    );
  } else {
    body = list.map((row) => {
      const badge = connectionBadge(row);
      const fresh = ialertFreshness(row);
      const plan = planPhrases(row.plan)[0];
      return (
        <article key={row.tokenDocId || row.accountId} className="fleet-account">
          <header className="fleet-account-head">
            <div className="min-w-0">
              <h4 className="fleet-account-name">{ialertAccountTitle(row)}</h4>
              <p className="fleet-account-sub">
                {row.vehicleCount ?? 0} {row.vehicleCount === 1 ? 'vehicle' : 'vehicles'}
                {' · '}
                <span className={`fleet-fresh fleet-fresh--${fresh.tone}`}>
                  {row.lastDataAt ? `data ${timeAgo(row.lastDataAt)}` : 'waiting for first data'}
                </span>
              </p>
            </div>
            <span className={`fleet-link-chip fleet-link-chip--${CHIP_TONE[badge.tone] || 'info'}`}>
              {badge.label}
            </span>
          </header>
          <p className="fleet-account-note">{ialertRenewalNote(row)}</p>
          {plan ? <p className={`fleet-account-note fleet-account-note--${plan.tone}`}>Plan: {plan.text}</p> : null}
          <FleetVehicleChips regs={regsByAccount.get(String(row.accountId)) || []} onNavigate={onNavigate} />
        </article>
      );
    });
  }

  return (
    <section className="fleet-section" aria-labelledby="fleet-section-ialert">
      <header className="fleet-section-head">
        <ProviderMark provider="ialert" />
        <h3 id="fleet-section-ialert">Ashok Leyland iALERT</h3>
        {list.length ? (
          <Link to="/ialert/vehicles" onClick={onNavigate} className="fleet-section-link">
            Live status →
          </Link>
        ) : null}
      </header>
      {body}
    </section>
  );
}
