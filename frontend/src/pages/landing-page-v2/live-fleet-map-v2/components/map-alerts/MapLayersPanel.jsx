export default function MapLayersPanel() {
  return (
    <div
      data-reveal
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(5,8,22,.07)',
        borderRadius: '20px',
        padding: '24px 22px 26px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-eyebrow)',
          fontSize: '9.5px',
          fontWeight: '500',
          letterSpacing: '.2em',
          textTransform: 'uppercase',
          color: '#93939A',
          marginBottom: '18px',
        }}
      >
        Map layers
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#050816' }}>Vehicles</span>
          <span
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '999px',
                background: '#FFFFFF',
              }}
            />
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#050816' }}>Planned routes</span>
          <span
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '999px',
                background: '#FFFFFF',
              }}
            />
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#050816' }}>Actual trail</span>
          <span
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '999px',
                background: '#FFFFFF',
              }}
            />
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#5D5D5E' }}>Geofences</span>
          <span
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '999px',
              background: 'rgba(5,8,22,.14)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '999px',
                background: '#FFFFFF',
              }}
            />
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#5D5D5E' }}>Depots and ICDs</span>
          <span
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '999px',
              background: 'rgba(5,8,22,.14)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '999px',
                background: '#FFFFFF',
              }}
            />
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#5D5D5E' }}>Halt markers</span>
          <span
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '999px',
              background: 'rgba(5,8,22,.14)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '999px',
                background: '#FFFFFF',
              }}
            />
          </span>
        </div>
      </div>
      <div
        style={{
          marginTop: '22px',
          paddingTop: '18px',
          borderTop: '1px solid rgba(5,8,22,.07)',
          fontSize: '13.5px',
          lineHeight: '21px',
          color: '#5D5D5E',
        }}
      >
        Every layer state is saved per user, so dispatch and management open the map they work with.
      </div>
    </div>
  );
}
