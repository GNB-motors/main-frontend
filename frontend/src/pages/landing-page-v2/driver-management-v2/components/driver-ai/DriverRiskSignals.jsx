export default function DriverRiskSignals() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          padding: '13px 15px',
          borderRadius: '12px',
          background: '#F4F5FA',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#050816' }}>Duty hours</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
            58 / 60 h
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(5,8,22,.08)' }}>
          <div
            style={{
              height: '100%',
              width: '92%',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              transformOrigin: 'left',
              animation: 'ai-bar 900ms cubic-bezier(.2,0,0,1) both 0.20s',
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          padding: '13px 15px',
          borderRadius: '12px',
          background: '#F4F5FA',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#050816' }}>
            Harsh braking
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
            11 events
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(5,8,22,.08)' }}>
          <div
            style={{
              height: '100%',
              width: '46%',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              transformOrigin: 'left',
              animation: 'ai-bar 900ms cubic-bezier(.2,0,0,1) both 0.32s',
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          padding: '13px 15px',
          borderRadius: '12px',
          background: '#F4F5FA',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#050816' }}>
            Night driving
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
            38% of km
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(5,8,22,.08)' }}>
          <div
            style={{
              height: '100%',
              width: '62%',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              transformOrigin: 'left',
              animation: 'ai-bar 900ms cubic-bezier(.2,0,0,1) both 0.44s',
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          padding: '13px 15px',
          borderRadius: '12px',
          background: '#F4F5FA',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#050816' }}>Documents</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
            1 expiring
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(5,8,22,.08)' }}>
          <div
            style={{
              height: '100%',
              width: '24%',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              transformOrigin: 'left',
              animation: 'ai-bar 900ms cubic-bezier(.2,0,0,1) both 0.56s',
            }}
          />
        </div>
      </div>
    </div>
  );
}
