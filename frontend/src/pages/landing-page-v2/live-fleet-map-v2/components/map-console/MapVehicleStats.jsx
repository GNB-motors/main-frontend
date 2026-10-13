export default function MapVehicleStats() {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(5,8,22,.07)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}
    >
      <div
        style={{
          padding: '11px 13px',
          borderRadius: '11px',
          background: '#FFFFFF',
          border: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '8.5px',
            fontWeight: '500',
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: '#93939A',
          }}
        >
          Speed
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: '#050816',
            marginTop: '6px',
          }}
        >
          62 km/h
        </div>
      </div>
      <div
        style={{
          padding: '11px 13px',
          borderRadius: '11px',
          background: '#FFFFFF',
          border: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '8.5px',
            fontWeight: '500',
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: '#93939A',
          }}
        >
          Odometer
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: '#050816',
            marginTop: '6px',
          }}
        >
          4,18,240
        </div>
      </div>
      <div
        style={{
          padding: '11px 13px',
          borderRadius: '11px',
          background: '#FFFFFF',
          border: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '8.5px',
            fontWeight: '500',
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: '#93939A',
          }}
        >
          Mileage
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: '#050816',
            marginTop: '6px',
          }}
        >
          3.9 km/l
        </div>
      </div>
      <div
        style={{
          padding: '11px 13px',
          borderRadius: '11px',
          background: '#FFFFFF',
          border: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '8.5px',
            fontWeight: '500',
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: '#93939A',
          }}
        >
          Last ping
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: '#050816',
            marginTop: '6px',
          }}
        >
          3 s ago
        </div>
      </div>
    </div>
  );
}
