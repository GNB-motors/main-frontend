import FuelVarianceToolbar from './FuelVarianceToolbar.jsx';

export default function FuelVarianceTable() {
  return (
    <div style={{ flex: '1', minWidth: '0', padding: '22px 24px 24px' }}>
      <FuelVarianceToolbar />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr',
          gap: '12px',
          padding: '16px 4px 10px',
          borderBottom: '1px solid rgba(5,8,22,.10)',
          fontFamily: 'var(--font-eyebrow)',
          fontSize: '9.5px',
          fontWeight: '500',
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: '#93939A',
        }}
      >
        <span>Vehicle</span>
        <span>Route</span>
        <span style={{ textAlign: 'right' }}>Distance</span>
        <span style={{ textAlign: 'right' }}>Bills</span>
        <span style={{ textAlign: 'right' }}>Sensor</span>
        <span style={{ textAlign: 'right' }}>Gap</span>
        <span style={{ textAlign: 'right' }}>Status</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr',
          gap: '12px',
          alignItems: 'center',
          padding: '15px 4px 15px 10px',
          marginLeft: '-10px',
          borderBottom: '1px solid rgba(5,8,22,.06)',
          background: 'rgba(68,105,240,.05)',
          boxShadow: 'inset 2px 0 0 var(--nova-rage-400)',
        }}
      >
        <span style={{ fontSize: '13.5px', fontWeight: '600', letterSpacing: '-.15px' }}>
          MH-46-C-8890
        </span>
        <span style={{ fontSize: '13px', color: '#5D5D5E' }}>Mumbai → Nagpur</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            textAlign: 'right',
            color: '#5D5D5E',
          }}
        >
          792 km
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          198.0 L
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          172.4 L
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            fontWeight: '500',
            textAlign: 'right',
            color: '#C4494C',
          }}
        >
          +25.6 L
        </span>
        <span style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: '500',
              padding: '5px 10px',
              borderRadius: '999px',
              background: 'rgba(229,104,107,.13)',
              color: '#C4494C',
              whiteSpace: 'nowrap',
            }}
          >
            Audit raised
          </span>
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr',
          gap: '12px',
          alignItems: 'center',
          padding: '15px 4px',
          borderBottom: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <span style={{ fontSize: '13.5px', fontWeight: '500', letterSpacing: '-.15px' }}>
          GJ-05-KT-7712
        </span>
        <span style={{ fontSize: '13px', color: '#5D5D5E' }}>Surat → Indore</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            textAlign: 'right',
            color: '#5D5D5E',
          }}
        >
          588 km
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          156.2 L
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          138.0 L
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            fontWeight: '500',
            textAlign: 'right',
            color: '#C4494C',
          }}
        >
          +18.2 L
        </span>
        <span style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: '500',
              padding: '5px 10px',
              borderRadius: '999px',
              background: 'rgba(229,104,107,.13)',
              color: '#C4494C',
              whiteSpace: 'nowrap',
            }}
          >
            Flagged
          </span>
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr',
          gap: '12px',
          alignItems: 'center',
          padding: '15px 4px',
          borderBottom: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <span style={{ fontSize: '13.5px', fontWeight: '500', letterSpacing: '-.15px' }}>
          KA-51-AB-3390
        </span>
        <span style={{ fontSize: '13px', color: '#5D5D5E' }}>Hubli → Belgaum</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            textAlign: 'right',
            color: '#5D5D5E',
          }}
        >
          268 km
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          68.4 L
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          61.7 L
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            fontWeight: '500',
            textAlign: 'right',
            color: '#A9701A',
          }}
        >
          +6.7 L
        </span>
        <span style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: '500',
              padding: '5px 10px',
              borderRadius: '999px',
              background: 'rgba(230,168,60,.16)',
              color: '#A9701A',
              whiteSpace: 'nowrap',
            }}
          >
            Reviewing
          </span>
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr',
          gap: '12px',
          alignItems: 'center',
          padding: '15px 4px',
          borderBottom: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <span style={{ fontSize: '13.5px', fontWeight: '500', letterSpacing: '-.15px' }}>
          MH-40-BX-2291
        </span>
        <span style={{ fontSize: '13px', color: '#5D5D5E' }}>Pune → Surat</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            textAlign: 'right',
            color: '#5D5D5E',
          }}
        >
          614 km
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          141.5 L
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          138.9 L
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            textAlign: 'right',
            color: '#5D5D5E',
          }}
        >
          +2.6 L
        </span>
        <span style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: '500',
              padding: '5px 10px',
              borderRadius: '999px',
              background: 'rgba(24,122,50,.10)',
              color: '#187A32',
              whiteSpace: 'nowrap',
            }}
          >
            Within band
          </span>
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr',
          gap: '12px',
          alignItems: 'center',
          padding: '15px 4px',
          borderBottom: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <span style={{ fontSize: '13.5px', fontWeight: '500', letterSpacing: '-.15px' }}>
          MH-12-QR-4460
        </span>
        <span style={{ fontSize: '13px', color: '#5D5D5E' }}>Nashik → Aurangabad</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            textAlign: 'right',
            color: '#5D5D5E',
          }}
        >
          322 km
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          74.0 L
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right' }}>
          73.1 L
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            textAlign: 'right',
            color: '#5D5D5E',
          }}
        >
          +0.9 L
        </span>
        <span style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: '500',
              padding: '5px 10px',
              borderRadius: '999px',
              background: 'rgba(24,122,50,.10)',
              color: '#187A32',
              whiteSpace: 'nowrap',
            }}
          >
            Within band
          </span>
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          paddingTop: '18px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#93939A',
        }}
      >
        <span>Showing 5 of 38 · sorted by gap</span>
        <span>Fleet gap this week · 53.9 L · ₹4,960</span>
      </div>
    </div>
  );
}
