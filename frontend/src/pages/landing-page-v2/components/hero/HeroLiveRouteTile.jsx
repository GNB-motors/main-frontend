export default function HeroLiveRouteTile() {
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
        animation: 'hero-swap 24s cubic-bezier(.2,0,0,1) infinite -6s',
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
          Live route
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
          ETA 14:20
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
            flex: '1',
            minHeight: '0',
            borderRadius: '10px',
            background: '#F1F3FA',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox="0 0 212 110"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: '0', width: '100%', height: '100%' }}
          >
            <path
              d="M0 28 H212 M0 62 H212 M52 0 V110 M148 0 V110"
              stroke="rgba(5,8,22,.05)"
              strokeWidth="1"
            />
            <path
              d="M18 92 C58 78 52 50 96 42 C136 35 152 22 196 16"
              fill="none"
              stroke="#4469F0"
              strokeWidth="2.4"
              strokeLinecap="round"
              style={{
                '--d': '215',
                strokeDasharray: '215',
                animation: 'tile-draw 24s cubic-bezier(.2,0,0,1) infinite -6s',
              }}
            />
            <circle cx="18" cy="92" r="4" fill="#FFFFFF" stroke="#4469F0" strokeWidth="2.4" />
            <circle
              cx="96"
              cy="42"
              r="8"
              fill="rgba(68,105,240,.18)"
              style={{
                transformOrigin: '96px 42px',
                animation: 'tile-ping 2.4s cubic-bezier(.2,0,0,1) infinite',
              }}
            />
            <circle cx="96" cy="42" r="3.6" fill="#4469F0" />
            <circle
              cx="196"
              cy="16"
              r="4"
              fill="#4469F0"
              style={{
                opacity: '0',
                transformOrigin: '196px 16px',
                animation: 'tile-pop 24s cubic-bezier(.2,0,0,1) infinite -3.4666666667s',
              }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
