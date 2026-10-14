export default function AiRecommendationCard() {
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
            background: 'rgba(24,122,50,.12)',
            color: '#187A32',
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
            <path d="M12 3l1.8 4.4L18.2 9.2 13.8 11 12 15.4 10.2 11 5.8 9.2l4.4-1.8z" />
            <path d="M15.6 17.6l1.7 1.7 3.2-3.3" />
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
            Recommendation
          </span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          today
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
        Move three Nagpur runs to the Pune vehicle pool
      </div>
      <div style={{ fontSize: '14px', lineHeight: '22px', color: '#5D5D5E', textWrap: 'pretty' }}>
        Projected +₹1.1L margin this quarter at current rate cards and utilisation.
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
          Model the change →
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          conf 0.79
        </span>
      </div>
    </div>
  );
}
