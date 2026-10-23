import TrackingVehicleList from './tracking-console/TrackingVehicleList.jsx';
import TrackingMap from './tracking-console/TrackingMap.jsx';
import TrackingVehicleDetail from './tracking-console/TrackingVehicleDetail.jsx';

export default function TrackingConsole() {
  return (
    <section
      data-screen-label="Tracking console"
      style={{ background: '#FFFFFF', padding: '104px 40px' }}
    >
      <div
        data-mcol
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '.85fr 1.15fr',
          gap: '72px',
          alignItems: 'center',
        }}
      >
        <div data-reveal-group>
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
            Built for the person watching the map all day.
          </h2>
          <p
            style={{
              fontSize: '17px',
              lineHeight: '28px',
              color: '#5D5D5E',
              margin: '22px 0 32px',
            }}
          >
            Filters persist, the map remembers where you left it, and every vehicle opens straight
            into its trip, driver and consignment record.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <svg
                width="20"
                height="20"
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
              <div style={{ fontSize: '16px', lineHeight: '25px', color: '#050816' }}>
                One click from a pin to the consignment it is carrying
              </div>
            </div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <svg
                width="20"
                height="20"
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
              <div style={{ fontSize: '16px', lineHeight: '25px', color: '#050816' }}>
                Share a live tracking link with the client, no login required
              </div>
            </div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <svg
                width="20"
                height="20"
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
              <div style={{ fontSize: '16px', lineHeight: '25px', color: '#050816' }}>
                Replay any trip from the last 90 days, stop by stop
              </div>
            </div>
          </div>
        </div>
        <div
          data-reveal
          data-scroll-m
          style={{
            borderRadius: 'var(--radius-xtra-soft)',
            overflow: 'hidden',
            border: '1px solid rgba(5,8,22,.08)',
            boxShadow: 'var(--shadow-lg)',
            aspectRatio: '16/10',
          }}
        >
          <div
            style={{
              height: '100%',
              minWidth: '560px',
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              fontFamily: 'var(--font-ui)',
              color: '#050816',
            }}
          >
            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderBottom: '1px solid rgba(5,8,22,.07)',
                background: '#FCFCFD',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  background: 'var(--nova-rage-400)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: '600',
                  letterSpacing: '-.1px',
                  whiteSpace: 'nowrap',
                }}
              >
                Live fleet
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginLeft: '6px',
                  flex: '0 0 auto',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '600',
                    padding: '4px 9px',
                    borderRadius: '999px',
                    background: 'var(--nova-rage-400)',
                    color: '#FFFFFF',
                  }}
                >
                  All 44
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '500',
                    padding: '4px 9px',
                    borderRadius: '999px',
                    background: 'rgba(5,8,22,.05)',
                    color: '#5D5D5E',
                  }}
                >
                  Moving 38
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '500',
                    padding: '4px 9px',
                    borderRadius: '999px',
                    background: 'rgba(5,8,22,.05)',
                    color: '#5D5D5E',
                  }}
                >
                  Idle 4
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '500',
                    padding: '4px 9px',
                    borderRadius: '999px',
                    background: 'rgba(229,104,107,.12)',
                    color: '#C4494C',
                  }}
                >
                  Halted 2
                </span>
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(5,8,22,.09)',
                  background: '#FFFFFF',
                  flex: '0 1 140px',
                  minWidth: '0',
                  overflow: 'hidden',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B6B6BC"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.4-3.4" />
                </svg>
                <span
                  style={{
                    fontSize: '9.5px',
                    color: '#B6B6BC',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Vehicle, driver or LR
                </span>
              </span>
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '999px',
                  background: 'rgba(68,105,240,.14)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '8.5px',
                  fontWeight: '600',
                  color: 'var(--nova-rage-600)',
                }}
              >
                PK
              </span>
            </div>

            <div style={{ flex: '1', minHeight: '0', display: 'flex' }}>
              <TrackingVehicleList />

              <TrackingMap />

              <TrackingVehicleDetail />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
