export default function FuelHeroMileageCompare() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid rgba(5,8,22,.07)',
      }}
    >
      <div style={{ padding: '22px 26px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '20px',
              height: '2.5px',
              borderRadius: '2px',
              background: 'rgba(68,105,240,.85)',
            }}
          />
          <span style={{ fontSize: '12px', color: '#5D5D5E' }}>Billed on fuel slips</span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '32px',
            letterSpacing: '-1.3px',
            marginTop: '10px',
          }}
        >
          4.0{' '}
          <span
            style={{
              fontSize: '15px',
              fontWeight: '400',
              color: '#93939A',
              letterSpacing: '0',
            }}
          >
            km/l
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#93939A',
            marginTop: '6px',
          }}
        >
          198.0 L over 792 km
        </div>
      </div>
      <div style={{ padding: '22px 26px 20px', borderLeft: '1px solid rgba(5,8,22,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '20px',
              height: '2.5px',
              borderRadius: '2px',
              background: 'rgba(68,105,240,.3)',
            }}
          />
          <span style={{ fontSize: '12px', color: '#5D5D5E' }}>Tank sensor says</span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '32px',
            letterSpacing: '-1.3px',
            marginTop: '10px',
          }}
        >
          4.6{' '}
          <span
            style={{
              fontSize: '15px',
              fontWeight: '400',
              color: '#93939A',
              letterSpacing: '0',
            }}
          >
            km/l
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#93939A',
            marginTop: '6px',
          }}
        >
          172.4 L over 792 km
        </div>
      </div>
    </div>
  );
}
