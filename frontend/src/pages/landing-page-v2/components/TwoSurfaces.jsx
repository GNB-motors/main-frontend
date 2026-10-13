import SurfacesDiagram from './two-surfaces/SurfacesDiagram.jsx';

export default function TwoSurfaces() {
  return (
    <section
      data-screen-label="Two surfaces"
      style={{ background: '#F4F5FA', padding: '104px 40px' }}
    >
      <div
        data-mcol
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.05fr',
          gap: '64px',
          alignItems: 'center',
        }}
      >
        <div data-reveal-group>
          <h2
            data-mhead
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '46px',
              lineHeight: '1.08',
              letterSpacing: '-1.6px',
              margin: '0',
              textWrap: 'pretty',
            }}
          >
            Two surfaces. <span style={{ color: 'var(--nova-rage-400)' }}>One data layer.</span>
          </h2>
          <p
            style={{
              fontSize: '18px',
              lineHeight: '29px',
              color: '#5D5D5E',
              margin: '26px 0 40px',
              maxWidth: '520px',
              textWrap: 'pretty',
            }}
          >
            Owners, drivers and office staff work on different devices. Everyone reads and writes
            the same record, so the number on the road matches the number in reporting.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <span
                style={{
                  flex: '0 0 auto',
                  width: '44px',
                  height: '44px',
                  borderRadius: '999px',
                  background: 'rgba(68,105,240,.10)',
                  display: 'grid',
                  placeItems: 'center',
                  marginTop: '2px',
                }}
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4469F0"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                  <path d="M11 18.5h2" />
                </svg>
              </span>
              <div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#050816',
                    marginBottom: '5px',
                  }}
                >
                  Mobile app · owners and drivers
                </div>
                <div style={{ fontSize: '16px', lineHeight: '25px', color: '#5D5D5E' }}>
                  A driver logs in to see the vehicle assigned to him, his trip details and
                  documents, his earnings and trip payouts, and raises advances for fuel, tolls and
                  food before a trip. The owner approves every request and tracks trips, fuel and
                  mileage from the same app.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <span
                style={{
                  flex: '0 0 auto',
                  width: '44px',
                  height: '44px',
                  borderRadius: '999px',
                  background: 'rgba(68,105,240,.10)',
                  display: 'grid',
                  placeItems: 'center',
                  marginTop: '2px',
                }}
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4469F0"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2.5" y="4" width="19" height="13" rx="2" />
                  <path d="M8 21h8" />
                </svg>
              </span>
              <div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#050816',
                    marginBottom: '5px',
                  }}
                >
                  Web platform · owners and staff
                </div>
                <div style={{ fontSize: '16px', lineHeight: '25px', color: '#5D5D5E' }}>
                  The full platform in a browser. Vehicles, drivers, trips and dispatch, ERP and
                  CRM, ledgers and payments, GST and e-way bills, and every report — with role-based
                  access per employee.
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '38px' }}>
            <a
              href="#capabilities"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--nova-rage-600)',
              }}
            >
              See what runs inside →
            </a>
          </div>
        </div>
        <SurfacesDiagram />
      </div>
    </section>
  );
}
