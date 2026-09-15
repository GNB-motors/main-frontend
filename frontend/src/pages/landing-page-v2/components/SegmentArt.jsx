/* On-brand illustrated fills for the "Built for every fleet" segment cards.
   Self-contained inline SVG (no external images). Light -> deep progression
   mirrors the growth story: single truck, warehouse, enterprise network. */

const fill = { width: '100%', height: '100%', display: 'block' };

function Owner() {
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style={fill} aria-label="Single owner-operator truck">
      <defs>
        <linearGradient id="sa-sky-o" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9F0FF" />
          <stop offset="1" stopColor="#F7FAFF" />
        </linearGradient>
        <linearGradient id="sa-truck-o" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5B7BF5" />
          <stop offset="1" stopColor="#3F5FE0" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#sa-sky-o)" />
      <circle cx="322" cy="86" r="48" fill="#FFFFFF" opacity=".65" />
      <circle cx="322" cy="86" r="30" fill="#DCE6FF" />
      <path d="M0 296 Q110 262 210 288 T400 282 V400 H0Z" fill="#E4EAFB" />
      <rect x="0" y="300" width="400" height="66" fill="#EFF2FB" />
      <line x1="0" y1="333" x2="400" y2="333" stroke="#C7D2F0" strokeWidth="3" strokeDasharray="22 16" strokeLinecap="round" />
      {/* route accent */}
      <path d="M20 250 C120 236 150 214 250 214" fill="none" stroke="#B9C8F5" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" />
      <circle cx="20" cy="250" r="4.5" fill="#4469F0" />
      {/* truck */}
      <g transform="translate(78 214)">
        <ellipse cx="112" cy="112" rx="120" ry="12" fill="#0B1030" opacity=".06" />
        <rect x="0" y="18" width="150" height="82" rx="9" fill="url(#sa-truck-o)" />
        <rect x="14" y="44" width="122" height="4" rx="2" fill="#FFFFFF" opacity=".55" />
        <path d="M150 44 h40 l30 30 v26 h-70 Z" fill="#2A4FD6" />
        <path d="M159 51 h27 l17 18 h-44 Z" fill="#C6D6FF" />
        <rect x="150" y="96" width="72" height="9" rx="3" fill="#213EA7" />
        <circle cx="46" cy="104" r="19" fill="#141A3C" />
        <circle cx="46" cy="104" r="8" fill="#7C97F7" />
        <circle cx="176" cy="104" r="19" fill="#141A3C" />
        <circle cx="176" cy="104" r="8" fill="#7C97F7" />
      </g>
    </svg>
  );
}

function Contract() {
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style={fill} aria-label="Contract fleet warehouse loading bay">
      <defs>
        <linearGradient id="sa-sky-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D7E2FF" />
          <stop offset="1" stopColor="#EEF3FF" />
        </linearGradient>
        <linearGradient id="sa-wall-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4E71F2" />
          <stop offset="1" stopColor="#3F5FE0" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#sa-sky-c)" />
      <circle cx="66" cy="70" r="34" fill="#FFFFFF" opacity=".5" />
      <rect x="0" y="300" width="400" height="100" fill="#DBE4FA" />
      <line x1="0" y1="326" x2="400" y2="326" stroke="#C3D0F0" strokeWidth="2.5" strokeDasharray="18 14" strokeLinecap="round" />
      {/* warehouse */}
      <g transform="translate(96 132)">
        <ellipse cx="150" cy="172" rx="180" ry="14" fill="#0B1030" opacity=".06" />
        <path d="M-6 44 L152 2 L310 44 V60 H-6 Z" fill="#2A4FD6" />
        <rect x="4" y="60" width="296" height="150" fill="url(#sa-wall-c)" />
        <rect x="16" y="74" width="272" height="18" rx="4" fill="#31509E" />
        {/* bay doors */}
        <rect x="26" y="104" width="72" height="106" rx="5" fill="#DCE6FF" />
        <rect x="118" y="104" width="72" height="106" rx="5" fill="#DCE6FF" />
        <rect x="210" y="104" width="72" height="106" rx="5" fill="#DCE6FF" />
        <g stroke="#B9C8F5" strokeWidth="2">
          <path d="M26 132h72M26 160h72M26 188h72" />
          <path d="M118 132h72M118 160h72M118 188h72" />
          <path d="M210 132h72M210 160h72M210 188h72" />
        </g>
      </g>
      {/* two docked trucks */}
      <g transform="translate(150 250)">
        <rect x="0" y="0" width="58" height="40" rx="5" fill="#7C97F7" />
        <path d="M58 12 h18 l14 14 v14 h-32 Z" fill="#5B7BF5" />
        <circle cx="18" cy="42" r="9" fill="#141A3C" />
        <circle cx="74" cy="42" r="9" fill="#141A3C" />
      </g>
      <g transform="translate(238 258)">
        <rect x="0" y="0" width="52" height="34" rx="5" fill="#9DB2F9" />
        <path d="M52 10 h16 l12 12 v12 h-28 Z" fill="#7C97F7" />
        <circle cx="16" cy="36" r="8" fill="#141A3C" />
        <circle cx="66" cy="36" r="8" fill="#141A3C" />
      </g>
    </svg>
  );
}

function Enterprise() {
  const nodes = [
    { x: 78, y: 96 }, { x: 320, y: 84 }, { x: 60, y: 250 },
    { x: 336, y: 244 }, { x: 150, y: 330 }, { x: 300, y: 336 },
  ];
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style={fill} aria-label="Enterprise multi-depot network">
      <defs>
        <linearGradient id="sa-bg-e" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2F58EE" />
          <stop offset="1" stopColor="#1C358F" />
        </linearGradient>
        <radialGradient id="sa-glow-e" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#9DB2FF" stopOpacity=".85" />
          <stop offset="1" stopColor="#9DB2FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="url(#sa-bg-e)" />
      {/* faint grid */}
      <g stroke="#FFFFFF" strokeOpacity=".07" strokeWidth="1">
        <path d="M100 0V400M200 0V400M300 0V400M0 100H400M0 200H400M0 300H400" />
      </g>
      {/* connections */}
      <g fill="none" stroke="#C6D6FF" strokeOpacity=".55" strokeWidth="2">
        {nodes.map((n, i) => (
          <path key={i} d={`M200 200 C ${(200 + n.x) / 2} ${(200 + n.y) / 2 - 24}, ${n.x} ${n.y + 30}, ${n.x} ${n.y}`} />
        ))}
      </g>
      {/* depot pins */}
      {nodes.map((n, i) => (
        <g key={i} transform={`translate(${n.x} ${n.y})`}>
          <circle r="16" fill="#FFFFFF" opacity=".14" />
          <circle r="8" fill="#EAF0FF" />
          <circle r="3.4" fill="#2F58EE" />
        </g>
      ))}
      {/* central hub */}
      <circle cx="200" cy="200" r="74" fill="url(#sa-glow-e)" />
      <rect x="166" y="166" width="68" height="68" rx="20" fill="#FFFFFF" />
      <text x="200" y="201" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display), 'DM Sans', sans-serif" fontSize="36" fontWeight="700" letterSpacing="-1.5" fill="#2F58EE">G</text>
    </svg>
  );
}

export default function SegmentArt({ variant }) {
  if (variant === 'owner') return <Owner />;
  if (variant === 'contract') return <Contract />;
  return <Enterprise />;
}
