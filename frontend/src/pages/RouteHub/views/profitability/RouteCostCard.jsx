import { Skel } from '../../routeHubShared.jsx';
import { inr } from '../../routeHubFormat';
import { SLICE } from './profitabilityScale.js';

export default function RouteCostCard({ selected, slices, costTotal, target, data, first }) {
  return (
    <div className="card s5">
      {selected ? (
        <>
          <div className="card-head">
            <h3>Cost per trip</h3>
            <span className="sp" />
            <span className="mono strong">{inr(selected.avgCostInr || 0)}</span>
          </div>
          <div className="stackbar">
            {slices.map((s) => (
              <span
                key={s.key}
                title={SLICE[s.key]?.label || s.key}
                style={{
                  width: `${((s.amountInr || 0) / costTotal) * 100}%`,
                  background: SLICE[s.key]?.color || '#9A9AA5',
                }}
              />
            ))}
          </div>
          <div className="costlist">
            {slices.map((s) => (
              <div className="r" key={s.key}>
                <i style={{ background: SLICE[s.key]?.color || '#9A9AA5' }} />
                <span>
                  {SLICE[s.key]?.label || s.key}
                  {s.assumed ? (
                    <span
                      className="hint"
                      style={{ marginLeft: 6, fontSize: 10 }}
                      title="Not measured — derived from a configured per-trip assumption"
                    >
                      assumed
                    </span>
                  ) : null}
                </span>
                <span className="sp" />
                <b>{inr(s.amountInr || 0)}</b>
                <span className="pc">{(((s.amountInr || 0) / costTotal) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <div className="perkm">
            <div>
              <div className="k">Revenue / km</div>
              <div className="v">₹{Math.round(selected.revenuePerKm ?? 0)}</div>
            </div>
            <div>
              <div className="k">Cost / km</div>
              <div className="v">₹{Math.round(selected.costPerKm ?? 0)}</div>
            </div>
            <div>
              <div className="k">Margin / km</div>
              <div className="v" style={{ color: selected.health.c }}>
                ₹{Math.round((selected.revenuePerKm ?? 0) - (selected.costPerKm ?? 0))}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: '14px 16px',
              fontSize: 'var(--type-2xs)',
              color: 'var(--fg-secondary)',
              lineHeight: '19px',
            }}
          >
            {(selected.marginPct ?? 0) >= target ? (
              <>
                Beating the {target}% target by{' '}
                <b style={{ color: 'var(--fg-primary)' }}>
                  {((selected.marginPct ?? 0) - target).toFixed(1)} pts
                </b>
                . Running cost could rise to{' '}
                {inr((selected.avgRevenueInr || 0) * (1 - target / 100))} per trip before it misses
                target.
              </>
            ) : (
              <>
                To reach {target}%, cut running cost by{' '}
                <b style={{ color: '#C2323A' }}>
                  {inr(
                    (selected.avgCostInr || 0) - (selected.avgRevenueInr || 0) * (1 - target / 100),
                  )}
                </b>{' '}
                per trip or raise the rate to{' '}
                <b style={{ color: 'var(--fg-primary)' }}>
                  {inr((selected.avgCostInr || 0) / (1 - target / 100))}
                </b>
                .
              </>
            )}
          </div>
          {data?.disclaimer ? (
            <div
              style={{
                padding: '0 16px 14px',
                fontSize: 11,
                color: 'var(--fg-tertiary)',
                lineHeight: '17px',
              }}
            >
              {data.disclaimer}
            </div>
          ) : null}
        </>
      ) : first ? (
        <div aria-busy="true">
          <div className="card-head">
            <Skel w={120} h={16} />
            <span className="sp" />
            <Skel w={70} h={14} />
          </div>
          <div style={{ display: 'grid', gap: 12, padding: '4px 16px 18px' }}>
            <Skel h={10} r={999} />
            {['72%', '58%', '66%', '44%', '52%'].map((w) => (
              <Skel key={w} w={w} h={12} />
            ))}
          </div>
        </div>
      ) : (
        <div className="empty">
          <b>No route selected</b>
          <span>Pick a route from the benchmark table.</span>
        </div>
      )}
    </div>
  );
}
