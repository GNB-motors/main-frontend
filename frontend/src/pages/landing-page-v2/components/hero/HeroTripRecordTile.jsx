export default function HeroTripRecordTile() {
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
        animation: 'hero-swap 24s cubic-bezier(.2,0,0,1) infinite -8s',
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
          Trip record
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
          CN-40224
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '5px 0',
              borderBottom: '1px solid rgba(5,8,22,.055)',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -8s',
            }}
          >
            <span style={{ fontSize: '10.5px', color: '#5D5D5E' }}>Vehicle</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#050816',
              }}
            >
              GJ-05-KT-1180
            </span>
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '5px 0',
              borderBottom: '1px solid rgba(5,8,22,.055)',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -7.7066666667s',
            }}
          >
            <span style={{ fontSize: '10.5px', color: '#5D5D5E' }}>Driver</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#050816',
              }}
            >
              R. Sharma
            </span>
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '5px 0',
              borderBottom: '1px solid rgba(5,8,22,.055)',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -7.4133333333s',
            }}
          >
            <span style={{ fontSize: '10.5px', color: '#5D5D5E' }}>Distance</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#050816',
              }}
            >
              588 km
            </span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            opacity: '0',
            animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -6.9333333333s',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              fontWeight: '600',
              padding: '3px 9px',
              borderRadius: '999px',
              background: 'rgba(68,105,240,.12)',
              color: 'var(--nova-rage-600)',
              whiteSpace: 'nowrap',
            }}
          >
            in transit
          </span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: 'var(--font-mono)',
              fontSize: '9.5px',
              color: '#5D5D5E',
              whiteSpace: 'nowrap',
            }}
          >
            e-way{' '}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#187A32"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M20 6 9 17l-5-5"
                style={{
                  '--d': '24',
                  strokeDasharray: '24',
                  animation: 'tile-draw 24s cubic-bezier(.2,0,0,1) infinite -6.5333333333s',
                }}
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
