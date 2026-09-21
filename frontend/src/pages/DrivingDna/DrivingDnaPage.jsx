import { Activity } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { useApi } from '../../hooks/useApi';
import { DrivingDnaService } from './DrivingDnaService';
import { drivingDnaResponseSchema } from '../../schemas/drivingDna.schema';
import { formatInrCompact, formatNum } from '../../utils/formatters';

const CARD_BORDER = '1px solid color-mix(in srgb, var(--cluster-text) 16%, transparent)';

const GRADE_COLOR = {
  A: 'var(--ok)',
  B: '#65a30d',
  C: '#d97706',
  D: 'var(--critical)',
};

function GradePill({ grade, score }) {
  const color = GRADE_COLOR[grade] || 'var(--cluster-text-dim)';
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="ov-pill"
        style={{ color, border: `1px solid ${color}`, background: 'transparent' }}
      >
        {grade || '—'}
      </span>
      <span className="num font-semibold" style={{ color }}>
        {score != null ? formatNum(score) : '—'}
      </span>
    </span>
  );
}

function scoreCell(score) {
  return score != null ? formatNum(score) : '—';
}

export default function DrivingDnaPage() {
  const { data, loading, error } = useApi(
    (signal) =>
      DrivingDnaService.getProfiles({}, signal).then((d) => drivingDnaResponseSchema.parse(d)),
    [],
  );

  const profiles = data?.profiles ?? [];
  const avgScore = data?.summary?.avgScore;

  return (
    <div className="cluster-page">
      <PageShell
        title="Driving DNA"
        subtitle="A coarse per-vehicle behaviour score from excess idling, harsh speeding and over-revving."
      >
        <PanelErrorBoundary name="driving-dna">
          {loading && !data ? (
            <div className="text-dim p-6 text-sm">Loading driving-DNA profiles…</div>
          ) : error ? (
            <div className="p-6 text-sm" style={{ color: 'var(--critical)' }}>
              Could not load driving-DNA profiles. {error.detail || error.message || ''}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div
                className="ov-panel p-3 text-xs leading-relaxed"
                style={{
                  border: '1px dashed color-mix(in srgb, var(--cluster-text) 20%, transparent)',
                  color: 'var(--cluster-text-dim)',
                }}
              >
                Coarse score: gear, coasting and engine-load are not in the vehicle feed, so this
                blends idling and speeding (strong) with over-revving (thin). Per vehicle, not per
                driver.
              </div>

              <div className="ov-kpi" style={{ border: CARD_BORDER }}>
                <span className="ov-kpi-label">
                  <Activity size={13} />
                  Fleet average score
                </span>
                <span className="ov-kpi-value">{avgScore != null ? formatNum(avgScore) : '—'}</span>
                <span className="ov-kpi-sub">0–100, higher is better</span>
              </div>

              {profiles.length === 0 ? (
                <div className="text-dim p-4 text-sm">
                  No profiles yet — the sweep needs enough moving telemetry per vehicle.
                </div>
              ) : (
                <div className="ov-panel overflow-x-auto p-0" style={{ border: CARD_BORDER }}>
                  <table className="w-full text-sm" style={{ color: 'var(--cluster-text)' }}>
                    <thead>
                      <tr className="text-dim text-left text-xs uppercase tracking-wide">
                        <th className="p-3">Vehicle</th>
                        <th className="p-3">Score</th>
                        <th className="num p-3 text-right">Idle</th>
                        <th className="num p-3 text-right">Speeding</th>
                        <th className="num p-3 text-right">Over-rev</th>
                        <th className="num p-3 text-right">Excess idle ₹</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((p) => (
                        <tr
                          key={p._id || p.registrationNumber}
                          style={{ borderTop: '1px solid var(--hairline)' }}
                        >
                          <td className="p-3 font-semibold">{p.registrationNumber || 'Unknown'}</td>
                          <td className="p-3">
                            <GradePill grade={p.grade} score={p.drivingScore} />
                          </td>
                          <td className="num p-3 text-right">{scoreCell(p.idleScore)}</td>
                          <td className="num p-3 text-right">{scoreCell(p.speedingScore)}</td>
                          <td className="num p-3 text-right">{scoreCell(p.overRevScore)}</td>
                          <td className="num p-3 text-right">{formatInrCompact(p.idleRupees)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </PanelErrorBoundary>
      </PageShell>
    </div>
  );
}
