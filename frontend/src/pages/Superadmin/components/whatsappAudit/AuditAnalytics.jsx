import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import STAGE_LABELS from './stageLabels';
import { onActivateKey } from '../../../../utils/onActivateKey';
import { relativeTime } from './waAuditFormat';

const AuditAnalytics = ({ setPagination, setStageFilter, setStatusFilter, stats }) => (
  <section aria-label="Failure stages and error distribution" className="wa-audit-analytics">
    {/* Failure Stage Breakdown */}
    <div className="wa-panel">
      <div className="wa-panel__head">
        <h3>
          <ShieldAlert size={18} color="#dc2626" />
          Where Requests Fail (Error Stages)
        </h3>
        <span className="wa-panel__head-meta">
          {stats?.failureStages?.length || 0} failure categories detected
        </span>
      </div>

      <div className="wa-stage-list">
        {stats?.failureStages && stats.failureStages.length > 0 ? (
          stats.failureStages.map((s) => {
            const conf = STAGE_LABELS[s.stage] || {
              label: s.stage,
              color: '#dc2626',
              icon: AlertCircle,
            };
            const Icon = conf.icon;
            const filterByStage = () => {
              setStageFilter(s.stage);
              setStatusFilter('FAILED');
              setPagination((p) => ({ ...p, page: 1 }));
            };
            return (
              <div
                key={s.stage}
                className="wa-stage-item"
                role="button"
                tabIndex={0}
                aria-label={`Filter by ${conf.label}: ${s.count} (${s.pct}%)`}
                onClick={filterByStage}
                onKeyDown={onActivateKey(filterByStage)}
                title={`Click to filter by ${conf.label}`}
              >
                <div className="wa-stage-item__header">
                  <span className="wa-stage-item__name">
                    <Icon size={14} color={conf.color} />
                    {conf.label}
                  </span>
                  <span className="wa-stage-item__stat">
                    {s.count} ({s.pct}%)
                  </span>
                </div>
                <div className="wa-progress-track">
                  <div
                    className="wa-progress-fill"
                    style={{ width: `${Math.min(100, s.pct)}%`, background: conf.color }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="wa-empty-state">
            <CheckCircle2
              size={32}
              color="#16a34a"
              style={{ margin: '0 auto 8px', display: 'block' }}
            />
            No failures or error spikes recorded in this window. Chatbot is healthy!
          </div>
        )}
      </div>
    </div>

    {/* Top Errors Table */}
    <div className="wa-panel">
      <div className="wa-panel__head">
        <h3>
          <AlertTriangle size={18} color="#d97706" />
          Most Frequent Errors
        </h3>
        <span className="wa-panel__head-meta">Root cause diagnostics</span>
      </div>

      {stats?.topErrors && stats.topErrors.length > 0 ? (
        <table className="wa-errors-table">
          <thead>
            <tr>
              <th>Error Message</th>
              <th>Stage</th>
              <th>Occurrences</th>
              <th>Last Observed</th>
            </tr>
          </thead>
          <tbody>
            {stats.topErrors.map((e, idx) => (
              <tr key={idx}>
                <td>
                  <div className="wa-error-msg" title={e.message}>
                    {e.message}
                  </div>
                </td>
                <td>
                  <span className="wa-stage-tag">{STAGE_LABELS[e.stage]?.label || e.stage}</span>
                </td>
                <td style={{ fontWeight: 600 }}>{e.count}</td>
                <td style={{ fontSize: 11, color: 'var(--wa-text-muted)' }}>
                  {relativeTime(e.lastSeenAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="wa-empty-state">
          <CheckCircle2
            size={32}
            color="#16a34a"
            style={{ margin: '0 auto 8px', display: 'block' }}
          />
          No recurring error messages detected.
        </div>
      )}
    </div>
  </section>
);

export default AuditAnalytics;
