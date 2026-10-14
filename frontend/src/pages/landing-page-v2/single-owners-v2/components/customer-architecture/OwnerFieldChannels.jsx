export default function OwnerFieldChannels() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          background: 'rgba(68,105,240,.07)',
          borderRadius: '18px',
          padding: '18px 16px 16px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'var(--nova-rage-600)',
            marginBottom: '13px',
            paddingLeft: '2px',
          }}
        >
          Field channels
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '11px',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4469F0"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flex: '0 0 auto' }}
            >
              <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
              <path d="M11 18.5h2" />
            </svg>
            <span style={{ fontSize: '13px', fontWeight: '500', letterSpacing: '-.1px' }}>
              Driver app
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '11px',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4469F0"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flex: '0 0 auto' }}
            >
              <circle cx="12" cy="12" r="8.6" />
              <circle cx="12" cy="12" r="2.4" />
              <path d="M12 3.4v6.2" />
            </svg>
            <span style={{ fontSize: '13px', fontWeight: '500', letterSpacing: '-.1px' }}>
              GPS device
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '11px',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <svg
              width="17"
              height="17"
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
            <span style={{ fontSize: '13px', fontWeight: '500', letterSpacing: '-.1px' }}>
              Customer portal
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          background: 'rgba(68,105,240,.05)',
          borderRadius: '18px',
          padding: '18px 16px 16px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'var(--nova-rage-600)',
            marginBottom: '13px',
            paddingLeft: '2px',
          }}
        >
          Statutory filing
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '11px',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <svg
              width="17"
              height="17"
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
            <span style={{ fontSize: '13px', fontWeight: '500', letterSpacing: '-.1px' }}>
              GST portal
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '11px',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <svg
              width="17"
              height="17"
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
            <span style={{ fontSize: '13px', fontWeight: '500', letterSpacing: '-.1px' }}>
              E-way bill
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
