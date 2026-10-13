export default function ContactChannels() {
  return (
    <div data-reveal-group style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div
        style={{
          background: '#F4F5FA',
          borderRadius: 'var(--radius-xl)',
          padding: '26px 26px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
              <path d="M3 6.5 12 13l9-6.5" />
              <rect x="3" y="5" width="18" height="14" rx="2" />
            </svg>
          </span>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
              fontSize: '19px',
              letterSpacing: '-.4px',
            }}
          >
            Sales
          </div>
        </div>
        <div style={{ fontSize: '15px', lineHeight: '24px', color: '#5D5D5E' }}>
          New deployments, pricing and demos.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
          <a
            href="mailto:gnbmotors60@gmail.com"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
          >
            gnbmotors60@gmail.com
          </a>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#5D5D5E' }}>
            +91 00000 00000
          </span>
        </div>
      </div>
      <div
        style={{
          background: '#F4F5FA',
          borderRadius: 'var(--radius-xl)',
          padding: '26px 26px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
              <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
              <path d="M9.5 12l1.8 1.8 3.4-3.4" />
            </svg>
          </span>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
              fontSize: '19px',
              letterSpacing: '-.4px',
            }}
          >
            Support
          </div>
        </div>
        <div style={{ fontSize: '15px', lineHeight: '24px', color: '#5D5D5E' }}>
          For fleets already live on GNB Edge.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
          <a
            href="mailto:gnbmotors60@gmail.com"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
          >
            gnbmotors60@gmail.com
          </a>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#5D5D5E' }}>
            Mon–Sat · 08:00–21:00
          </span>
        </div>
      </div>
      <div
        style={{
          background: '#F4F5FA',
          borderRadius: 'var(--radius-xl)',
          padding: '26px 26px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
              fontSize: '19px',
              letterSpacing: '-.4px',
            }}
          >
            Head office
          </div>
        </div>
        <div style={{ fontSize: '15px', lineHeight: '24px', color: '#5D5D5E' }}>
          Kolkata · add your registered address here
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: '#5D5D5E',
            marginTop: '16px',
          }}
        >
          Mon–Sat · 09:30–19:00
        </div>
      </div>
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '26px',
          background: 'linear-gradient(150deg, #2F58EE 0%, #213EA7 100%)',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '500',
            fontSize: '19px',
            letterSpacing: '-.4px',
          }}
        >
          Already a customer?
        </div>
        <div
          style={{
            fontSize: '15px',
            lineHeight: '24px',
            color: 'rgba(255,255,255,.82)',
            marginTop: '10px',
          }}
        >
          Raise a ticket from inside the platform and it lands with your named implementation lead.
        </div>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '18px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#FFFFFF',
          }}
        >
          Open the portal →
        </a>
      </div>
    </div>
  );
}
