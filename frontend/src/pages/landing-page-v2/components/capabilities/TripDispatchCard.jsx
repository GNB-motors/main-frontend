export default function TripDispatchCard() {
  return (
    <article
      data-card
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '566px',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, #182042 0%, #10152C 100%)',
        border: '1px solid rgba(129,150,255,.16)',
        overflow: 'hidden',
        boxShadow: '0 18px 50px rgba(3,6,18,.45)',
        transition:
          'transform 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1)',
      }}
    >
      <div
        style={{
          position: 'relative',
          flex: '1',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #182042 0%, #10152C 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background:
              'radial-gradient(420px 240px at 50% 0%, rgba(68,105,240,.22), transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '0',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(circle at 50% 40%, #000, transparent 78%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '0',
            padding: '30px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '11px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '43px',
              top: '56px',
              bottom: '56px',
              width: '1px',
              background:
                'linear-gradient(180deg, rgba(129,150,255,.05), rgba(129,150,255,.42), rgba(129,150,255,.05))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '40px',
              top: '56px',
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: '#8FA6FF',
              boxShadow: '0 0 12px rgba(143,166,255,.9)',
              animation: 'cap-spine 4.6s cubic-bezier(.2,0,0,1) infinite',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                position: 'relative',
                flex: '0 0 auto',
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.12)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,.5)',
              }}
            >
              1
            </span>
            <span
              style={{
                flex: '1',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 15px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,.035)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,.8)' }}>
                Trip created
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: 'rgba(255,255,255,.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                GNB/2026/04817
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                position: 'relative',
                flex: '0 0 auto',
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                background: 'linear-gradient(150deg,#4469F0,#2B3FA8)',
                border: '1px solid rgba(146,168,255,.6)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#FFFFFF',
              }}
            >
              2
              <span
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '16px',
                  border: '1px solid rgba(124,151,255,.5)',
                  animation: 'cap-ring 2.8s ease-out infinite',
                }}
              />
            </span>
            <span
              style={{
                flex: '1',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 15px',
                borderRadius: '12px',
                background: 'rgba(68,105,240,.16)',
                border: '1px solid rgba(129,150,255,.34)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#FFFFFF' }}>
                AI assignment
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: 'rgba(255,255,255,.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                scoring 6 vehicles
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                position: 'relative',
                flex: '0 0 auto',
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.12)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,.5)',
              }}
            >
              3
            </span>
            <span
              style={{
                flex: '1',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 15px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,.035)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,.8)' }}>
                Vehicle matched
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: 'rgba(255,255,255,.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                MH-40-BX-2291
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                position: 'relative',
                flex: '0 0 auto',
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.12)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,.5)',
              }}
            >
              4
            </span>
            <span
              style={{
                flex: '1',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 15px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,.035)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,.8)' }}>
                Driver assigned
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: 'rgba(255,255,255,.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                R. Kumar · 4.8
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                position: 'relative',
                flex: '0 0 auto',
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.12)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,.5)',
              }}
            >
              5
            </span>
            <span
              style={{
                flex: '1',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 15px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,.035)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,.8)' }}>
                Active trip
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: 'rgba(255,255,255,.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                Mumbai → Nagpur
              </span>
            </span>
          </div>
        </div>
      </div>
      <div
        data-card-body
        style={{
          minHeight: '176px',
          boxSizing: 'border-box',
          padding: '26px 28px 30px',
          borderTop: '1px solid rgba(255,255,255,.07)',
        }}
      >
        <div
          data-card-title
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '500',
            fontSize: '22px',
            letterSpacing: '-.5px',
            color: '#FFFFFF',
          }}
        >
          Trip and dispatch
        </div>
        <div
          data-card-desc
          style={{
            fontSize: '14.5px',
            lineHeight: '23px',
            color: 'rgba(255,255,255,.6)',
            marginTop: '10px',
            textWrap: 'pretty',
          }}
        >
          Plan, assign, track and close trips with intelligent dispatch and real-time operational
          visibility.
        </div>
      </div>
    </article>
  );
}
