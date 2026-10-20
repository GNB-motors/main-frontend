export default function HeroFuelGapTile() {
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
        animation: 'hero-swap 24s cubic-bezier(.2,0,0,1) infinite -4s',
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
          Fuel gap
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
          audit raised
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '19px',
            }}
          >
            <span
              style={{
                flex: '1',
                height: '100%',
                borderRadius: '5px',
                background: 'rgba(68,105,240,.42)',
                transformOrigin: 'left',
                animation: 'tile-bar 24s cubic-bezier(.2,0,0,1) infinite -4s',
              }}
            />
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '19px',
              transformOrigin: 'left',
              animation: 'tile-bar 24s cubic-bezier(.2,0,0,1) infinite -3.5733333333s',
            }}
          >
            <span
              style={{
                flex: '0 0 84%',
                height: '100%',
                borderRadius: '5px',
                background: 'rgba(68,105,240,.20)',
              }}
            />
            <span
              style={{
                flex: '1',
                height: '100%',
                borderRadius: '5px',
                background:
                  'repeating-linear-gradient(135deg, rgba(229,104,107,.36) 0 4px, rgba(229,104,107,.12) 4px 8px)',
              }}
            />
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
            minWidth: '0',
            overflow: 'hidden',
            opacity: '0',
            animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -2.88s',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '24px',
              letterSpacing: '-.9px',
              color: '#C4494C',
              whiteSpace: 'nowrap',
            }}
          >
            25.6 L
          </span>
          <span
            style={{
              fontSize: '10.5px',
              color: '#93939A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            unaccounted
          </span>
        </div>
      </div>
    </div>
  );
}
