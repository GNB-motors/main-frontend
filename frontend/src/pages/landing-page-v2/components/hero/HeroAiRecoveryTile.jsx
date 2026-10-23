export default function HeroAiRecoveryTile() {
  return (
    <div
      data-swaptile
      style={{
        position: 'absolute',
        inset: '0',
        boxSizing: 'border-box',
        borderRadius: '16px',
        background: 'linear-gradient(150deg, #2F58EE 0%, #213EA7 100%)',
        border: '1px solid rgba(146,168,255,.4)',
        boxShadow: '0 12px 32px rgba(30,34,56,.13)',
        padding: '14px 15px 15px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: '0',
        willChange: 'opacity, transform',
        animation: 'hero-swap 24s cubic-bezier(.2,0,0,1) infinite -2s',
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
            color: 'rgba(255,255,255,.72)',
            whiteSpace: 'nowrap',
            minWidth: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          AI recovery
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            color: 'rgba(255,255,255,.5)',
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          this quarter
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
        <span
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,.18)',
            display: 'grid',
            placeItems: 'center',
            opacity: '0',
            animation: 'tile-pop 24s cubic-bezier(.2,0,0,1) infinite -2s',
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
          </svg>
        </span>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '28px',
              letterSpacing: '-1.1px',
              color: '#FFFFFF',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -1.52s',
            }}
          >
            ₹2.93L
          </div>
          <div
            style={{
              fontSize: '10.5px',
              lineHeight: '16px',
              color: 'rgba(255,255,255,.8)',
              marginTop: '5px',
              opacity: '0',
              animation: 'tile-rise 24s cubic-bezier(.2,0,0,1) infinite -1.1466666667s',
            }}
          >
            recoverable across 6 routes, found by AI
          </div>
        </div>
      </div>
    </div>
  );
}
