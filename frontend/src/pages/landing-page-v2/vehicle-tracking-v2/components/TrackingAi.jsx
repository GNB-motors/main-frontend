import TrackingAnomalyTimeline from './tracking-ai/TrackingAnomalyTimeline.jsx';
import TrackingInsightFeed from './tracking-ai/TrackingInsightFeed.jsx';

export default function TrackingAi() {
  return (
    <section
      id="ai"
      data-screen-label="Tracking AI"
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
              AI watching the map{' '}
              <span style={{ color: 'var(--nova-rage-400)' }}>so nobody has to.</span>
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
            Tracking writes a ping every thirty seconds. AI turns that stream into deviations, dwell
            patterns and arrival times you can commit to in front of a client.
          </p>
        </div>
        <TrackingAnomalyTimeline />
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
          <span>GPS ping every 30 s</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>Route and halt history</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>Deviation and idling models</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>Where time is lost</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>Daily movement summary</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>Route and stop changes</span>
          <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
          <span>Dispatcher acts on it</span>
        </div>
        <TrackingInsightFeed />
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
            Unscheduled halt detection
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
            Predicted ETA on every trip
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
            Geofence tuning from history
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
            Weekly movement report
          </span>
        </div>
      </div>
    </section>
  );
}
