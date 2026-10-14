export default function TripAssignedCard() {
  return (
    <div
      style={{
        padding: '30px 32px 32px',
        borderLeft: '1px solid rgba(5,8,22,.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'tm-step 460ms cubic-bezier(.2,0,0,1) both',
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
        Assigned
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <span style={{ fontSize: '14px', color: '#93939A' }}>Vehicle</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: '500',
            color: '#050816',
          }}
        >
          MH-40-BX-2291
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <span style={{ fontSize: '14px', color: '#93939A' }}>Driver</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: '500',
            color: '#050816',
          }}
        >
          R. Kumar
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <span style={{ fontSize: '14px', color: '#93939A' }}>Load</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: '500',
            color: '#050816',
          }}
        >
          18.4 t
        </span>
      </div>
    </div>
  );
}
