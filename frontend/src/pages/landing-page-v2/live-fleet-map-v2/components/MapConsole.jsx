import MapVehicleList from './map-console/MapVehicleList.jsx';
import MapCanvas from './map-console/MapCanvas.jsx';
import MapVehicleDetail from './map-console/MapVehicleDetail.jsx';

export default function MapConsole() {
  return (
    <section
      data-screen-label="Map console"
      style={{ background: '#FFFFFF', padding: '96px 40px 104px' }}
    >
      <div
        data-reveal
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          borderRadius: '24px',
          background: '#FFFFFF',
          border: '1px solid rgba(5,8,22,.08)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        <div data-scroll-m>
          <div style={{ minWidth: '1080px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                padding: '0 20px',
                height: '66px',
                borderBottom: '1px solid rgba(5,8,22,.07)',
                background: '#FCFCFE',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '999px',
                    background: '#187A32',
                    boxShadow: '0 0 0 4px rgba(24,122,50,.14)',
                    animation: 'fm-blink 2.4s ease-in-out infinite',
                  }}
                />
                <span style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '-.2px' }}>
                  Live fleet map
                </span>
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#93939A' }}
                >
                  1,240 vehicles
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  marginLeft: '8px',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: '#F3F3F6',
                  border: '1px solid rgba(5,8,22,.06)',
                  minWidth: '230px',
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#93939A"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flex: '0 0 auto' }}
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M16.5 16.5L21 21" />
                </svg>
                <span style={{ fontSize: '13px', color: '#93939A' }}>
                  Search vehicle, driver or trip
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    background: 'var(--nova-rage-400)',
                    border: '1px solid var(--nova-rage-800)',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}
                >
                  All
                </span>
                <span
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    background: '#FFFFFF',
                    border: '1px solid rgba(5,8,22,.10)',
                    fontSize: '12.5px',
                    fontWeight: '500',
                    color: '#5D5D5E',
                  }}
                >
                  Moving
                </span>
                <span
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    background: '#FFFFFF',
                    border: '1px solid rgba(5,8,22,.10)',
                    fontSize: '12.5px',
                    fontWeight: '500',
                    color: '#5D5D5E',
                  }}
                >
                  Halted
                </span>
                <span
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    background: '#FFFFFF',
                    border: '1px solid rgba(5,8,22,.10)',
                    fontSize: '12.5px',
                    fontWeight: '500',
                    color: '#5D5D5E',
                  }}
                >
                  Idle
                </span>
              </div>
              <div
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}
              >
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#93939A' }}
                >
                  updated 3 s ago
                </span>
                <span
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: '#F3F3F6',
                    border: '1px solid rgba(5,8,22,.06)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#5D5D5E"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3l9 5-9 5-9-5 9-5z" />
                    <path d="M3 13l9 5 9-5" />
                  </svg>
                </span>
              </div>
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '268px 1fr 312px', height: '560px' }}
            >
              <div
                style={{
                  borderRight: '1px solid rgba(5,8,22,.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 18px 12px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-eyebrow)',
                      fontSize: '9.5px',
                      fontWeight: '500',
                      letterSpacing: '.2em',
                      textTransform: 'uppercase',
                      color: '#93939A',
                    }}
                  >
                    Vehicles on map
                  </span>
                  <span
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}
                  >
                    1,240
                  </span>
                </div>
                <MapVehicleList />
              </div>
              <MapCanvas />
              <MapVehicleDetail />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
