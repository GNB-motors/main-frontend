import OwnerDailySummary from './owner-ai/OwnerDailySummary.jsx';
import OwnerInsights from './owner-ai/OwnerInsights.jsx';

export default function OwnerAi() {
  return (
    <section
      id="ai"
      data-screen-label="Owner AI"
      style={{
        position: 'relative',
        background: '#F1F4FE',
        padding: '112px 40px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0',
          background:
            'radial-gradient(900px 420px at 78% 0%, rgba(68,105,240,.12), transparent 66%)',
        }}
      />
      <div style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto' }}>
        <div
          data-reveal
          data-mcol
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'end',
            marginBottom: '56px',
          }}
        >
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-eyebrow)',
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '.44em',
                  textTransform: 'uppercase',
                  color: 'var(--nova-rage-600)',
                }}
              >
                AI intelligence
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  background: 'rgba(68,105,240,.10)',
                  border: '1px solid rgba(68,105,240,.22)',
                  color: '#4469F0',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flex: '0 0 auto' }}
                >
                  <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                  <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
                </svg>
                <span
                  style={{
                    fontFamily: 'var(--font-eyebrow)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '.16em',
                    textTransform: 'uppercase',
                    color: 'var(--nova-rage-600)',
                  }}
                >
                  AI native
                </span>
              </span>
            </div>
            <h2
              data-mhead
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '44px',
                lineHeight: '1.08',
                letterSpacing: '-1.5px',
                margin: '0',
                textWrap: 'pretty',
              }}
            >
              The analyst you cannot afford,{' '}
              <span style={{ color: 'var(--nova-rage-400)' }}>running on your own data.</span>
            </h2>
          </div>
          <p
            style={{
              fontSize: '18px',
              lineHeight: '29px',
              color: '#5D5D5E',
              margin: '0',
              textWrap: 'pretty',
            }}
          >
            You do not have a back office to read reports. AI reads them for you and sends the three
            things that matter, in plain language, before the day starts.
          </p>
        </div>
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
              Your data, once a day
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
              3 vehicles · summary at 07:00
            </div>
          </div>
          <OwnerDailySummary />
        </div>
        <div
          data-reveal
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '56px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#93939A',
          }}
        >
          <span>Your trips and fills</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>Kept for every vehicle</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>Simple pattern checks</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>Plain language findings</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>One summary a day</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>What to fix today</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>You act, from the phone</span>
        </div>
        <OwnerInsights />
        <div
          data-reveal
          style={{
            marginTop: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '10px',
              fontWeight: '500',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: '#93939A',
              marginRight: '4px',
            }}
          >
            Runs automatically
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 15px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.18)',
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              color: '#050816',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--nova-rage-400)',
              }}
            />
            Daily summary at 07:00
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 15px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.18)',
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              color: '#050816',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--nova-rage-400)',
              }}
            />
            Mileage drop alerts
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 15px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.18)',
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              color: '#050816',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--nova-rage-400)',
              }}
            />
            Service and document reminders
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 15px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.18)',
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '-.1px',
              color: '#050816',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--nova-rage-400)',
              }}
            />
            Month-end profit view
          </span>
        </div>
      </div>
    </section>
  );
}
