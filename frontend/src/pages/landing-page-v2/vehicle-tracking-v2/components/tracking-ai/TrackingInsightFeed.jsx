export default function TrackingInsightFeed() {
  return (
    <div
      data-reveal-group
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: '#4469F0',
              animation: 'ai-blip 2s ease-in-out infinite',
            }}
          />
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
            Live insight feed
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          today · 3 open
        </span>
      </div>
      <div data-scroll-m>
        <div style={{ minWidth: '760px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '74px 148px 1fr 190px 62px',
              alignItems: 'center',
              gap: '20px',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(5,8,22,.05)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#93939A' }}>
              14:22
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                fontFamily: 'var(--font-eyebrow)',
                fontSize: '10px',
                fontWeight: '500',
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: '#5D5D5E',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: '#E5686B',
                  flex: '0 0 auto',
                }}
              />
              Smart alert
            </span>
            <span>
              <span
                style={{
                  display: 'block',
                  fontSize: '15.5px',
                  fontWeight: '500',
                  letterSpacing: '-.15px',
                  color: '#050816',
                }}
              >
                MH-12-AB-4471 idling 47 minutes at Bhiwandi
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '13px',
                  lineHeight: '20px',
                  color: '#93939A',
                  marginTop: '3px',
                }}
              >
                No scheduled stop, ₹340 of diesel burned
              </span>
            </span>
            <a href="#ai" style={{ fontSize: '13.5px', fontWeight: '600' }}>
              Call the driver →
            </a>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#93939A',
                textAlign: 'right',
              }}
            >
              0.94
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '74px 148px 1fr 190px 62px',
              alignItems: 'center',
              gap: '20px',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(5,8,22,.05)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#93939A' }}>
              14:05
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                fontFamily: 'var(--font-eyebrow)',
                fontSize: '10px',
                fontWeight: '500',
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: '#5D5D5E',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: '#4469F0',
                  flex: '0 0 auto',
                }}
              />
              Prediction
            </span>
            <span>
              <span
                style={{
                  display: 'block',
                  fontSize: '15.5px',
                  fontWeight: '500',
                  letterSpacing: '-.15px',
                  color: '#050816',
                }}
              >
                Nagpur run arriving 18:42, 42 minutes past window
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '13px',
                  lineHeight: '20px',
                  color: '#93939A',
                  marginTop: '3px',
                }}
              >
                Live speed plus eleven past runs on this lane
              </span>
            </span>
            <a href="#ai" style={{ fontSize: '13.5px', fontWeight: '600' }}>
              Notify the client →
            </a>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#93939A',
                textAlign: 'right',
              }}
            >
              0.88
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '74px 148px 1fr 190px 62px',
              alignItems: 'center',
              gap: '20px',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(5,8,22,.05)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#93939A' }}>
              09:40
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                fontFamily: 'var(--font-eyebrow)',
                fontSize: '10px',
                fontWeight: '500',
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: '#5D5D5E',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: '#187A32',
                  flex: '0 0 auto',
                }}
              />
              Recommendation
            </span>
            <span>
              <span
                style={{
                  display: 'block',
                  fontSize: '15.5px',
                  fontWeight: '500',
                  letterSpacing: '-.15px',
                  color: '#050816',
                }}
              >
                Route the Wardha leg via NH-44
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '13px',
                  lineHeight: '20px',
                  color: '#93939A',
                  marginTop: '3px',
                }}
              >
                Saves 38 minutes on twelve weekly runs at the same fuel cost
              </span>
            </span>
            <a href="#ai" style={{ fontSize: '13.5px', fontWeight: '600' }}>
              Apply to the lane →
            </a>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#93939A',
                textAlign: 'right',
              }}
            >
              0.82
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
