import { formatKm, formatLitres } from '../../../utils/formatters';
import Leaderboard from '../../../components/ui/Leaderboard.jsx';

export default function NdLeaderboardCard({ leaderboard }) {
  const drivers = leaderboard?.drivers || [];
  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <h2>Driver fuel efficiency</h2>
        <span className="nd-sp" />
        <span className="nd-hint">Last computed window · km/L</span>
      </div>
      <Leaderboard
        title="Driver fuel efficiency (km/L)"
        unit="number"
        metricKey="kmPerL"
        rows={drivers}
        rowLabel={(r) => r.driverName || 'Unknown driver'}
        rowSub={(r) => `${formatKm(r.distanceKm)} · ${formatLitres(r.fuelUsedL)}`}
      />
    </div>
  );
}
