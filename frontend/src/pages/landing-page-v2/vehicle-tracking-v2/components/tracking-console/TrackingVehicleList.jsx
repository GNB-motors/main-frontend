export default function TrackingVehicleList() {
  return (
    <div
      style={{
        flex: '0 0 168px',
        minWidth: '0',
        borderRight: '1px solid rgba(5,8,22,.07)',
        display: 'flex',
        flexDirection: 'column',
        background: '#FCFCFD',
      }}
    >
      <div
        style={{
          padding: '8px 12px 5px',
          fontFamily: 'var(--font-eyebrow)',
          fontSize: '8.5px',
          fontWeight: '500',
          letterSpacing: '.2em',
          textTransform: 'uppercase',
          color: '#93939A',
        }}
      >
        On the road
      </div>
      <div style={{ flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            gap: '9px',
            padding: '7px 12px',
            background: '#FFFFFF',
            borderLeft: '2px solid var(--nova-rage-400)',
            borderTop: '1px solid rgba(5,8,22,.06)',
            borderBottom: '1px solid rgba(5,8,22,.06)',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: '#187A32',
              marginTop: '4px',
            }}
          />
          <span style={{ flex: '1', minWidth: '0' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: '500',
              }}
            >
              GJ-05-KT-1180
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '9px',
                color: '#93939A',
                marginTop: '2px',
              }}
            >
              Surat → Nagpur · 62 km/h
            </span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '9px',
            padding: '7px 12px',
            borderBottom: '1px solid rgba(5,8,22,.05)',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: '#187A32',
              marginTop: '4px',
            }}
          />
          <span style={{ flex: '1', minWidth: '0' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#5D5D5E',
              }}
            >
              MH-04-BR-2210
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '9px',
                color: '#B6B6BC',
                marginTop: '2px',
              }}
            >
              Pune → Indore · 58 km/h
            </span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '9px',
            padding: '7px 12px',
            borderBottom: '1px solid rgba(5,8,22,.05)',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: '#E0A93B',
              marginTop: '4px',
            }}
          />
          <span style={{ flex: '1', minWidth: '0' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#5D5D5E',
              }}
            >
              RJ-14-GH-7745
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '9px',
                color: '#B6B6BC',
                marginTop: '2px',
              }}
            >
              Idle 24 min · Bhilwara
            </span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '9px',
            padding: '7px 12px',
            borderBottom: '1px solid rgba(5,8,22,.05)',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: '#E5686B',
              marginTop: '4px',
            }}
          />
          <span style={{ flex: '1', minWidth: '0' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#5D5D5E',
              }}
            >
              KA-51-MN-3390
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '9px',
                color: '#C4494C',
                marginTop: '2px',
              }}
            >
              Halted 2 h 10 m
            </span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '9px',
            padding: '7px 12px',
            borderBottom: '1px solid rgba(5,8,22,.05)',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: '#187A32',
              marginTop: '4px',
            }}
          />
          <span style={{ flex: '1', minWidth: '0' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#5D5D5E',
              }}
            >
              TN-22-CD-1904
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '9px',
                color: '#B6B6BC',
                marginTop: '2px',
              }}
            >
              Hosur → Chennai · 51 km/h
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
