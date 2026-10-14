export default function PaperworkColumn() {
  return (
    <div style={{ padding: '32px 34px 30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '20px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--nova-rage-600)',
          }}
        >
          01
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '500',
            fontSize: '20px',
            letterSpacing: '-.4px',
          }}
        >
          What the paperwork says
        </span>
      </div>
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '500',
            padding: '5px 11px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.09)',
            color: 'var(--nova-rage-600)',
          }}
        >
          driver app
        </span>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '500',
            padding: '5px 11px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.09)',
            color: 'var(--nova-rage-600)',
          }}
        >
          web platform
        </span>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '500',
            padding: '5px 11px',
            borderRadius: '999px',
            background: 'rgba(68,105,240,.09)',
            color: 'var(--nova-rage-600)',
          }}
        >
          WhatsApp bot
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div
          style={{
            border: '1px solid rgba(5,8,22,.09)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <div style={{ background: '#0F1428', padding: '15px 14px 13px' }}>
            <div
              style={{
                fontFamily: 'var(--font-eyebrow)',
                fontSize: '9px',
                fontWeight: '500',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.5)',
              }}
            >
              Odometer photo
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '19px',
                letterSpacing: '1px',
                color: '#8FA6F5',
                marginTop: '9px',
              }}
            >
              184206
            </div>
          </div>
          <div
            style={{
              padding: '11px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              color: '#93939A',
            }}
          >
            18 Sep · 06:14 · verified
          </div>
        </div>
        <div
          style={{
            border: '1px solid rgba(5,8,22,.09)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <div style={{ background: '#F4F5FA', padding: '15px 14px 13px' }}>
            <div
              style={{
                fontFamily: 'var(--font-eyebrow)',
                fontSize: '9px',
                fontWeight: '500',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: '#93939A',
              }}
            >
              Fuel bill photo
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '19px',
                letterSpacing: '.5px',
                color: '#050816',
                marginTop: '9px',
              }}
            >
              198.0 L
            </div>
          </div>
          <div
            style={{
              padding: '11px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              color: '#93939A',
            }}
          >
            ₹18,216 · 2 fills
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: '22px',
          paddingTop: '18px',
          borderTop: '1px solid rgba(5,8,22,.09)',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>Full tank → full tank</span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '26px',
            letterSpacing: '-.9px',
          }}
        >
          4.0{' '}
          <span
            style={{
              fontSize: '14px',
              fontWeight: '400',
              color: '#93939A',
              letterSpacing: '0',
            }}
          >
            km/l
          </span>
        </span>
      </div>
    </div>
  );
}
