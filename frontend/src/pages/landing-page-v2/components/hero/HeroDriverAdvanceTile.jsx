export default function HeroDriverAdvanceTile() {
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
        animation: 'hero-swap 24s cubic-bezier(.2,0,0,1) infinite -22s',
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
          Driver advance
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
          settled 09:20
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
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -22s',
            }}
          >
            <span style={{ fontSize: '10.5px', color: '#5D5D5E' }}>Issued</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#050816',
              }}
            >
              ₹8,000
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
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -21.7066666667s',
            }}
          >
            <span style={{ fontSize: '10.5px', color: '#5D5D5E' }}>Spent on trip</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#050816',
              }}
            >
              ₹6,350
            </span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '8px',
            paddingTop: '9px',
            borderTop: '1px solid rgba(5,8,22,.09)',
            opacity: '0',
            animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -21.2s',
          }}
        >
          <span style={{ fontSize: '10.5px', fontWeight: '600' }}>Returned</span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '19px',
              letterSpacing: '-.7px',
              color: '#187A32',
            }}
          >
            ₹1,650
          </span>
        </div>
      </div>
    </div>
  );
}
