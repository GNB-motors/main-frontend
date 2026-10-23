export default function AiSmartAlertCard() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(5,8,22,.06)',
        borderRadius: 'var(--radius-xl)',
        padding: '22px 22px 18px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '13px',
        transition: 'box-shadow 200ms cubic-bezier(.2,0,0,1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 12px',
            borderRadius: '999px',
            background: 'rgba(229,104,107,.12)',
            color: '#C4494C',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flex: '0 0 auto' }}
          >
            <path d="M12 4.5 21 19.5H3z" />
            <path d="M12 10v4M12 17h.01" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '10px',
              fontWeight: '500',
              letterSpacing: '.16em',
              textTransform: 'uppercase',
            }}
          >
            Smart alert
          </span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          07:04
        </span>
      </div>
      <div
        style={{
          fontSize: '17px',
          lineHeight: '26px',
          fontWeight: '500',
          letterSpacing: '-.2px',
          color: '#050816',
          textWrap: 'pretty',
        }}
      >
        Fuel variance crossed 8% on four vehicles this week
      </div>
      <div style={{ fontSize: '14px', lineHeight: '22px', color: '#5D5D5E', textWrap: 'pretty' }}>
        Bhiwandi depot · ₹18,400 estimated leakage against expected consumption.
      </div>
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '14px',
          borderTop: '1px solid rgba(5,8,22,.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--nova-rage-600)' }}>
          Open fuel audit →
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          conf 0.91
        </span>
      </div>
    </div>
  );
}
