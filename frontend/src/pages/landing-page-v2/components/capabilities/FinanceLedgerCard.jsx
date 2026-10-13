export default function FinanceLedgerCard() {
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
            padding: '28px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                flex: '1',
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-eyebrow)',
                  fontSize: '9px',
                  fontWeight: '500',
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.45)',
                }}
              >
                Revenue
              </div>
              <div
                data-fin="Revenue"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '26px',
                  letterSpacing: '-.9px',
                  color: '#FFFFFF',
                  marginTop: '9px',
                }}
              >
                ₹48.2L
              </div>
            </div>
            <div
              style={{
                flex: '1',
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'rgba(68,105,240,.14)',
                border: '1px solid rgba(129,150,255,.28)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-eyebrow)',
                  fontSize: '9px',
                  fontWeight: '500',
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.55)',
                }}
              >
                Profitability
              </div>
              <div
                data-fin="Profit"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '26px',
                  letterSpacing: '-.9px',
                  color: '#9FB4FF',
                  marginTop: '9px',
                }}
              >
                12.4%
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', height: '96px' }}>
            <svg
              viewBox="0 0 330 96"
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%' }}
            >
              <defs>
                <linearGradient id="capFin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(110,139,255,.42)" />
                  <stop offset="1" stopColor="rgba(110,139,255,0)" />
                </linearGradient>
              </defs>
              <path
                d="M0 78 L34 70 L68 74 L102 58 L136 62 L170 44 L204 50 L238 34 L272 30 L306 20 L330 14 L330 96 L0 96 Z"
                fill="url(#capFin)"
                style={{ animation: 'cap-fade 1.4s cubic-bezier(.2,0,0,1) both .5s' }}
              />
              <path
                d="M0 78 L34 70 L68 74 L102 58 L136 62 L170 44 L204 50 L238 34 L272 30 L306 20 L330 14"
                fill="none"
                stroke="#8FA6FF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="420"
                style={{ animation: 'cap-draw 7s cubic-bezier(.2,0,0,1) infinite' }}
              />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ flex: '0 0 84px', fontSize: '12px', color: 'rgba(255,255,255,.55)' }}>
                Expenses
              </span>
              <span
                style={{
                  flex: '1',
                  height: '5px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,.07)',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: '78%',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,.42)',
                    transformOrigin: 'left',
                    animation: 'cap-bar 1.2s cubic-bezier(.2,0,0,1) both 0.30s',
                  }}
                />
              </span>
              <span
                data-fin="Expenses"
                style={{
                  flex: '0 0 auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  color: 'rgba(255,255,255,.8)',
                }}
              >
                ₹42.3L
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ flex: '0 0 84px', fontSize: '12px', color: 'rgba(255,255,255,.55)' }}>
                GST
              </span>
              <span
                style={{
                  flex: '1',
                  height: '5px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,.07)',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: '34%',
                    borderRadius: '999px',
                    background: 'rgba(110,139,255,.75)',
                    transformOrigin: 'left',
                    animation: 'cap-bar 1.2s cubic-bezier(.2,0,0,1) both 0.45s',
                  }}
                />
              </span>
              <span
                data-fin="GST"
                style={{
                  flex: '0 0 auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  color: 'rgba(255,255,255,.8)',
                }}
              >
                ₹3.1L
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ flex: '0 0 84px', fontSize: '12px', color: 'rgba(255,255,255,.55)' }}>
                Outstanding
              </span>
              <span
                style={{
                  flex: '1',
                  height: '5px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,.07)',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: '52%',
                    borderRadius: '999px',
                    background: 'rgba(229,104,107,.7)',
                    transformOrigin: 'left',
                    animation: 'cap-bar 1.2s cubic-bezier(.2,0,0,1) both 0.60s',
                  }}
                />
              </span>
              <span
                data-fin="Outstanding"
                style={{
                  flex: '0 0 auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  color: 'rgba(255,255,255,.8)',
                }}
              >
                ₹8.7L
              </span>
            </div>
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
          Finance and ledger
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
          Track fleet finances, expenses, GST and ledger activity with complete operational
          visibility.
        </div>
      </div>
    </article>
  );
}
