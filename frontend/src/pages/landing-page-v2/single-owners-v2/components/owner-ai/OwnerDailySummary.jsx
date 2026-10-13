export default function OwnerDailySummary() {
  return (
    <div data-scroll-m>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '.85fr 54px 1fr 54px 1.05fr',
          alignItems: 'center',
          gap: '0',
          minWidth: '880px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              padding: '13px 15px',
              borderRadius: '12px',
              background: '#F4F5FA',
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
              <path d="M3 7h11v9H3z" />
              <path d="M14 10h4l3 3v3h-7z" />
              <circle cx="7" cy="18" r="1.6" />
              <circle cx="17" cy="18" r="1.6" />
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#5D5D5E' }}>
              MH-04-KL-2210 · Tata 1109
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              padding: '13px 15px',
              borderRadius: '12px',
              background: '#F4F5FA',
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
              <path d="M3 7h11v9H3z" />
              <path d="M14 10h4l3 3v3h-7z" />
              <circle cx="7" cy="18" r="1.6" />
              <circle cx="17" cy="18" r="1.6" />
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#5D5D5E' }}>
              MH-04-JN-8834 · Eicher 1110
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              padding: '13px 15px',
              borderRadius: '12px',
              background: '#F4F5FA',
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
              <path d="M3 7h11v9H3z" />
              <path d="M14 10h4l3 3v3h-7z" />
              <circle cx="7" cy="18" r="1.6" />
              <circle cx="17" cy="18" r="1.6" />
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#5D5D5E' }}>
              MH-46-C-8890 · Ashok Leyland
            </span>
          </div>
        </div>
        <svg
          viewBox="0 0 54 150"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '150px' }}
        >
          <path
            d="M2 25 C26 25 30 75 52 75"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 25 C26 25 30 75 52 75"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.4s linear infinite 0s' }}
          />
          <path
            d="M2 75 L52 75"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 75 L52 75"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.4s linear infinite 0.4s' }}
          />
          <path
            d="M2 125 C26 125 30 75 52 75"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 125 C26 125 30 75 52 75"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.4s linear infinite 0.8s' }}
          />
        </svg>
        <div
          style={{
            padding: '20px 20px 18px',
            borderRadius: '18px',
            background: 'rgba(68,105,240,.06)',
            border: '1px solid rgba(68,105,240,.2)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '9.5px',
              fontWeight: '500',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: 'var(--nova-rage-600)',
              marginBottom: '14px',
            }}
          >
            AI checks three things
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: '0 0 auto', marginTop: '2px' }}
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span style={{ fontSize: '13.5px', lineHeight: '20px', color: '#050816' }}>
                Is mileage falling on any vehicle
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: '0 0 auto', marginTop: '2px' }}
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span style={{ fontSize: '13.5px', lineHeight: '20px', color: '#050816' }}>
                Is any trip running below cost
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: '0 0 auto', marginTop: '2px' }}
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span style={{ fontSize: '13.5px', lineHeight: '20px', color: '#050816' }}>
                Is a document or service due
              </span>
            </div>
          </div>
        </div>
        <svg
          viewBox="0 0 54 150"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '150px' }}
        >
          <path
            d="M2 75 L52 75"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 75 L52 75"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.4s linear infinite 0.3s' }}
          />
        </svg>
        <div
          style={{
            borderRadius: '20px',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.08)',
            boxShadow: 'var(--shadow-md)',
            padding: '18px 18px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '600' }}>GNB Edge</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
              07:00
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px 14px 14px 4px',
                background: 'rgba(68,105,240,.08)',
                fontSize: '13px',
                lineHeight: '20px',
                color: '#050816',
                animation: 'ai-msg 520ms cubic-bezier(.2,0,0,1) both 0.60s',
              }}
            >
              Tata 1109 mileage down 12% this month.
            </div>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px 14px 14px 4px',
                background: 'rgba(68,105,240,.08)',
                fontSize: '13px',
                lineHeight: '20px',
                color: '#050816',
                animation: 'ai-msg 520ms cubic-bezier(.2,0,0,1) both 0.75s',
              }}
            >
              Two Solapur runs did not cover cost. Short by ₹2,400 each.
            </div>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px 14px 14px 4px',
                background: 'rgba(68,105,240,.08)',
                fontSize: '13px',
                lineHeight: '20px',
                color: '#050816',
                animation: 'ai-msg 520ms cubic-bezier(.2,0,0,1) both 0.90s',
              }}
            >
              Fitness certificate for MH-46-C-8890 expires in 9 days.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
