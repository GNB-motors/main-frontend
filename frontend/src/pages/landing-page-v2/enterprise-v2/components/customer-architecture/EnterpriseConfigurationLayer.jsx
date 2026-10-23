export default function EnterpriseConfigurationLayer() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(68,105,240,.18)',
        borderRadius: '20px',
        padding: '22px 24px 24px',
        boxShadow: 'var(--shadow-xs)',
        animation: 'ly-115 8s cubic-bezier(.2,0,0,1) infinite both',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '14px',
          flexWrap: 'wrap',
          marginBottom: '16px',
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
          }}
        >
          Layer 2 · Your configuration
        </div>
        <div style={{ fontSize: '13px', color: '#93939A', letterSpacing: '-.1px' }}>
          Defined with your team, not preset by us
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 15px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.06)',
            border: '1px solid rgba(68,105,240,.18)',
            animation: 'it-130 8s cubic-bezier(.2,0,0,1) infinite both',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              flex: '0 0 auto',
              animation: 'dot-pulse 2.4s ease-in-out 0.40s infinite',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              whiteSpace: 'nowrap',
            }}
          >
            Custom fields
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 15px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.06)',
            border: '1px solid rgba(68,105,240,.18)',
            animation: 'it-140 8s cubic-bezier(.2,0,0,1) infinite both',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              flex: '0 0 auto',
              animation: 'dot-pulse 2.4s ease-in-out 0.58s infinite',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              whiteSpace: 'nowrap',
            }}
          >
            Roles and permissions
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 15px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.06)',
            border: '1px solid rgba(68,105,240,.18)',
            animation: 'it-150 8s cubic-bezier(.2,0,0,1) infinite both',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              flex: '0 0 auto',
              animation: 'dot-pulse 2.4s ease-in-out 0.76s infinite',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              whiteSpace: 'nowrap',
            }}
          >
            Approval rules
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 15px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.06)',
            border: '1px solid rgba(68,105,240,.18)',
            animation: 'it-160 8s cubic-bezier(.2,0,0,1) infinite both',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              flex: '0 0 auto',
              animation: 'dot-pulse 2.4s ease-in-out 0.94s infinite',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              whiteSpace: 'nowrap',
            }}
          >
            Report builder
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 15px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.06)',
            border: '1px solid rgba(68,105,240,.18)',
            animation: 'it-170 8s cubic-bezier(.2,0,0,1) infinite both',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              flex: '0 0 auto',
              animation: 'dot-pulse 2.4s ease-in-out 1.12s infinite',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              whiteSpace: 'nowrap',
            }}
          >
            Rate and contract logic
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 15px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.06)',
            border: '1px solid rgba(68,105,240,.18)',
            animation: 'it-180 8s cubic-bezier(.2,0,0,1) infinite both',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              flex: '0 0 auto',
              animation: 'dot-pulse 2.4s ease-in-out 1.30s infinite',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              whiteSpace: 'nowrap',
            }}
          >
            API and webhooks
          </span>
        </div>
      </div>
    </div>
  );
}
