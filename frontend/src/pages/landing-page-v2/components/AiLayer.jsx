import AiPipeline from './ai-layer/AiPipeline.jsx';
import AiSmartAlertCard from './ai-layer/AiSmartAlertCard.jsx';
import AiTrendCard from './ai-layer/AiTrendCard.jsx';
import AiRecommendationCard from './ai-layer/AiRecommendationCard.jsx';

export default function AiLayer() {
  return (
    <section
      id="ai"
      data-screen-label="AI layer"
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
              AI that reads every kilometre{' '}
              <span style={{ color: 'var(--nova-rage-400)' }}>and tells you what to do next.</span>
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
            Every vehicle writes to GNB Edge continuously: GPS pings, trip costs, fuel fills, driver
            hours, invoices. AI works on that record to surface what changed, what it will cost you,
            and what to do about it.
          </p>
        </div>
        <AiPipeline />
        <div
          data-reveal
          data-ai-legend
          style={{
            display: 'flex',
            gap: '0',
            marginBottom: '56px',
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#93939A',
          }}
        >
          <span style={{ flex: '2 1 0', textAlign: 'center' }}>Collect</span>
          <span style={{ flex: '2 1 0', textAlign: 'center' }}>Analyse</span>
          <span style={{ flex: '3 1 0', textAlign: 'center' }}>Act</span>
        </div>
        <div
          data-reveal-group
          data-mcol3
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: '20px',
            alignItems: 'stretch',
          }}
        >
          <AiSmartAlertCard />
          <AiTrendCard />
          <AiRecommendationCard />
        </div>
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
            Daily fleet digest at 07:00
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
            Exception alerts in real time
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
            Monthly P&L pack on the 1st
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
            Auto-drafted client updates
          </span>
        </div>
      </div>
    </section>
  );
}
