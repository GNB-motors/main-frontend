export default function TripConsignmentCard() {
  return (
    <div
      style={{
        padding: '30px 32px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'tm-step 460ms cubic-bezier(.2,0,0,1) both .35s',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-eyebrow)',
          fontSize: '10px',
          fontWeight: '500',
          letterSpacing: '.24em',
          textTransform: 'uppercase',
          color: '#93939A',
        }}
      >
        Consignment
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          GNB/2026/04817
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '26px',
            letterSpacing: '-1px',
            color: '#050816',
            marginTop: '8px',
          }}
        >
          Mumbai → Nagpur
        </div>
      </div>
      <div style={{ position: 'relative', padding: '2px 0' }}>
        <svg
          viewBox="0 0 300 8"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: '8px' }}
        >
          <path d="M4 4 H296" stroke="rgba(68,105,240,.16)" strokeWidth="4" strokeLinecap="round" />
          <path
            d="M4 4 H296"
            stroke="#4469F0"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="300"
            style={{ animation: 'tm-track 1.5s cubic-bezier(.2,0,0,1) both .35s' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: '68%',
            top: '-2px',
            width: '16px',
            height: '16px',
            marginLeft: '-8px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.34)',
            animation: 'tm-pulse 2.4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '68%',
            top: '2px',
            width: '8px',
            height: '8px',
            marginLeft: '-4px',
            borderRadius: '999px',
            background: '#2F58EE',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: '600',
            padding: '5px 11px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.10)',
            color: 'var(--nova-rage-600)',
          }}
        >
          In transit · 68%
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          ETA 17:40
        </span>
      </div>
    </div>
  );
}
