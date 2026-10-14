import { ArrowUpRight } from 'lucide-react';

// The real tiles, with their icon and label already in place; only the value
// and its footnote come from a request.
export default function NdKpiStripSkeleton({ items = [] }) {
  const tiles = items.length ? items : [...Array(6)].map((_, i) => ({ id: `sk-${i}` }));
  return (
    <div className="nd-kpis">
      {tiles.map((k) => {
        const Icon = k.icon;
        return (
          <div key={k.id} className={`nd-kpi ${k.accent ? 'nd-kpi--accent' : ''}`.trim()}>
            <div className="nd-kpi-top">
              <span className="nd-kpi-label">
                {Icon ? <Icon size={15} /> : null}
                {k.label ? (
                  <span>{k.label}</span>
                ) : (
                  <span className="nd-sk" style={{ width: 84, height: 11 }} />
                )}
              </span>
              {k.to ? (
                <span className="nd-kpi-go">
                  <ArrowUpRight size={14} />
                </span>
              ) : null}
            </div>
            <div className="nd-kpi-val">
              <span className="nd-sk" style={{ width: '45%', height: 24, marginTop: 4 }} />
            </div>
            <div className="nd-kpi-foot">
              <span className="nd-sk" style={{ width: '75%', height: 10 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
