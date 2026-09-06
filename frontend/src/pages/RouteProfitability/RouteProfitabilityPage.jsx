import React from 'react';
import { Link } from 'react-router-dom';
import { Unplug } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import Leaderboard from '../../components/ui/Leaderboard';

/**
 * Route Profitability — ₹ margin per trip, ranked best AND worst.
 *
 * Kept in FMS per the owner's decision; the data coupling lands later:
 * revenue comes from ERP (bills/receivables) and cost from telematics
 * (fuel, AdBlue, tolls) + trip records. Until that coupling exists the
 * page says so plainly instead of rendering a fabricated leaderboard —
 * empty is a state, not a zero.
 */
const RouteProfitabilityPage = () => (
  <PageShell
    title="Route Profitability"
    subtitle="₹ margin per trip · ERP revenue + telematics cost"
  >
    <div className="rp-pending" role="status">
      <Unplug size={20} aria-hidden="true" />
      <div>
        <strong>Data coupling in progress</strong>
        <p>
          This leaderboard needs two sources joined: trip revenue from the ERP
          ledger and trip cost from telematics (fuel, AdBlue, tolls). The
          coupling is being built; neither source is shown half-guessed in the
          meantime — disagreeing sources will be displayed side by side with
          their provenance, never averaged, once live.
        </p>
        <p className="rp-pending-links">
          Until then: <Link to="/route-intelligence">Route Intelligence</Link> for
          corridor performance and <Link to="/fuel-spend">Fuel Spend</Link> for
          the cost side.
        </p>
      </div>
    </div>

    <Leaderboard
      title="Margin per trip"
      unit="currency"
      metricKey="margin"
      rows={[]}
      rowLabel={(r) => r.route}
      rowSub={(r) => `${r.trips} trips`}
    />
  </PageShell>
);

export default RouteProfitabilityPage;
