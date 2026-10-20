export default function MapTripProgress() {
  return (
    <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(5,8,22,.07)' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '4px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              background: '#4469F0',
            }}
          />
          <span
            style={{
              flex: '1',
              width: '1px',
              margin: '5px 0',
              background:
                'repeating-linear-gradient(180deg, rgba(68,105,240,.4) 0 4px, transparent 4px 8px)',
            }}
          />
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              border: '2px solid #4469F0',
              background: '#FFFFFF',
            }}
          />
        </div>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#050816' }}>
              Bhiwandi ICD
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: '#93939A',
                marginTop: '3px',
              }}
            >
              out 04:20 · 12 Aug
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#050816' }}>
              Nagpur depot
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: '#93939A',
                marginTop: '3px',
              }}
            >
              eta 19:40 · 12 Aug
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '9px',
              fontWeight: '500',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: '#93939A',
            }}
          >
            Trip progress
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              color: 'var(--nova-rage-600)',
            }}
          >
            68% · 476 of 700 km
          </span>
        </div>
        <div
          style={{
            height: '6px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.12)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '68%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #4469F0, #213EA7)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
