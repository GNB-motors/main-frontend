export default function LitresBilledChart() {
  return (
    <div
      style={{
        padding: '30px 34px 34px',
        borderTop: '1px solid rgba(5,8,22,.08)',
        background: '#FCFCFD',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#050816',
          }}
        >
          Litres billed against litres burned
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          scale 0 – 198 L
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
        <span style={{ flex: '0 0 168px', fontSize: '13px', color: '#5D5D5E' }}>
          Billed on fuel slips
        </span>
        <span
          style={{
            flex: '1',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(68,105,240,.42)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            transformOrigin: 'left',
            animation: 'ai-bar 900ms cubic-bezier(.2,0,0,1) both .1s',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: '#FFFFFF' }}>
            198.0 L
          </span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ flex: '0 0 168px', fontSize: '13px', color: '#5D5D5E' }}>
          Burned per tank sensor
        </span>
        <span style={{ flex: '1', display: 'flex', gap: '5px', height: '38px' }}>
          <span
            style={{
              flex: '0 0 87%',
              borderRadius: '10px',
              background: 'rgba(68,105,240,.20)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              transformOrigin: 'left',
              animation: 'ai-bar 900ms cubic-bezier(.2,0,0,1) both .35s',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: '#213EA7' }}>
              172.4 L
            </span>
          </span>
          <span
            style={{
              flex: '1',
              borderRadius: '10px',
              border: '1px solid rgba(229,104,107,.45)',
              background:
                'repeating-linear-gradient(135deg, rgba(229,104,107,.30) 0 5px, rgba(229,104,107,.10) 5px 10px)',
              animation: 'ai-blip 2.6s ease-in-out infinite 1.4s',
            }}
          />
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginTop: '9px' }}>
        <span style={{ flex: '0 0 168px' }} />
        <span style={{ flex: '1', display: 'flex' }}>
          <span style={{ flex: '0 0 87%' }} />
          <span
            style={{
              flex: '1',
              paddingTop: '2px',
              borderTop: '1px solid rgba(229,104,107,.45)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#C4494C',
                marginTop: '5px',
              }}
            >
              the gap
            </span>
          </span>
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          flexWrap: 'wrap',
          marginTop: '24px',
          padding: '18px 22px',
          borderRadius: '16px',
          background: 'rgba(229,104,107,.07)',
          border: '1px solid rgba(229,104,107,.24)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '30px',
              letterSpacing: '-1.1px',
              color: '#C4494C',
            }}
          >
            25.6 L
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#5D5D5E' }}>
            13 % · ₹2,340
          </span>
        </span>
        <span
          style={{
            flex: '1',
            minWidth: '260px',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#050816',
            textWrap: 'pretty',
          }}
        >
          Bought and billed, never burned. Two records captured on separate rails, so neither one
          can be edited to agree with the other.
        </span>
        <span
          style={{
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#FFFFFF',
            background: 'var(--nova-rage-400)',
            border: '1px solid var(--nova-rage-800)',
            borderRadius: '8px',
            padding: '10px 18px',
            whiteSpace: 'nowrap',
          }}
        >
          Fuel audit raised
        </span>
      </div>
    </div>
  );
}
