export default function HeroMileageDriftTile() {
  return (
    <div
      data-swaptile
      style={{
        position: 'absolute',
        inset: '0',
        boxSizing: 'border-box',
        borderRadius: '16px',
        background: '#FFFFFF',
        border: '1px solid rgba(5,8,22,.07)',
        boxShadow: '0 12px 32px rgba(30,34,56,.13)',
        padding: '14px 15px 15px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: '0',
        willChange: 'opacity, transform',
        animation: 'hero-swap 24s cubic-bezier(.2,0,0,1) infinite -14s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '9px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#93939A',
            whiteSpace: 'nowrap',
            minWidth: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Mileage drift
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            color: '#B6B6BC',
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          −13 %
        </span>
      </div>
      <div
        style={{
          flex: '1',
          minHeight: '0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: '10px',
        }}
      >
        <svg
          viewBox="0 0 212 76"
          preserveAspectRatio="none"
          style={{
            width: '100%',
            height: '76px',
            display: 'block',
            overflow: 'visible',
          }}
        >
          <path d="M0 20 H212 M0 48 H212" stroke="rgba(5,8,22,.06)" strokeWidth="1" />
          <path
            d="M4 22 L44 27 L84 21 L124 38 L164 54 L208 62"
            fill="none"
            stroke="#4469F0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              '--d': '230',
              strokeDasharray: '230',
              animation: 'tile-draw 24s cubic-bezier(.2,0,0,1) infinite -14s',
            }}
          />
          <circle
            cx="208"
            cy="62"
            r="3.4"
            fill="#E5686B"
            style={{
              opacity: '0',
              transformOrigin: '208px 62px',
              animation: 'tile-pop 24s cubic-bezier(.2,0,0,1) infinite -11.6s',
            }}
          />
        </svg>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '8px',
            opacity: '0',
            animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -11.3333333333s',
          }}
        >
          <span style={{ fontSize: '10.5px', color: '#93939A' }}>billed 4.0 km/l</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--nova-rage-600)',
            }}
          >
            sensor 4.6
          </span>
        </div>
      </div>
    </div>
  );
}
