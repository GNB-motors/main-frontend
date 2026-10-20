export default function HeroProofOfDeliveryTile() {
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
        animation: 'hero-swap 24s cubic-bezier(.2,0,0,1) infinite -16s',
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
          Proof of delivery
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
          signed 12:41
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
          viewBox="0 0 200 48"
          preserveAspectRatio="none"
          style={{
            width: '100%',
            height: '48px',
            display: 'block',
            overflow: 'visible',
          }}
        >
          <path
            d="M8 38 C24 8 34 42 48 26 C62 10 70 36 86 20 C102 4 112 32 130 22 C146 14 156 26 168 18 C178 12 186 20 194 14"
            fill="none"
            stroke="#050816"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{
              '--d': '330',
              strokeDasharray: '330',
              animation: 'tile-draw 24s cubic-bezier(.2,0,0,1) infinite -16s',
            }}
          />
        </svg>
        <div style={{ display: 'flex', gap: '7px' }}>
          <span
            style={{
              flex: '1',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: '#5D5D5E',
              padding: '6px 0',
              textAlign: 'center',
              borderRadius: '7px',
              background: '#F4F5FA',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -14s',
            }}
          >
            2 photos
          </span>
          <span
            style={{
              flex: '1',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: '#5D5D5E',
              padding: '6px 0',
              textAlign: 'center',
              borderRadius: '7px',
              background: '#F4F5FA',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -13.6533333333s',
            }}
          >
            GPS stamped
          </span>
        </div>
      </div>
    </div>
  );
}
