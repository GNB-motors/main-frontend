export default function AiTrendCard() {
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
            background: 'rgba(68,105,240,.12)',
            color: '#2F58EE',
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
            <path d="M3.5 16.5 9 11l3.5 3.5L20.5 6.5" />
            <path d="M15.5 6.5h5v5" />
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
            Trend
          </span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          90 days
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
        Cost per km rose 4.6% on the western routes
      </div>
      <div style={{ fontSize: '14px', lineHeight: '22px', color: '#5D5D5E', textWrap: 'pretty' }}>
        Measured from closed trips, fuel fills and expenses. Bhiwandi and Nashik runs carry most of
        it.
      </div>
      <svg
        viewBox="0 0 200 44"
        style={{ width: '100%', height: '44px', display: 'block', marginTop: '2px' }}
      >
        <rect x="1" y="23.2" width="10" height="20.8" rx="2.5" fill="rgba(68,105,240,.62)" />
        <rect x="17.6" y="24.8" width="10" height="19.2" rx="2.5" fill="rgba(68,105,240,.62)" />
        <rect x="34.2" y="22" width="10" height="22" rx="2.5" fill="rgba(68,105,240,.62)" />
        <rect
          x="50.800000000000004"
          y="20"
          width="10"
          height="24"
          rx="2.5"
          fill="rgba(68,105,240,.62)"
        />
        <rect x="67.4" y="20.8" width="10" height="23.2" rx="2.5" fill="rgba(68,105,240,.62)" />
        <rect x="84" y="18.4" width="10" height="25.6" rx="2.5" fill="rgba(68,105,240,.62)" />
        <rect
          x="100.60000000000001"
          y="16.400000000000002"
          width="10"
          height="27.599999999999998"
          rx="2.5"
          fill="rgba(68,105,240,.62)"
        />
        <rect
          x="117.20000000000002"
          y="15.200000000000003"
          width="10"
          height="28.799999999999997"
          rx="2.5"
          fill="rgba(68,105,240,.62)"
        />
        <rect
          x="133.8"
          y="12.799999999999997"
          width="10"
          height="31.200000000000003"
          rx="2.5"
          fill="rgba(68,105,240,.62)"
        />
        <rect
          x="150.4"
          y="10.399999999999999"
          width="10"
          height="33.6"
          rx="2.5"
          fill="rgba(68,105,240,.62)"
        />
        <rect
          x="167"
          y="8.799999999999997"
          width="10"
          height="35.2"
          rx="2.5"
          fill="rgba(68,105,240,.62)"
        />
        <rect
          x="183.60000000000002"
          y="6.799999999999997"
          width="10"
          height="37.2"
          rx="2.5"
          fill="rgba(68,105,240,.62)"
        />
      </svg>
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
          See the breakdown →
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          from closed trips
        </span>
      </div>
    </div>
  );
}
