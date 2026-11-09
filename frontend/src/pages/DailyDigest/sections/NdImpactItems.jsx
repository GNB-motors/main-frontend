import { formatINR } from '../../../utils/formatters';
import ToneBadge from '@/components/redesign/ToneBadge';
import { PARTIAL_LABEL } from '../../../utils/measured';

export default function NdImpactItems({ rows, total }) {
  return rows.map((r) => {
    const Icon = r.icon;
    // null = "not measured" (no baseline yet), shown as "—" so it never reads as
    // a real ₹0. It contributes nothing to `total`, so its pct and bar stay 0.
    const notMeasured = r.v == null;
    const pct = total > 0 && r.v > 0 ? Math.round((r.v / total) * 100) : 0;
    return (
      <div key={r.key} className="nd-impact-item" style={{ '--c': r.c, '--tint': r.tint }}>
        <div className="nd-impact-item-header">
          <div className="nd-impact-item-meta">
            <span className="nd-impact-ico">
              <Icon size={13} />
            </span>
            <span className="nd-impact-item-name" title={r.tip || undefined}>
              {r.label}
            </span>
            {pct > 0 && <span className="nd-impact-pct-pill">{pct}%</span>}
            {r.coverage ? <span className="nd-impact-pct-pill">{r.coverage}</span> : null}
            {r.partial ? <ToneBadge tone="watch">{PARTIAL_LABEL}</ToneBadge> : null}
          </div>
          <span
            className={`nd-impact-item-amount ${notMeasured || r.v === 0 ? 'nd-zero' : ''}`}
            title={notMeasured ? 'Not measured — no baseline for this channel yet' : undefined}
          >
            {notMeasured ? '—' : formatINR(r.v)}
          </span>
        </div>
        <div className="nd-impact-bar-track">
          <span className="nd-impact-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  });
}
