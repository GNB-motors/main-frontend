export default function TrackingVehicleDetail() {
  return (
    <div
      style={{
        flex: '0 0 188px',
        minWidth: '0',
        borderLeft: '1px solid rgba(5,8,22,.07)',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
      }}
    >
      <div style={{ padding: '10px 13px 9px', borderBottom: '1px solid rgba(5,8,22,.06)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: '500',
            }}
          >
            GJ-05-KT-1180
          </span>
          <span
            style={{
              fontSize: '8.5px',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: '999px',
              background: 'rgba(24,122,50,.10)',
              color: '#187A32',
            }}
          >
            moving
          </span>
        </div>
        <div style={{ fontSize: '9px', color: '#93939A', marginTop: '3px' }}>
          Tata Signa 4825 · 32 ft MXL
        </div>
      </div>
      <div
        style={{
          flex: '1 1 auto',
          minHeight: '0',
          overflow: 'hidden',
          padding: '9px 13px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '5px 0',
            borderBottom: '1px solid rgba(5,8,22,.055)',
          }}
        >
          <span style={{ fontSize: '9.5px', color: '#5D5D5E' }}>Consignment</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px' }}>CN-40224</span>
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '5px 0',
            borderBottom: '1px solid rgba(5,8,22,.055)',
          }}
        >
          <span style={{ fontSize: '9.5px', color: '#5D5D5E' }}>Driver</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px' }}>R. Sharma</span>
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '5px 0',
            borderBottom: '1px solid rgba(5,8,22,.055)',
          }}
        >
          <span style={{ fontSize: '9.5px', color: '#5D5D5E' }}>Distance</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px' }}>412 of 588 km</span>
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '5px 0',
            borderBottom: '1px solid rgba(5,8,22,.055)',
          }}
        >
          <span style={{ fontSize: '9.5px', color: '#5D5D5E' }}>E-way bill</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9.5px',
              color: '#187A32',
            }}
          >
            valid 3 d
          </span>
        </span>
        <div style={{ marginTop: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-eyebrow)',
                fontSize: '8.5px',
                fontWeight: '500',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: '#93939A',
              }}
            >
              Progress
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: '#5D5D5E',
              }}
            >
              70 %
            </span>
          </div>
          <div
            style={{
              height: '5px',
              borderRadius: '999px',
              background: 'rgba(5,8,22,.07)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '70%',
                height: '100%',
                borderRadius: '999px',
                background: 'var(--nova-rage-400)',
              }}
            />
          </div>
        </div>
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '7px',
          }}
        >
          <span style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span
              style={{
                flex: '0 0 auto',
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: '#4469F0',
                marginTop: '4px',
              }}
            />
            <span style={{ flex: '1', minWidth: '0' }}>
              <span style={{ display: 'block', fontSize: '9.5px' }}>Bharuch toll crossed</span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8.5px',
                  color: '#B6B6BC',
                }}
              >
                11:42
              </span>
            </span>
          </span>
          <span style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span
              style={{
                flex: '0 0 auto',
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: 'rgba(5,8,22,.18)',
                marginTop: '4px',
              }}
            />
            <span style={{ flex: '1', minWidth: '0' }}>
              <span style={{ display: 'block', fontSize: '9.5px', color: '#5D5D5E' }}>
                Halt at Dhule dhaba
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8.5px',
                  color: '#B6B6BC',
                }}
              >
                09:05 · 38 min
              </span>
            </span>
          </span>
        </div>
      </div>
      <div
        style={{
          flex: '0 0 auto',
          padding: '10px 13px',
          borderTop: '1px solid rgba(5,8,22,.06)',
          display: 'flex',
          gap: '7px',
        }}
      >
        <span
          style={{
            flex: '1',
            textAlign: 'center',
            fontSize: '9.5px',
            fontWeight: '600',
            color: '#FFFFFF',
            background: 'var(--nova-rage-400)',
            borderRadius: '7px',
            padding: '7px 0',
          }}
        >
          Share link
        </span>
        <span
          style={{
            flex: '1',
            textAlign: 'center',
            fontSize: '9.5px',
            fontWeight: '600',
            color: '#050816',
            border: '1px solid rgba(5,8,22,.10)',
            borderRadius: '7px',
            padding: '7px 0',
          }}
        >
          Replay
        </span>
      </div>
    </div>
  );
}
