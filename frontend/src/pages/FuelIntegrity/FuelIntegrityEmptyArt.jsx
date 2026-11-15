/**
 * FuelIntegrityEmptyArt — the pictures an empty card shows instead of a bare
 * sentence, so a card with no rows still fills its space properly.
 *
 * Pure inline SVG (no assets, no deps). Gradients give the flat shapes a
 * little depth; every id is namespaced per component so two cards can sit on
 * one page without clashing gradient references.
 */

const SHADOW = ({ id }) => (
  <radialGradient id={id} cx="50%" cy="50%" r="50%">
    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.10" />
    <stop offset="70%" stopColor="#0f172a" stopOpacity="0.04" />
    <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
  </radialGradient>
);

const BODY = ({ id }) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#ffffff" />
    <stop offset="100%" stopColor="#e6ebf2" />
  </linearGradient>
);

const BLUE = ({ id }) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#3b82f6" />
    <stop offset="100%" stopColor="#1d4ed8" />
  </linearGradient>
);

/**
 * A fuel dispenser waiting for its first audited fill: body, display, hose
 * curled round to a nozzle, and one blue drop on its way down.
 */
export function PumpArt({ size = 132 }) {
  return (
    <svg
      width={size}
      height={(size * 104) / 132}
      viewBox="0 0 132 104"
      fill="none"
      aria-hidden="true"
      className="fi-empty-art-svg"
    >
      <defs>
        <SHADOW id="fi-pump-shadow" />
        <BODY id="fi-pump-body" />
        <BLUE id="fi-pump-blue" />
      </defs>

      {/* ground shadow */}
      <ellipse cx="62" cy="95" rx="46" ry="7" fill="url(#fi-pump-shadow)" />

      {/* pedestal + body */}
      <rect x="30" y="88" width="42" height="6" rx="2" fill="#cbd5e1" />
      <rect
        x="26"
        y="12"
        width="50"
        height="78"
        rx="8"
        fill="url(#fi-pump-body)"
        stroke="#cbd5e1"
      />
      {/* header band */}
      <path d="M26 20 a8 8 0 0 1 8 -8 h34 a8 8 0 0 1 8 8 v6 h-50 z" fill="url(#fi-pump-blue)" />
      {/* display */}
      <rect x="34" y="26" width="34" height="18" rx="3" fill="#eff6ff" stroke="#bfdbfe" />
      <rect x="39" y="31" width="16" height="3.5" rx="1.75" fill="#60a5fa" />
      <rect x="39" y="37.5" width="24" height="3.5" rx="1.75" fill="#dbeafe" />
      {/* keypad dots */}
      <circle cx="40" cy="54" r="2" fill="#cbd5e1" />
      <circle cx="50" cy="54" r="2" fill="#cbd5e1" />
      <circle cx="60" cy="54" r="2" fill="#cbd5e1" />
      <circle cx="40" cy="63" r="2" fill="#cbd5e1" />
      <circle cx="50" cy="63" r="2" fill="#cbd5e1" />
      <circle cx="60" cy="63" r="2" fill="#cbd5e1" />
      {/* base label */}
      <rect x="34" y="72" width="34" height="10" rx="2.5" fill="#f1f5f9" stroke="#e2e8f0" />

      {/* hose: out of the body, loop down, up to the nozzle */}
      <path
        d="M76 34 h10 a8 8 0 0 1 8 8 v22 a10 10 0 0 1 -10 10 h-6"
        stroke="#94a3b8"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* nozzle, drooping from the hose end */}
      <g transform="rotate(14 78 74)">
        <rect x="76" y="69" width="22" height="9" rx="3" fill="#475569" />
        <rect x="93" y="67.5" width="9" height="12" rx="2.5" fill="#334155" />
        <rect x="79" y="78" width="5" height="7" rx="2" fill="#64748b" />
      </g>

      {/* the drop */}
      <path
        d="M112 44 c3.2 4.2 5 7 5 9.6 a5 5 0 1 1 -10 0 c0 -2.6 1.8 -5.4 5 -9.6 z"
        fill="url(#fi-pump-blue)"
        opacity="0.9"
      />
    </svg>
  );
}

/**
 * A fuel gauge resting low — the advisory has nothing to estimate yet. Arc
 * track, blue fill up to a quarter, needle, and a drop at the hub.
 */
export function GaugeArt({ size = 132 }) {
  return (
    <svg
      width={size}
      height={(size * 104) / 132}
      viewBox="0 0 132 104"
      fill="none"
      aria-hidden="true"
      className="fi-empty-art-svg"
    >
      <defs>
        <SHADOW id="fi-gauge-shadow" />
        <BODY id="fi-gauge-face" />
        <BLUE id="fi-gauge-blue" />
        <linearGradient id="fi-gauge-track" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="66" cy="96" rx="46" ry="7" fill="url(#fi-gauge-shadow)" />

      {/* stand */}
      <rect x="60" y="82" width="12" height="9" rx="3" fill="#cbd5e1" />
      <rect x="48" y="90" width="36" height="5" rx="2.5" fill="#cbd5e1" />

      {/* face */}
      <path d="M28 78 a38 38 0 0 1 76 0 z" fill="url(#fi-gauge-face)" stroke="#cbd5e1" />
      {/* track arc */}
      <path
        d="M36 78 a30 30 0 0 1 60 0"
        stroke="url(#fi-gauge-track)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* fill arc: a quarter of the dial */}
      <path
        d="M36 78 a30 30 0 0 1 21 -28.6"
        stroke="url(#fi-gauge-blue)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* ticks */}
      <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
        <line x1="36" y1="78" x2="42" y2="78" />
        <line x1="41.5" y1="61.5" x2="46" y2="66" />
        <line x1="66" y1="48" x2="66" y2="54" />
        <line x1="90.5" y1="61.5" x2="86" y2="66" />
        <line x1="96" y1="78" x2="90" y2="78" />
      </g>
      {/* needle resting on the low side */}
      <line
        x1="66"
        y1="78"
        x2="46"
        y2="60"
        stroke="#334155"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="66" cy="78" r="6.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      {/* drop hub */}
      <path
        d="M66 70.5 c1.7 2.2 2.6 3.6 2.6 5 a2.6 2.6 0 1 1 -5.2 0 c0 -1.4 0.9 -2.8 2.6 -5 z"
        fill="url(#fi-gauge-blue)"
      />
    </svg>
  );
}
