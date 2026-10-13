export default function ContractArchitectureHighlights() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        justifyContent: 'center',
        marginBottom: '56px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: '12px 18px',
          borderRadius: '12px',
          background: '#FFFFFF',
          border: '1px solid rgba(68,105,240,.22)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4469F0"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: '0 0 auto' }}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: '#050816',
            lineHeight: '15px',
          }}
        >
          SLA tracking
          <br />
          per contract
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: '12px 18px',
          borderRadius: '12px',
          background: '#FFFFFF',
          border: '1px solid rgba(68,105,240,.22)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4469F0"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: '0 0 auto' }}
        >
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: '#050816',
            lineHeight: '15px',
          }}
        >
          Client-facing
          <br />
          portal
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: '12px 18px',
          borderRadius: '12px',
          background: '#FFFFFF',
          border: '1px solid rgba(68,105,240,.22)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4469F0"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: '0 0 auto' }}
        >
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <path d="M8.5 18h5a4 4 0 0 0 4-4V8.5" />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: '#050816',
            lineHeight: '15px',
          }}
        >
          Dedicated and
          <br />
          market vehicles
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: '12px 18px',
          borderRadius: '12px',
          background: '#FFFFFF',
          border: '1px solid rgba(68,105,240,.22)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4469F0"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: '0 0 auto' }}
        >
          <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: '#050816',
            lineHeight: '15px',
          }}
        >
          Margin per
          <br />
          contract
        </span>
      </div>
    </div>
  );
}
