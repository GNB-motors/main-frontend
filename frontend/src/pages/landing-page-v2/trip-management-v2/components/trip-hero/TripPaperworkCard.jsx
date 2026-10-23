export default function TripPaperworkCard() {
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
        Paperwork
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <span
          style={{
            flex: '0 0 auto',
            width: '20px',
            height: '20px',
            borderRadius: '999px',
            background: 'rgba(24,122,50,.12)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#187A32"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <span style={{ flex: '1', fontSize: '14px', fontWeight: '500', color: '#050816' }}>LR</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          08:10
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <span
          style={{
            flex: '0 0 auto',
            width: '20px',
            height: '20px',
            borderRadius: '999px',
            background: 'rgba(24,122,50,.12)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#187A32"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <span style={{ flex: '1', fontSize: '14px', fontWeight: '500', color: '#050816' }}>
          E-way bill
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          08:26
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <span
          style={{
            flex: '0 0 auto',
            width: '20px',
            height: '20px',
            borderRadius: '999px',
            border: '1.5px dashed rgba(5,8,22,.22)',
          }}
        />
        <span style={{ flex: '1', fontSize: '14px', fontWeight: '500', color: '#5D5D5E' }}>
          POD
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#C0C0C8' }}>
          pending
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <span
          style={{
            flex: '0 0 auto',
            width: '20px',
            height: '20px',
            borderRadius: '999px',
            border: '1.5px dashed rgba(5,8,22,.22)',
          }}
        />
        <span style={{ flex: '1', fontSize: '14px', fontWeight: '500', color: '#5D5D5E' }}>
          Invoice
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#C0C0C8' }}>
          pending
        </span>
      </div>
    </div>
  );
}
