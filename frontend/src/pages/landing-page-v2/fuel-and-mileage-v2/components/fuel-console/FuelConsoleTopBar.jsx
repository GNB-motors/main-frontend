export default function FuelConsoleTopBar() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        height: '54px',
        padding: '0 18px',
        background: '#FAFAFC',
        borderBottom: '1px solid rgba(5,8,22,.08)',
      }}
    >
      <span
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '7px',
          background: 'var(--nova-gradient-rage)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: '700',
          fontSize: '11px',
          color: '#fff',
          flex: '0 0 auto',
        }}
      >
        G
      </span>
      <span
        style={{
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '-.1px',
          whiteSpace: 'nowrap',
        }}
      >
        Fuel and mileage
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#93939A',
          whiteSpace: 'nowrap',
        }}
      >
        / variance
      </span>
      <span
        style={{
          flex: '1',
          maxWidth: '300px',
          marginLeft: '12px',
          height: '30px',
          borderRadius: '8px',
          background: '#FFFFFF',
          border: '1px solid rgba(5,8,22,.10)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 11px',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#93939A"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ flex: '0 0 auto' }}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span style={{ fontSize: '12px', color: '#B0B0B6' }}>Vehicle, route or bill no.</span>
      </span>
      <span
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          flex: '0 0 auto',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#5D5D5E',
            padding: '6px 11px',
            borderRadius: '999px',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.10)',
          }}
        >
          12 – 18 Sep
        </span>
        <span
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.14)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '10px',
            fontWeight: '600',
            color: 'var(--nova-rage-600)',
          }}
        >
          RS
        </span>
      </span>
    </div>
  );
}
