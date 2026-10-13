import FuelCheckCard from './fuel-monitoring/FuelCheckCard.jsx';

export default function FuelMonitoring() {
  return (
    <section
      id="fuel"
      data-screen-label="Fuel monitoring"
      style={{ background: '#FFFFFF', padding: '112px 40px' }}
    >
      <div
        data-mcol
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.05fr .95fr',
          gap: '72px',
          alignItems: 'center',
        }}
      >
        <div data-reveal-group>
          <div
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '.44em',
              textTransform: 'uppercase',
              color: 'var(--nova-rage-600)',
              marginBottom: '20px',
            }}
          >
            Fuel monitoring and theft detection
          </div>
          <h2
            data-mhead
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '44px',
              lineHeight: '1.08',
              letterSpacing: '-1.5px',
              margin: '0',
              textWrap: 'pretty',
            }}
          >
            Every litre verified{' '}
            <span style={{ color: 'var(--nova-rage-400)' }}>against two independent records.</span>
          </h2>
          <p
            style={{
              fontSize: '18px',
              lineHeight: '29px',
              color: '#5D5D5E',
              margin: '24px 0 36px',
              maxWidth: '560px',
              textWrap: 'pretty',
            }}
          >
            We enable complete fuel monitoring and theft detection through the app, web platform,
            and WhatsApp bot. For every trip, users can upload an odometer photo and fuel bill
            photo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: '0 0 auto', marginTop: '4px' }}
              >
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
              <span
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  color: '#050816',
                  textWrap: 'pretty',
                }}
              >
                The system calculates each vehicle&apos;s actual mileage using the
                full-tank-to-full-tank method.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: '0 0 auto', marginTop: '4px' }}
              >
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
              <span
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  color: '#050816',
                  textWrap: 'pretty',
                }}
              >
                This data is then compared with fuel consumption data from vehicle
                hardware/telematics and other available data points to identify unusual fuel usage
                or potential fuel theft.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: '0 0 auto', marginTop: '4px' }}
              >
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
              <span
                style={{
                  fontSize: '16px',
                  lineHeight: '26px',
                  color: '#050816',
                  textWrap: 'pretty',
                }}
              >
                This creates a strong verification system, helping businesses closely monitor fuel
                consumption and significantly reduce the risk of fuel theft.
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '34px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                padding: '10px 15px',
                borderRadius: '999px',
                background: '#FFFFFF',
                border: '1px solid rgba(68,105,240,.20)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: '0 0 auto' }}
              >
                <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                <path d="M11 18.5h2" />
              </svg>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  letterSpacing: '-.1px',
                  color: '#050816',
                  whiteSpace: 'nowrap',
                }}
              >
                Mobile app
              </span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                padding: '10px 15px',
                borderRadius: '999px',
                background: '#FFFFFF',
                border: '1px solid rgba(68,105,240,.20)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: '0 0 auto' }}
              >
                <rect x="2.5" y="4" width="19" height="13" rx="2" />
                <path d="M8 21h8" />
              </svg>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  letterSpacing: '-.1px',
                  color: '#050816',
                  whiteSpace: 'nowrap',
                }}
              >
                Web platform
              </span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                padding: '10px 15px',
                borderRadius: '999px',
                background: '#FFFFFF',
                border: '1px solid rgba(68,105,240,.20)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flex: '0 0 auto' }}
              >
                <path d="M20.5 11.5a8.5 8.5 0 1 1-4.2-7.3" />
                <path d="M3.5 20.5l1.4-4.2a8.5 8.5 0 0 0 3 3.1z" />
                <path
                  d="M8.8 9.2c.4 2.6 2.4 4.6 5 5l1-1.6 2 .8-.4 1.8c-2.9.4-6.6-2.4-7.6-5.6l1.4-1.2z"
                  fill="rgba(68,105,240,.14)"
                />
              </svg>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  letterSpacing: '-.1px',
                  color: '#050816',
                  whiteSpace: 'nowrap',
                }}
              >
                WhatsApp bot
              </span>
            </span>
          </div>
          <div style={{ marginTop: '34px' }}>
            <a
              href="/fuel-and-mileage"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--nova-rage-600)',
              }}
            >
              See fuel and mileage →
            </a>
          </div>
        </div>
        <FuelCheckCard />
      </div>
    </section>
  );
}
