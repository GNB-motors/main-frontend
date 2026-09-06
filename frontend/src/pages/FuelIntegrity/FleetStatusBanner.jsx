import { AlertTriangle, ShieldAlert, ShieldCheck, ChevronRight } from 'lucide-react';

const BANNER_ICONS = { ok: ShieldCheck, warn: ShieldAlert, crit: AlertTriangle };
const BANNER_COLORS = { ok: 'var(--ok)', warn: 'var(--caution)', crit: 'var(--critical)' };

export default function FleetStatusBanner({ banner, defCount, onReviewDef }) {
  const Icon = BANNER_ICONS[banner.state];
  const color = BANNER_COLORS[banner.state];
  return (
    <div className={`fi-banner fi-banner--${banner.state}`}>
      <span
        className="fi-banner-icon"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="fi-banner-title">{banner.title}</div>
        <p className="text-dim mt-0.5 text-sm">
          {banner.msg}
          {defCount > 0 && (
            <span>
              {' '}
              ·{' '}
              <span style={{ color: 'var(--caution)', fontWeight: 600 }}>
                {defCount} DEF-related anomalies require review.
              </span>
            </span>
          )}
        </p>
      </div>
      {defCount > 0 && (
        <button className="ov-btn shrink-0" onClick={onReviewDef}>
          Review DEF flags <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}
