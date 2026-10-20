export default function HeroFleetLiveTile() {
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
        animation: 'hero-swap 24s cubic-bezier(.2,0,0,1) infinite 0s',
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
          Fleet live
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
          30 s refresh
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
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '7px',
            minWidth: '0',
            overflow: 'hidden',
            opacity: '0',
            animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite 0s',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '30px',
              letterSpacing: '-1.3px',
            }}
          >
            38
          </span>
          <span style={{ fontSize: '11px', color: '#93939A', whiteSpace: 'nowrap' }}>
            of 44 moving
          </span>
        </div>
        <svg
          viewBox="0 0 212 46"
          preserveAspectRatio="none"
          style={{
            width: '100%',
            height: '46px',
            display: 'block',
            overflow: 'visible',
          }}
        >
          <path
            d="M2 36 C32 31 48 19 76 20 C110 21 128 10 162 11 C186 12 198 7 210 6"
            fill="none"
            stroke="#4469F0"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              '--d': '232',
              strokeDasharray: '232',
              animation: 'tile-draw 24s cubic-bezier(.2,0,0,1) infinite 0s',
            }}
          />
          <circle
            cx="210"
            cy="6"
            r="3.4"
            fill="#4469F0"
            style={{
              opacity: '0',
              transformOrigin: '210px 6px',
              animation: 'tile-pop 24s cubic-bezier(.2,0,0,1) infinite 2.4s',
            }}
          />
        </svg>
      </div>
    </div>
  );
}
