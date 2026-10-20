export default function ContractModuleStack() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(68,105,240,.30)',
            borderRadius: '16px',
            padding: '18px 14px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'rgba(68,105,240,.10)',
              display: 'grid',
              placeItems: 'center',
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
            >
              <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '-.1px',
              textAlign: 'center',
              lineHeight: '17px',
            }}
          >
            Tracking
          </span>
        </div>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(68,105,240,.30)',
            borderRadius: '16px',
            padding: '18px 14px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'rgba(68,105,240,.10)',
              display: 'grid',
              placeItems: 'center',
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
            >
              <circle cx="6" cy="18" r="2.5" />
              <circle cx="18" cy="6" r="2.5" />
              <path d="M8.5 18h5a4 4 0 0 0 4-4V8.5" />
            </svg>
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '-.1px',
              textAlign: 'center',
              lineHeight: '17px',
            }}
          >
            Dispatch
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(68,105,240,.16)',
            borderRadius: '16px',
            padding: '18px 14px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'rgba(68,105,240,.10)',
              display: 'grid',
              placeItems: 'center',
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
            >
              <path d="M12 3l9 5-9 5-9-5 9-5z" />
              <path d="M3 13l9 5 9-5" opacity=".55" />
            </svg>
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '-.1px',
              textAlign: 'center',
              lineHeight: '17px',
            }}
          >
            ERP
          </span>
        </div>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(68,105,240,.16)',
            borderRadius: '16px',
            padding: '18px 14px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'rgba(68,105,240,.10)',
              display: 'grid',
              placeItems: 'center',
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
            >
              <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z" />
              <path d="M8 3v18" opacity=".55" />
            </svg>
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '-.1px',
              textAlign: 'center',
              lineHeight: '17px',
            }}
          >
            Ledgers
          </span>
        </div>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(68,105,240,.16)',
            borderRadius: '16px',
            padding: '18px 14px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'rgba(68,105,240,.10)',
              display: 'grid',
              placeItems: 'center',
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
            >
              <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
            </svg>
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '-.1px',
              textAlign: 'center',
              lineHeight: '17px',
            }}
          >
            Reporting
          </span>
        </div>
      </div>
    </div>
  );
}
