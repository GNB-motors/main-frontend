export default function ContractGapTable() {
  return (
    <div data-scroll-m>
      <div style={{ minWidth: '700px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px 1fr',
            gap: '18px',
            paddingBottom: '8px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '9.5px',
              fontWeight: '500',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: '#93939A',
            }}
          >
            What you agreed
          </div>
          <div
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '9.5px',
              fontWeight: '500',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: 'var(--nova-rage-600)',
            }}
          >
            AI reads the gap
          </div>
          <div
            style={{
              textAlign: 'right',
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '9.5px',
              fontWeight: '500',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: '#93939A',
            }}
          >
            What you are running
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px 1fr',
            alignItems: 'center',
            gap: '18px',
            padding: '15px 0',
            borderTop: '1px solid rgba(5,8,22,.07)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>Rate per trip</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              ₹46,200
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 13px',
                borderRadius: '999px',
                background: 'rgba(229,104,107,.1)',
                color: '#C4494C',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              −₹2,350
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              ₹43,850
            </span>
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>Rate per trip</span>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px 1fr',
            alignItems: 'center',
            gap: '18px',
            padding: '15px 0',
            borderTop: '1px solid rgba(5,8,22,.07)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>On-time delivery</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              97.0%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 13px',
                borderRadius: '999px',
                background: 'rgba(229,104,107,.1)',
                color: '#C4494C',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              −0.8 pt
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              96.2%
            </span>
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>On-time delivery</span>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px 1fr',
            alignItems: 'center',
            gap: '18px',
            padding: '15px 0',
            borderTop: '1px solid rgba(5,8,22,.07)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>Detention billed</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              ₹2.1L due
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 13px',
                borderRadius: '999px',
                background: 'rgba(229,104,107,.1)',
                color: '#C4494C',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              unbilled
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              ₹0 raised
            </span>
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>Detention billed</span>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px 1fr',
            alignItems: 'center',
            gap: '18px',
            padding: '15px 0',
            borderTop: '1px solid rgba(5,8,22,.07)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>Free hours at consignee</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              4 h
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 13px',
                borderRadius: '999px',
                background: 'rgba(229,104,107,.1)',
                color: '#C4494C',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              +2.4 h
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              6.4 h avg
            </span>
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>Free hours at consignee</span>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px 1fr',
            alignItems: 'center',
            gap: '18px',
            padding: '15px 0',
            borderTop: '1px solid rgba(5,8,22,.07)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>Volume commitment</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              120 trips
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 13px',
                borderRadius: '999px',
                background: 'rgba(24,122,50,.1)',
                color: '#187A32',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              +11
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#050816' }}>
              131 trips
            </span>
            <span style={{ fontSize: '13.5px', color: '#5D5D5E' }}>Volume commitment</span>
          </div>
        </div>
      </div>
    </div>
  );
}
