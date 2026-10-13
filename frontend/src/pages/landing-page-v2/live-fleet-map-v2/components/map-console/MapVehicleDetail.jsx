import MapTripProgress from './MapTripProgress.jsx';
import MapVehicleStats from './MapVehicleStats.jsx';

export default function MapVehicleDetail() {
  return (
    <div
      style={{
        borderLeft: '1px solid rgba(5,8,22,.07)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '0',
        background: '#FCFCFE',
      }}
    >
      <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid rgba(5,8,22,.07)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#050816' }}>
            MH-12-AB-4471
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '999px',
              background: 'rgba(68,105,240,.10)',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '999px',
                background: '#4469F0',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--nova-rage-600)',
              }}
            >
              moving
            </span>
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#93939A',
            marginTop: '8px',
          }}
        >
          Trip GNB/2026/04817 · 32 t tipper
        </div>
      </div>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(5,8,22,.07)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span
          style={{
            flex: '0 0 auto',
            width: '38px',
            height: '38px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.10)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--nova-rage-600)',
          }}
        >
          RP
        </span>
        <div style={{ minWidth: '0', flex: '1' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#050816' }}>
            Ramesh Pawar
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#93939A',
              marginTop: '3px',
            }}
          >
            DL-1420110012345 · 4 yrs
          </div>
        </div>
        <span
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.08)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4469F0"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 5 5L14.5 12l4 1.5V17a2 2 0 0 1-2.2 2A14 14 0 0 1 3.2 6.2 2 2 0 0 1 5 4z" />
          </svg>
        </span>
      </div>
      <MapTripProgress />
      <MapVehicleStats />
      <div style={{ padding: '16px 20px', flex: '1', minHeight: '0' }}>
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '9px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#93939A',
            marginBottom: '12px',
          }}
        >
          Recent events
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: '#93939A',
                whiteSpace: 'nowrap',
              }}
            >
              11:42
            </span>
            <span style={{ fontSize: '12px', lineHeight: '18px', color: '#050816' }}>
              Crossed Igatpuri toll
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: '#93939A',
                whiteSpace: 'nowrap',
              }}
            >
              09:18
            </span>
            <span style={{ fontSize: '12px', lineHeight: '18px', color: '#050816' }}>
              Halt 22 min · driver break
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: '#93939A',
                whiteSpace: 'nowrap',
              }}
            >
              04:20
            </span>
            <span style={{ fontSize: '12px', lineHeight: '18px', color: '#050816' }}>
              Exited Bhiwandi ICD geofence
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          padding: '14px 20px 18px',
          borderTop: '1px solid rgba(5,8,22,.07)',
          display: 'flex',
          gap: '10px',
        }}
      >
        <span
          style={{
            flex: '1',
            textAlign: 'center',
            padding: '11px 14px',
            borderRadius: '10px',
            background: 'var(--nova-rage-400)',
            border: '1px solid var(--nova-rage-800)',
            fontSize: '13px',
            fontWeight: '600',
            color: '#FFFFFF',
          }}
        >
          Open trip
        </span>
        <span
          style={{
            flex: '1',
            textAlign: 'center',
            padding: '11px 14px',
            borderRadius: '10px',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.10)',
            fontSize: '13px',
            fontWeight: '600',
            color: '#050816',
          }}
        >
          Replay route
        </span>
      </div>
    </div>
  );
}
