export default function TripCostingCard() {
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
        Costing
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <span style={{ fontSize: '14px', color: '#93939A' }}>Costed</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: '500',
            color: '#050816',
          }}
        >
          ₹42,600
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
        <span style={{ fontSize: '14px', color: '#93939A' }}>Actual so far</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: '500',
            color: '#050816',
          }}
        >
          ₹39,180
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
        <span style={{ fontSize: '14px', color: '#93939A' }}>Margin</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--nova-fern-700)',
          }}
        >
          +8%
        </span>
      </div>
    </div>
  );
}
