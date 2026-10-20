export default function EnterpriseArchitectureHighlights() {
  return (
    <div
      data-reveal
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
          <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
          <path d="M9.5 12l1.8 1.8 3.4-3.4" />
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
          Personalized
          <br />
          configuration
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
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 7h3M8 11h3M13 7h3M13 11h3M9 21v-5h6v5" />
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
          Every depot
          <br />
          every entity
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
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h3" />
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
          Multi-entity
          <br />
          and multi-GSTIN
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
          <rect x="4.5" y="10" width="15" height="10" rx="2" />
          <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
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
          SSO, audit
          <br />
          and residency
        </span>
      </div>
    </div>
  );
}
