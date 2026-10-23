export default function HeroRosterTile() {
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
        animation: 'hero-swap 24s cubic-bezier(.2,0,0,1) infinite -10s',
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
          Roster today
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
          4 on duty
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
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -10s',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: '22px',
                height: '22px',
                borderRadius: '999px',
                background: 'rgba(68,105,240,.14)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '8.5px',
                fontWeight: '600',
                color: 'var(--nova-rage-600)',
              }}
            >
              RS
            </span>
            <span style={{ flex: '1', fontSize: '10.5px', fontWeight: '500' }}>Ravi S.</span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: '600',
                padding: '3px 7px',
                borderRadius: '999px',
                background: 'rgba(24,122,50,.10)',
                color: '#187A32',
                whiteSpace: 'nowrap',
              }}
            >
              free
            </span>
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -9.7333333333s',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: '22px',
                height: '22px',
                borderRadius: '999px',
                background: 'rgba(5,8,22,.06)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '8.5px',
                fontWeight: '600',
                color: '#5D5D5E',
              }}
            >
              AK
            </span>
            <span style={{ flex: '1', fontSize: '10.5px', fontWeight: '500' }}>Anil K.</span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: '600',
                padding: '3px 7px',
                borderRadius: '999px',
                background: 'rgba(229,104,107,.13)',
                color: '#C4494C',
                whiteSpace: 'nowrap',
              }}
            >
              docs expired
            </span>
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -9.4666666667s',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: '22px',
                height: '22px',
                borderRadius: '999px',
                background: 'rgba(5,8,22,.06)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '8.5px',
                fontWeight: '600',
                color: '#5D5D5E',
              }}
            >
              SP
            </span>
            <span style={{ flex: '1', fontSize: '10.5px', fontWeight: '500' }}>Suresh P.</span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: '600',
                padding: '3px 7px',
                borderRadius: '999px',
                background: 'rgba(68,105,240,.12)',
                color: 'var(--nova-rage-600)',
                whiteSpace: 'nowrap',
              }}
            >
              on trip
            </span>
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -9.2s',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: '22px',
                height: '22px',
                borderRadius: '999px',
                background: 'rgba(5,8,22,.06)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '8.5px',
                fontWeight: '600',
                color: '#5D5D5E',
              }}
            >
              MJ
            </span>
            <span style={{ flex: '1', fontSize: '10.5px', fontWeight: '500' }}>Mahesh J.</span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: '600',
                padding: '3px 7px',
                borderRadius: '999px',
                background: 'rgba(24,122,50,.10)',
                color: '#187A32',
                whiteSpace: 'nowrap',
              }}
            >
              free
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
