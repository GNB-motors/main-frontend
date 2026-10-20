export default function DriverWatchlist() {
  return (
    <div
      data-scroll-m
      data-reveal
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(5,8,22,.07)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(5,8,22,.07)',
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
          Driver watchlist · this week
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          ranked by risk
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 92px 1.6fr 1.1fr',
          gap: '20px',
          padding: '13px 24px',
          background: '#F4F5FA',
          fontFamily: 'var(--font-eyebrow)',
          fontSize: '9.5px',
          fontWeight: '500',
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: '#93939A',
          minWidth: '640px',
        }}
      >
        <span>Driver</span>
        <span>Risk</span>
        <span>What AI saw</span>
        <span>Next action</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 92px 1.6fr 1.1fr',
          gap: '20px',
          alignItems: 'center',
          padding: '20px 24px',
          borderTop: '1px solid rgba(5,8,22,.05)',
          minWidth: '640px',
        }}
      >
        <span>
          <span
            style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '600',
              letterSpacing: '-.15px',
            }}
          >
            A. Singh
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#93939A',
              marginTop: '3px',
            }}
          >
            MH-04-JN-8834
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '20px',
              letterSpacing: '-.6px',
              color: '#E5686B',
            }}
          >
            74
          </span>
          <span
            style={{
              flex: '1',
              height: '4px',
              borderRadius: '999px',
              background: 'rgba(5,8,22,.08)',
            }}
          >
            <span
              style={{
                display: 'block',
                height: '100%',
                width: '74%',
                borderRadius: '999px',
                background: '#E5686B',
              }}
            />
          </span>
        </span>
        <span style={{ fontSize: '14px', lineHeight: '21px', color: '#5D5D5E' }}>
          Licence expires in 11 days, medical not booked
        </span>
        <a href="#ai" style={{ fontSize: '13.5px', fontWeight: '600' }}>
          Reminder sent, escalate Friday →
        </a>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 92px 1.6fr 1.1fr',
          gap: '20px',
          alignItems: 'center',
          padding: '20px 24px',
          borderTop: '1px solid rgba(5,8,22,.05)',
          minWidth: '640px',
        }}
      >
        <span>
          <span
            style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '600',
              letterSpacing: '-.15px',
            }}
          >
            R. Kumar
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#93939A',
              marginTop: '3px',
            }}
          >
            MH-40-BX-2291
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '20px',
              letterSpacing: '-.6px',
              color: '#E5686B',
            }}
          >
            68
          </span>
          <span
            style={{
              flex: '1',
              height: '4px',
              borderRadius: '999px',
              background: 'rgba(5,8,22,.08)',
            }}
          >
            <span
              style={{
                display: 'block',
                height: '100%',
                width: '68%',
                borderRadius: '999px',
                background: '#E5686B',
              }}
            />
          </span>
        </span>
        <span style={{ fontSize: '14px', lineHeight: '21px', color: '#5D5D5E' }}>
          Projected 62 duty hours by Friday, above threshold
        </span>
        <a href="#ai" style={{ fontSize: '13.5px', fontWeight: '600' }}>
          Rebalance the roster →
        </a>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 92px 1.6fr 1.1fr',
          gap: '20px',
          alignItems: 'center',
          padding: '20px 24px',
          borderTop: '1px solid rgba(5,8,22,.05)',
          minWidth: '640px',
        }}
      >
        <span>
          <span
            style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '600',
              letterSpacing: '-.15px',
            }}
          >
            S. Yadav
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#93939A',
              marginTop: '3px',
            }}
          >
            MH-46-C-8890
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '20px',
              letterSpacing: '-.6px',
              color: '#187A32',
            }}
          >
            22
          </span>
          <span
            style={{
              flex: '1',
              height: '4px',
              borderRadius: '999px',
              background: 'rgba(5,8,22,.08)',
            }}
          >
            <span
              style={{
                display: 'block',
                height: '100%',
                width: '22%',
                borderRadius: '999px',
                background: '#187A32',
              }}
            />
          </span>
        </span>
        <span style={{ fontSize: '14px', lineHeight: '21px', color: '#5D5D5E' }}>
          Lowest harsh-braking rate on night lanes, 90 days
        </span>
        <a href="#ai" style={{ fontSize: '13.5px', fontWeight: '600' }}>
          Assign the Surat night run →
        </a>
      </div>
    </div>
  );
}
