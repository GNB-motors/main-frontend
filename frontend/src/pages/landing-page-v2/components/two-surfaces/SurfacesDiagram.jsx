export default function SurfacesDiagram() {
  return (
    <div
      data-reveal
      data-flow
      style={{
        width: '100%',
        maxWidth: '620px',
        marginLeft: 'auto',
        display: 'grid',
        gridTemplateColumns: '1fr 88px 96px',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.06)',
            borderRadius: '18px',
            boxShadow: 'var(--shadow-sm)',
            padding: '18px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                flex: '0 0 auto',
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'rgba(68,105,240,.09)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                <path d="M11 18.5h2" />
              </svg>
            </span>
            <div style={{ minWidth: '0' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  letterSpacing: '-.2px',
                  color: '#050816',
                }}
              >
                Mobile app
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-eyebrow)',
                  fontSize: '9.5px',
                  fontWeight: '500',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: 'var(--nova-rage-600)',
                  marginTop: '3px',
                }}
              >
                Driver · Owner
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                lineHeight: '14px',
                color: '#5D5D5E',
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#F3F3F6',
              }}
            >
              My vehicle
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                lineHeight: '14px',
                color: '#5D5D5E',
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#F3F3F6',
              }}
            >
              Trip details
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                lineHeight: '14px',
                color: '#5D5D5E',
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#F3F3F6',
              }}
            >
              Advance request
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                lineHeight: '14px',
                color: '#5D5D5E',
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#F3F3F6',
              }}
            >
              My earnings
            </span>
          </div>
        </div>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.06)',
            borderRadius: '18px',
            boxShadow: 'var(--shadow-sm)',
            padding: '18px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                flex: '0 0 auto',
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'rgba(68,105,240,.09)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2.5" y="4" width="19" height="13" rx="2" />
                <path d="M8 21h8" />
              </svg>
            </span>
            <div style={{ minWidth: '0' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  letterSpacing: '-.2px',
                  color: '#050816',
                }}
              >
                Web platform
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-eyebrow)',
                  fontSize: '9.5px',
                  fontWeight: '500',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: 'var(--nova-rage-600)',
                  marginTop: '3px',
                }}
              >
                Owner · Staff
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                lineHeight: '14px',
                color: '#5D5D5E',
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#F3F3F6',
              }}
            >
              Vehicles
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                lineHeight: '14px',
                color: '#5D5D5E',
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#F3F3F6',
              }}
            >
              Dispatch
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                lineHeight: '14px',
                color: '#5D5D5E',
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#F3F3F6',
              }}
            >
              Ledgers
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                lineHeight: '14px',
                color: '#5D5D5E',
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#F3F3F6',
              }}
            >
              GST and reports
            </span>
          </div>
        </div>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '176px', display: 'block' }}
      >
        <path
          d="M2 26 C42 26 60 50 98 50"
          fill="none"
          vectorEffect="non-scaling-stroke"
          stroke="#4469F0"
          strokeOpacity=".22"
          strokeWidth="1.25"
        />
        <path
          d="M2 74 C42 74 60 50 98 50"
          fill="none"
          vectorEffect="non-scaling-stroke"
          stroke="#6366F1"
          strokeOpacity=".22"
          strokeWidth="1.25"
        />
        <path
          d="M2 26 C42 26 60 50 98 50"
          fill="none"
          vectorEffect="non-scaling-stroke"
          stroke="#4469F0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="10 190"
          style={{ animation: 'gnb-flow 2.6s linear infinite 0s' }}
        />
        <path
          d="M2 74 C42 74 60 50 98 50"
          fill="none"
          vectorEffect="non-scaling-stroke"
          stroke="#6366F1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="10 190"
          style={{ animation: 'gnb-flow 2.6s linear infinite .9s' }}
        />
      </svg>
      <div style={{ position: 'relative', width: '96px', height: '96px', justifySelf: 'center' }}>
        <div
          style={{
            position: 'absolute',
            inset: '-26%',
            borderRadius: '999px',
            background: 'radial-gradient(circle, rgba(68,105,240,.34), transparent 66%)',
            animation: 'gnb-orb 3.6s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '0',
            borderRadius: '999px',
            background: 'linear-gradient(150deg, #4469F0 0%, #213EA7 100%)',
            boxShadow: '0 18px 46px rgba(68,105,240,.42)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '44%' }}
          >
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="3.6" r="1.8" />
            <circle cx="12" cy="20.4" r="1.8" />
            <circle cx="4.8" cy="7.8" r="1.8" />
            <circle cx="19.2" cy="7.8" r="1.8" />
            <circle cx="4.8" cy="16.2" r="1.8" />
            <circle cx="19.2" cy="16.2" r="1.8" />
            <path d="M12 5.4v3.6M12 15v3.6M6.4 8.7l3 1.8M14.6 13.5l3 1.8M6.4 15.3l3-1.8M14.6 10.5l3-1.8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
