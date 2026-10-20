export default function MapCanvas() {
  return (
    <div style={{ position: 'relative', background: '#F7F8FC', minWidth: '0' }}>
      <iframe
        src="/landing-v2/fleet-map-live.html"
        title="Live fleet map across India"
        style={{
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
          border: '0',
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,.94)',
          border: '1px solid rgba(5,8,22,.07)',
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '9px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#93939A',
            marginBottom: '10px',
          }}
        >
          Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '999px',
                background: '#4469F0',
              }}
            />
            <span style={{ fontSize: '11.5px', color: '#050816' }}>Moving</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '999px',
                background: '#E5686B',
              }}
            />
            <span style={{ fontSize: '11.5px', color: '#050816' }}>Halted</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '999px',
                background: '#F9A061',
              }}
            />
            <span style={{ fontSize: '11.5px', color: '#050816' }}>Idle</span>
          </span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <span
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,.94)',
            border: '1px solid rgba(5,8,22,.08)',
            boxShadow: 'var(--shadow-xs)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '16px',
            color: '#5D5D5E',
          }}
        >
          +
        </span>
        <span
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,.94)',
            border: '1px solid rgba(5,8,22,.08)',
            boxShadow: 'var(--shadow-xs)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '16px',
            color: '#5D5D5E',
          }}
        >
          −
        </span>
        <span
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,.94)',
            border: '1px solid rgba(5,8,22,.08)',
            boxShadow: 'var(--shadow-xs)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5D5D5E"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="7.5" />
            <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
          </svg>
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '16px',
          bottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '10px 14px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,.94)',
          border: '1px solid rgba(68,105,240,.22)',
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4469F0"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: '0 0 auto' }}
        >
          <circle cx="12" cy="12" r="8.5" strokeDasharray="3 4" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#050816',
            whiteSpace: 'nowrap',
          }}
        >
          Geofence · Bhiwandi ICD
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: '16px',
          bottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '10px 14px',
          borderRadius: '12px',
          background: 'rgba(46,20,26,.86)',
          border: '1px solid rgba(229,104,107,.34)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '999px',
            background: '#E5686B',
            animation: 'fm-blink 1.8s ease-in-out infinite',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'rgba(255,255,255,.9)',
            whiteSpace: 'nowrap',
          }}
        >
          MP-09-HT-2214 · halt 47 min
        </span>
      </div>
    </div>
  );
}
