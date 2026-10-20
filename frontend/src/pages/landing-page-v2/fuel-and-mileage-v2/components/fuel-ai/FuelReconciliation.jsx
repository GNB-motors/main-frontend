export default function FuelReconciliation() {
  return (
    <div
      data-reveal
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(68,105,240,.18)',
        borderRadius: '22px',
        padding: '28px 30px 30px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '26px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'var(--nova-rage-600)',
          }}
        >
          Fuel reconciliation · litres in versus litres explained
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          Fleet · last 30 days
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '9px',
            }}
          >
            <span style={{ fontSize: '13.5px', fontWeight: '500' }}>Fuel issued</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#5D5D5E' }}>
              1,240 L · ₹1,12,840
            </span>
          </div>
          <div
            style={{
              height: '34px',
              borderRadius: '9px',
              background: 'rgba(68,105,240,.5)',
              transformOrigin: 'left',
              animation: 'ai-bar 1s cubic-bezier(.2,0,0,1) both .2s',
            }}
          />
        </div>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '9px',
            }}
          >
            <span style={{ fontSize: '13.5px', fontWeight: '500' }}>
              Explained by distance, load and terrain
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#5D5D5E' }}>
              1,198 L
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', height: '34px' }}>
            <div
              style={{
                flex: '0 0 96.6%',
                borderRadius: '9px',
                background: 'rgba(68,105,240,.28)',
                transformOrigin: 'left',
                animation: 'ai-bar 1s cubic-bezier(.2,0,0,1) both .45s',
              }}
            />
            <div
              style={{
                flex: '1',
                borderRadius: '9px',
                background: 'rgba(229,104,107,.55)',
                animation: 'ai-blip 2.4s ease-in-out infinite 1.4s',
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '14px',
            background: 'rgba(229,104,107,.08)',
            border: '1px solid rgba(229,104,107,.24)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '22px',
              letterSpacing: '-.7px',
              color: '#C4494C',
            }}
          >
            42 L
          </span>
          <span style={{ fontSize: '13.5px', lineHeight: '20px', color: '#5D5D5E' }}>
            unexplained, worth ₹3,820. AI attributes it below before anyone calls it theft.
          </span>
        </div>
        <div
          data-mcol3
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: '14px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(5,8,22,.07)',
          }}
        >
          <div style={{ padding: '16px 18px', borderRadius: '14px', background: '#F4F5FA' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '26px',
                letterSpacing: '-.9px',
              }}
            >
              38%
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>
              Mileage decay
            </div>
            <div
              style={{
                fontSize: '12px',
                lineHeight: '18px',
                color: '#5D5D5E',
                marginTop: '4px',
              }}
            >
              Six vehicles overdue for service
            </div>
          </div>
          <div style={{ padding: '16px 18px', borderRadius: '14px', background: '#F4F5FA' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '26px',
                letterSpacing: '-.9px',
              }}
            >
              34%
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>
              Route and load
            </div>
            <div
              style={{
                fontSize: '12px',
                lineHeight: '18px',
                color: '#5D5D5E',
                marginTop: '4px',
              }}
            >
              Ghat sections, heavier consignments
            </div>
          </div>
          <div
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              background: 'rgba(229,104,107,.07)',
              border: '1px solid rgba(229,104,107,.2)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '26px',
                letterSpacing: '-.9px',
                color: '#C4494C',
              }}
            >
              28%
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>
              Pattern, not physics
            </div>
            <div
              style={{
                fontSize: '12px',
                lineHeight: '18px',
                color: '#5D5D5E',
                marginTop: '4px',
              }}
            >
              Same lane, same fills, three weeks
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
