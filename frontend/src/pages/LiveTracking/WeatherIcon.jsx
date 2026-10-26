import { WX } from './weatherGlyph.js';

/**
 * Animated weather glyph, pure SVG + CSS (keyframes live in LiveTracking.css
 * under `.wx-icon`). One category → one composed scene: sun rays rotate, the
 * cloud drifts, rain/snow falls, the bolt flashes. `animated={false}` freezes
 * it (used in tight list contexts if ever needed).
 */

function Sun({ cx = 32, cy = 20, r = 9 }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const r1 = r + 4;
    const r2 = r + 9;
    return (
      <line
        key={i}
        className="wx-ray"
        x1={cx + Math.cos(a) * r1}
        y1={cy + Math.sin(a) * r1}
        x2={cx + Math.cos(a) * r2}
        y2={cy + Math.sin(a) * r2}
      />
    );
  });
  return (
    <g>
      <g className="wx-rays" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {rays}
      </g>
      <circle className="wx-sun" cx={cx} cy={cy} r={r} />
    </g>
  );
}

function Cloud({ dx = 0, dy = 0, scale = 1 }) {
  return (
    <g className="wx-cloud" style={{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }}>
      <circle cx="24" cy="30" r="11" />
      <circle cx="38" cy="27" r="9" />
      <circle cx="45" cy="33" r="8" />
      <rect x="16" y="30" width="34" height="12" rx="6" />
    </g>
  );
}

function Drops({ short = false }) {
  const ys = short ? [44, 46] : [43, 48];
  return (
    <g className="wx-drops">
      {[22, 32, 42].map((x, i) => (
        <line
          key={x}
          className="wx-drop"
          x1={x}
          y1={ys[0]}
          x2={x - 2}
          y2={ys[1]}
          style={{ animationDelay: `${i * 0.25}s` }}
        />
      ))}
    </g>
  );
}

function Flakes() {
  return (
    <g className="wx-flakes">
      {[22, 32, 42].map((x, i) => (
        <circle
          key={x}
          className="wx-flake"
          cx={x}
          cy="44"
          r="1.8"
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </g>
  );
}

function Bolt() {
  return <path className="wx-bolt" d="M32 40 l-5 8 h4 l-3 7 9 -11 h-4 l3 -4 z" />;
}

function FogLines() {
  return (
    <g className="wx-fog">
      {[38, 43, 48].map((y, i) => (
        <line
          key={y}
          className="wx-fogline"
          x1="16"
          y1={y}
          x2="48"
          y2={y}
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </g>
  );
}

export default function WeatherIcon({ category = WX.UNKNOWN, size = 36, animated = true }) {
  const scene = (() => {
    switch (category) {
      case WX.CLEAR:
        return <Sun cx={32} cy={26} r={11} />;
      case WX.PARTLY:
        return (
          <>
            <Sun cx={22} cy={18} r={7} />
            <Cloud dx={6} dy={4} scale={0.92} />
          </>
        );
      case WX.CLOUDY:
        return <Cloud />;
      case WX.FOG:
        return (
          <>
            <Cloud dy={-4} scale={0.92} />
            <FogLines />
          </>
        );
      case WX.DRIZZLE:
        return (
          <>
            <Cloud />
            <Drops short />
          </>
        );
      case WX.RAIN:
        return (
          <>
            <Cloud />
            <Drops />
          </>
        );
      case WX.SNOW:
        return (
          <>
            <Cloud />
            <Flakes />
          </>
        );
      case WX.THUNDER:
        return (
          <>
            <Cloud />
            <Bolt />
          </>
        );
      default:
        return <Cloud />;
    }
  })();

  return (
    <svg
      className={`wx-icon wx-icon--${category} ${animated ? 'wx-animated' : ''}`}
      width={size}
      height={size * 0.82}
      viewBox="0 0 64 52"
      role="img"
      aria-hidden="true"
    >
      {scene}
    </svg>
  );
}
