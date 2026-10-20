import FuelConsoleTopBar from './fuel-console/FuelConsoleTopBar.jsx';
import FuelConsoleRail from './fuel-console/FuelConsoleRail.jsx';
import FuelVarianceTable from './fuel-console/FuelVarianceTable.jsx';
import FuelSelectedTrip from './fuel-console/FuelSelectedTrip.jsx';

export default function FuelConsole() {
  return (
    <section
      data-screen-label="Fuel console"
      style={{ background: '#FFFFFF', padding: '104px 40px' }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          data-mcol
          data-reveal-group
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr .92fr',
            gap: '72px',
            alignItems: 'end',
            marginBottom: '48px',
          }}
        >
          <h2
            data-mhead
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '38px',
              lineHeight: '1.12',
              letterSpacing: '-1.2px',
              margin: '0',
              textWrap: 'pretty',
            }}
          >
            Variance you can act on, not a spreadsheet you argue about.
          </h2>
          <div>
            <p
              style={{ fontSize: '17px', lineHeight: '28px', color: '#5D5D5E', margin: '0 0 22px' }}
            >
              Every flagged trip opens into its own telemetry, refuelling slips and driver record,
              so the conversation starts with evidence.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '13px 0',
                  borderTop: '1px solid rgba(5,8,22,.09)',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4469F0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flex: '0 0 auto', marginTop: '3px' }}
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <div style={{ fontSize: '15.5px', lineHeight: '24px', color: '#050816' }}>
                  A flagged drop shows where the truck was standing when it happened
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '13px 0',
                  borderTop: '1px solid rgba(5,8,22,.09)',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4469F0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flex: '0 0 auto', marginTop: '3px' }}
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <div style={{ fontSize: '15.5px', lineHeight: '24px', color: '#050816' }}>
                  Refuelling slips reconcile against fuel card and vendor statements
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '13px 0',
                  borderTop: '1px solid rgba(5,8,22,.09)',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4469F0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flex: '0 0 auto', marginTop: '3px' }}
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <div style={{ fontSize: '15.5px', lineHeight: '24px', color: '#050816' }}>
                  Fuel cost lands in route profitability without a second entry
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          data-scroll-m
          data-reveal
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(5,8,22,.11)',
            boxShadow: 'var(--shadow-lg)',
            background: '#FFFFFF',
          }}
        >
          <FuelConsoleTopBar />

          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              minHeight: '534px',
              minWidth: '900px',
            }}
          >
            <FuelConsoleRail />

            <FuelVarianceTable />

            <FuelSelectedTrip />
          </div>
        </div>

        <div
          data-mcol3
          data-reveal-group
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: '32px',
            marginTop: '24px',
          }}
        >
          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(5,8,22,.10)' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--nova-rage-600)',
                marginBottom: '7px',
              }}
            >
              Bills · sensor · gap
            </div>
            <div
              style={{
                fontSize: '14.5px',
                lineHeight: '23px',
                color: '#5D5D5E',
                textWrap: 'pretty',
              }}
            >
              Both records sit in the same row, so the gap is a column, not a calculation someone
              has to run.
            </div>
          </div>
          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(5,8,22,.10)' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--nova-rage-600)',
                marginBottom: '7px',
              }}
            >
              Evidence on file
            </div>
            <div
              style={{
                fontSize: '14.5px',
                lineHeight: '23px',
                color: '#5D5D5E',
                textWrap: 'pretty',
              }}
            >
              Odometer photo, fuel bill and the tank sensor log stay attached to the trip that
              raised the flag.
            </div>
          </div>
          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(5,8,22,.10)' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--nova-rage-600)',
                marginBottom: '7px',
              }}
            >
              Audit trail
            </div>
            <div
              style={{
                fontSize: '14.5px',
                lineHeight: '23px',
                color: '#5D5D5E',
                textWrap: 'pretty',
              }}
            >
              Raising an audit records who saw it and when, against the trip, the vehicle and the
              driver.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
