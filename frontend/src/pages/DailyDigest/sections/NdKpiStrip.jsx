import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowUp, ArrowDown } from 'lucide-react';

// Smooth-scrolls to an in-page section instead of relying on react-router's
// hash Link, which only rewrites the URL and never actually scrolls on a
// client-side navigation (that's browser-native behaviour, not SPA routing).
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function NdKpiStrip({ items }) {
  return (
    <div className="nd-kpis">
      {items.map((k) => {
        const Icon = k.icon;
        const body = (
          <>
            <div className="nd-kpi-top">
              <span className="nd-kpi-label">
                <Icon size={15} />
                <span>{k.label}</span>
              </span>
              {k.to ? (
                <span className="nd-kpi-go">
                  <ArrowUpRight size={14} />
                </span>
              ) : null}
            </div>
            <div className="nd-kpi-val">
              {k.value}
              {k.unit ? <small> {k.unit}</small> : null}
            </div>
            <div className="nd-kpi-foot">
              {k.delta ? (
                <span className={`nd-delta nd-delta--${k.dir || 'flat'}`}>
                  {k.dir === 'up' ? (
                    <ArrowUp size={10} />
                  ) : k.dir === 'down' ? (
                    <ArrowDown size={10} />
                  ) : null}
                  {k.delta}
                </span>
              ) : null}
              <span>{k.note}</span>
            </div>
          </>
        );
        const className = `nd-kpi ${k.accent ? 'nd-kpi--accent' : ''}`.trim();
        // In-page anchors ("#nd-attn") scroll to the section instead of
        // routing — a hash-only <Link> would silently do nothing.
        if (k.to?.startsWith('#')) {
          return (
            <button
              key={k.id}
              type="button"
              className={className}
              onClick={() => scrollToSection(k.to.slice(1))}
            >
              {body}
            </button>
          );
        }
        return k.to ? (
          <Link key={k.id} to={k.to} className={className}>
            {body}
          </Link>
        ) : (
          <div key={k.id} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
