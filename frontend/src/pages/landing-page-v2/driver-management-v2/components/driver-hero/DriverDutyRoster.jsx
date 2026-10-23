export default function DriverDutyRoster() {
  return (
    <div
      data-reveal
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-soft)',
        background: '#FFFFFF',
        border: '1px solid rgba(5,8,22,.06)',
        boxShadow: 'var(--shadow-lg)',
        padding: '34px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            color: '#93939A',
          }}
        >
          Duty roster · today
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--nova-rage-600)',
          }}
        >
          18 on duty
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
        <div style={{ position: 'relative', width: '104px', height: '104px', flex: '0 0 auto' }}>
          <svg
            viewBox="0 0 120 120"
            style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(68,105,240,.12)"
              strokeWidth="11"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#4469F0"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray="314"
              style={{ animation: 'dm-fill 1.4s cubic-bezier(.2,0,0,1) both .3s' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: '0', display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '24px',
                  letterSpacing: '-1px',
                  lineHeight: '1',
                }}
              >
                72%
              </div>
              <div style={{ fontSize: '10px', color: '#93939A', marginTop: '2px' }}>utilised</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: '1' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#5D5D5E' }}>Duty hours logged</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '22px',
                letterSpacing: '-.6px',
              }}
            >
              148 h
            </div>
          </div>
          <div style={{ height: '1px', background: 'rgba(5,8,22,.08)' }} />
          <div>
            <div style={{ fontSize: '13px', color: '#5D5D5E' }}>Licences expiring in 30 days</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '22px',
                letterSpacing: '-.6px',
                color: 'var(--nova-blaze-500)',
              }}
            >
              3
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
          flex: '1',
          minHeight: '0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '13px',
            padding: '13px 15px',
            borderRadius: '12px',
            background: '#F4F5FA',
            animation: 'dm-rise 460ms cubic-bezier(.2,0,0,1) both .5s',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              background: 'rgba(68,105,240,.12)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--nova-rage-600)',
            }}
          >
            RK
          </span>
          <span style={{ flex: '1', fontSize: '14px', fontWeight: '500' }}>Ramesh Kumar</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(24,122,50,.10)',
              color: 'var(--nova-fern-700)',
            }}
          >
            On trip
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '13px',
            padding: '13px 15px',
            borderRadius: '12px',
            background: '#F4F5FA',
            animation: 'dm-rise 460ms cubic-bezier(.2,0,0,1) both .62s',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              background: 'rgba(68,105,240,.12)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--nova-rage-600)',
            }}
          >
            SP
          </span>
          <span style={{ flex: '1', fontSize: '14px', fontWeight: '500' }}>Suresh Patil</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(68,105,240,.10)',
              color: 'var(--nova-rage-600)',
            }}
          >
            Available
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '13px',
            padding: '13px 15px',
            borderRadius: '12px',
            background: '#F4F5FA',
            animation: 'dm-rise 460ms cubic-bezier(.2,0,0,1) both .74s',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              background: 'rgba(68,105,240,.12)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--nova-rage-600)',
            }}
          >
            AY
          </span>
          <span style={{ flex: '1', fontSize: '14px', fontWeight: '500' }}>Arun Yadav</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(229,104,107,.12)',
              color: 'var(--nova-blaze-700)',
            }}
          >
            Licence due
          </span>
        </div>
      </div>
    </div>
  );
}
