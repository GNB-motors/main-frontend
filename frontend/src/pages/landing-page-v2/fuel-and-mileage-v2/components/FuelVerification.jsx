import PaperworkColumn from './fuel-verification/PaperworkColumn.jsx';
import VehicleReportColumn from './fuel-verification/VehicleReportColumn.jsx';
import LitresBilledChart from './fuel-verification/LitresBilledChart.jsx';

export default function FuelVerification() {
  return (
    <section
      id="verification"
      data-screen-label="Fuel verification"
      style={{ background: '#F4F5FA', padding: '104px 40px' }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          data-mcol
          data-reveal-group
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr .88fr',
            gap: '72px',
            alignItems: 'start',
          }}
        >
          <div>
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
              Theft shows up as a gap{' '}
              <span style={{ color: 'var(--nova-rage-400)' }}>
                between two independent records.
              </span>
            </h2>
          </div>
          <div>
            <p
              style={{
                fontSize: '16.5px',
                lineHeight: '27px',
                color: '#5D5D5E',
                margin: '0 0 14px',
                textWrap: 'pretty',
              }}
            >
              We enable complete fuel monitoring and theft detection through the app, web platform,
              and WhatsApp bot. For every trip, users can upload an odometer photo and fuel bill
              photo.
            </p>
            <p
              style={{
                fontSize: '16.5px',
                lineHeight: '27px',
                color: '#5D5D5E',
                margin: '0',
                textWrap: 'pretty',
              }}
            >
              The system calculates each vehicle&apos;s actual mileage using the
              full-tank-to-full-tank method, then compares it against fuel consumption from vehicle
              hardware and telematics to flag unusual usage or potential theft.
            </p>
          </div>
        </div>

        <div
          data-reveal
          style={{
            marginTop: '56px',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.08)',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              padding: '20px 34px',
              borderBottom: '1px solid rgba(5,8,22,.08)',
              background: '#FAFAFC',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-eyebrow)',
                fontSize: '10px',
                fontWeight: '500',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: '#050816',
              }}
            >
              One trip, measured twice
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
              MH-46-C-8890 · Mumbai → Nagpur · 792 km · 12–18 Sep
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#C4494C',
              }}
            >
              Fuel audit FA-2291
            </span>
          </div>

          <div data-mcol style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr' }}>
            <PaperworkColumn />

            <div data-hide-m style={{ background: 'rgba(5,8,22,.08)' }} />

            <VehicleReportColumn />
          </div>

          <LitresBilledChart />
        </div>

        <div
          data-mcol3
          data-reveal-group
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: '28px',
            marginTop: '44px',
          }}
        >
          <div style={{ paddingTop: '18px', borderTop: '1px solid rgba(5,8,22,.12)' }}>
            <div
              style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '9px' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
                01
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '500',
                  fontSize: '18px',
                  letterSpacing: '-.35px',
                }}
              >
                Capture
              </span>
            </div>
            <div
              style={{
                fontSize: '14.5px',
                lineHeight: '23px',
                color: '#5D5D5E',
                textWrap: 'pretty',
              }}
            >
              An odometer photo and a fuel bill photo are uploaded against the trip, from whichever
              surface the driver or owner is on.
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--nova-rage-600)',
                marginTop: '12px',
              }}
            >
              app · web · WhatsApp bot
            </div>
          </div>
          <div style={{ paddingTop: '18px', borderTop: '1px solid rgba(5,8,22,.12)' }}>
            <div
              style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '9px' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
                02
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '500',
                  fontSize: '18px',
                  letterSpacing: '-.35px',
                }}
              >
                Calculate
              </span>
            </div>
            <div
              style={{
                fontSize: '14.5px',
                lineHeight: '23px',
                color: '#5D5D5E',
                textWrap: 'pretty',
              }}
            >
              Actual mileage per vehicle is computed on the full-tank-to-full-tank method, not on a
              claimed figure.
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--nova-rage-600)',
                marginTop: '12px',
              }}
            >
              full tank → full tank · 4.0 km/l
            </div>
          </div>
          <div style={{ paddingTop: '18px', borderTop: '1px solid rgba(5,8,22,.12)' }}>
            <div
              style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '9px' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
                03
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '500',
                  fontSize: '18px',
                  letterSpacing: '-.35px',
                }}
              >
                Compare
              </span>
            </div>
            <div
              style={{
                fontSize: '14.5px',
                lineHeight: '23px',
                color: '#5D5D5E',
                textWrap: 'pretty',
              }}
            >
              That number is checked against fuel consumption from vehicle hardware and telematics,
              and other available data points.
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--nova-rage-600)',
                marginTop: '12px',
              }}
            >
              telematics · 4.6 km/l
            </div>
          </div>
          <div
            style={{ paddingTop: '18px', borderTop: '2px solid var(--nova-blaze-400, #E5686B)' }}
          >
            <div
              style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '9px' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#C4494C' }}>
                04
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '500',
                  fontSize: '18px',
                  letterSpacing: '-.35px',
                }}
              >
                Flag
              </span>
            </div>
            <div
              style={{
                fontSize: '14.5px',
                lineHeight: '23px',
                color: '#5D5D5E',
                textWrap: 'pretty',
              }}
            >
              Unusual usage or potential theft is raised as a fuel audit against the trip, the
              vehicle and the driver.
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#C4494C',
                marginTop: '12px',
              }}
            >
              13 % gap · 25.6 L unaccounted
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
