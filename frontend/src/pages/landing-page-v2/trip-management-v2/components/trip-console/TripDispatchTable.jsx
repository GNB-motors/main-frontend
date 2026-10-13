const ROWS = [
  {
    trip: 'GNB/04817',
    route: 'Mumbai → Nagpur',
    vehicle: 'MH-40-BX-2291',
    driver: 'R. Kumar',
    status: 'In transit · 68%',
    statusBg: 'rgba(68,105,240,.10)',
    statusColor: 'var(--nova-rage-600)',
    margin: '+8%',
    marginColor: '#050816',
  },
  {
    trip: 'GNB/04816',
    route: 'Pune → Surat',
    vehicle: 'MH-12-KL-8840',
    driver: 'S. Patil',
    status: 'Loading',
    statusBg: 'rgba(5,8,22,.06)',
    statusColor: '#5D5D5E',
    margin: '+11%',
    marginColor: '#050816',
  },
  {
    trip: 'GNB/04815',
    route: 'Nashik → Indore',
    vehicle: 'MH-15-CD-3372',
    driver: 'A. Sheikh',
    status: 'POD pending',
    statusBg: 'rgba(5,8,22,.06)',
    statusColor: '#5D5D5E',
    margin: '+6%',
    marginColor: '#050816',
  },
  {
    trip: 'GNB/04814',
    route: 'Nagpur → Raipur',
    vehicle: 'CG-04-HH-7719',
    driver: 'M. Verma',
    status: 'Delivered',
    statusBg: 'rgba(24,122,50,.12)',
    statusColor: '#187A32',
    margin: '+14%',
    marginColor: '#050816',
  },
  {
    trip: 'GNB/04812',
    route: 'Aurangabad → Pune',
    vehicle: '—',
    driver: 'Unassigned',
    status: 'Needs vehicle',
    statusBg: 'rgba(229,104,107,.14)',
    statusColor: '#BB2626',
    margin: '—',
    marginColor: '#93939A',
  },
];

export default function TripDispatchTable() {
  return (
    <div data-scroll-m>
      <div style={{ minWidth: '680px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1.35fr 1.05fr .85fr 1.05fr .5fr',
            gap: '16px',
            padding: '0 26px 12px',
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '9.5px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#93939A',
          }}
        >
          <span>Trip</span>
          <span>Route</span>
          <span>Vehicle</span>
          <span>Driver</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Margin</span>
        </div>
        <div>
          {ROWS.map((row) => (
            <div
              key={row.trip}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.05fr 1.35fr 1.05fr .85fr 1.05fr .5fr',
                gap: '16px',
                alignItems: 'center',
                padding: '15px 26px',
                borderTop: '1px solid rgba(5,8,22,.06)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#5D5D5E',
                }}
              >
                {row.trip}
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: '500', color: '#050816' }}>
                {row.route}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#5D5D5E',
                }}
              >
                {row.vehicle}
              </span>
              <span style={{ fontSize: '13px', color: '#5D5D5E' }}>{row.driver}</span>
              <span>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '5px 11px',
                    borderRadius: '999px',
                    background: row.statusBg,
                    color: row.statusColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.status}
                </span>
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: '500',
                  textAlign: 'right',
                  color: row.marginColor,
                }}
              >
                {row.margin}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
