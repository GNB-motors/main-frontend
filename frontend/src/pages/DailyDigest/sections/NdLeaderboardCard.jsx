import Link from '@/components/redesign/FleetLink';
import Leaderboard from '../../../components/ui/Leaderboard.jsx';
import { cellNumber } from '../../Performance/performanceCells';

/*
 * The Performance page's first leaderboard, top rows only. Drivers are ranked
 * against what is expected for their duty, and a row without enough evidence is
 * never ranked (audit DD-05) — the old card ranked raw km/L from a source that
 * is empty on prod.
 */
export default function NdLeaderboardCard({ leaderboard }) {
  const board = (leaderboard?.boards || []).find((b) => (b.rows || []).length) || null;
  const rows = (board?.rows || [])
    .filter((r) => r.rank != null && cellNumber(r.score) != null)
    .slice(0, 5)
    .map((r) => ({ ...r, score: cellNumber(r.score) }));
  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <h2>{board?.label || 'Driver leaderboard'}</h2>
        <span className="nd-sp" />
        <Link className="nd-hint" to="/performance?tab=leaderboards">
          All leaderboards →
        </Link>
      </div>
      <Leaderboard
        title={board?.label || 'Driver leaderboard'}
        unit="number"
        metricKey="score"
        rows={rows}
        rowLabel={(r) => r.subjectName || r.subjectId || '—'}
        rowSub={(r) => `#${r.rank}`}
      />
    </div>
  );
}
