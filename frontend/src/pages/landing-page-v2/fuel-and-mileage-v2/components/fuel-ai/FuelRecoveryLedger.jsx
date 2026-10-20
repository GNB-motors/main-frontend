export default function FuelRecoveryLedger() {
  return (
    <div
      data-mcol
      data-reveal
      style={{
        display: 'grid',
        gridTemplateColumns: '1.55fr .95fr',
        gap: '20px',
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(5,8,22,.07)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          padding: '28px 30px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '22px',
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
            Recovery ledger · what AI found this month
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
            30 days
          </span>
        </div>
        <div
          data-mcol2
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px',
            gap: '20px',
            alignItems: 'baseline',
            padding: '17px 0',
            borderTop: '1px solid rgba(5,8,22,.06)',
          }}
        >
          <span>
            <span
              style={{
                display: 'block',
                fontSize: '15.5px',
                fontWeight: '500',
                letterSpacing: '-.15px',
              }}
            >
              Unexplained fuel on MH-46-C-8890
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '13px',
                lineHeight: '20px',
                color: '#93939A',
                marginTop: '4px',
              }}
            >
              Two fills, no matching distance. Third week in a row.
            </span>
          </span>
          <span style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '22px',
                letterSpacing: '-.7px',
              }}
            >
              ₹3,820
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#93939A',
                marginTop: '4px',
              }}
            >
              audit raised
            </span>
          </span>
        </div>
        <div
          data-mcol2
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px',
            gap: '20px',
            alignItems: 'baseline',
            padding: '17px 0',
            borderTop: '1px solid rgba(5,8,22,.06)',
          }}
        >
          <span>
            <span
              style={{
                display: 'block',
                fontSize: '15.5px',
                fontWeight: '500',
                letterSpacing: '-.15px',
              }}
            >
              Mileage decay across six vehicles
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '13px',
                lineHeight: '20px',
                color: '#93939A',
                marginTop: '4px',
              }}
            >
              Trending to 3.1 km/L by November unless serviced.
            </span>
          </span>
          <span style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '22px',
                letterSpacing: '-.7px',
              }}
            >
              ₹41,200
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#93939A',
                marginTop: '4px',
              }}
            >
              per quarter
            </span>
          </span>
        </div>
        <div
          data-mcol2
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px',
            gap: '20px',
            alignItems: 'baseline',
            padding: '17px 0',
            borderTop: '1px solid rgba(5,8,22,.06)',
          }}
        >
          <span>
            <span
              style={{
                display: 'block',
                fontSize: '15.5px',
                fontWeight: '500',
                letterSpacing: '-.15px',
              }}
            >
              Refuel point switched to Talegaon
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '13px',
                lineHeight: '20px',
                color: '#93939A',
                marginTop: '4px',
              }}
            >
              ₹2.70 per litre cheaper on the same route, no detour.
            </span>
          </span>
          <span style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '22px',
                letterSpacing: '-.7px',
              }}
            >
              ₹31,000
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#93939A',
                marginTop: '4px',
              }}
            >
              per quarter
            </span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '20px',
            paddingTop: '20px',
            marginTop: '6px',
            borderTop: '2px solid rgba(5,8,22,.12)',
          }}
        >
          <span style={{ fontSize: '15.5px', fontWeight: '600' }}>Recoverable, annualised</span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '30px',
              letterSpacing: '-1.1px',
              color: 'var(--nova-rage-600)',
            }}
          >
            ₹2.93L
          </span>
        </div>
      </div>
      <div
        style={{
          background: 'linear-gradient(150deg, #2F58EE 0%, #213EA7 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '30px',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '10px',
              fontWeight: '500',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.7)',
            }}
          >
            Variance report
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '32px',
              letterSpacing: '-1.2px',
              marginTop: '16px',
              lineHeight: '1.12',
            }}
          >
            Written on the 1st, before anyone asks
          </div>
          <div
            style={{
              fontSize: '15px',
              lineHeight: '24px',
              color: 'rgba(255,255,255,.82)',
              marginTop: '14px',
            }}
          >
            Every line above arrives as a report with the fills, distances and vehicles behind it
            attached.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '28px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'rgba(255,255,255,.78)',
          }}
        >
          conf 0.86 · 1,240 fills analysed
        </div>
      </div>
    </div>
  );
}
