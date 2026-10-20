import EnterpriseArchitectureHighlights from './customer-architecture/EnterpriseArchitectureHighlights.jsx';
import EnterpriseChannelsLayer from './customer-architecture/EnterpriseChannelsLayer.jsx';
import EnterpriseChannelLinks from './customer-architecture/EnterpriseChannelLinks.jsx';
import EnterpriseConfigurationLayer from './customer-architecture/EnterpriseConfigurationLayer.jsx';
import EnterpriseConfigurationLinks from './customer-architecture/EnterpriseConfigurationLinks.jsx';
import EnterpriseModuleShelf from './customer-architecture/EnterpriseModuleShelf.jsx';

export default function CustomerArchitecture() {
  return (
    <section
      data-screen-label="Customer architecture"
      style={{ background: '#FFFFFF', padding: '112px 40px' }}
    >
      <div data-reveal style={{ maxWidth: '900px', margin: '0 auto 64px', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '11px',
            fontWeight: '500',
            letterSpacing: '.44em',
            textTransform: 'uppercase',
            color: 'var(--nova-rage-600)',
            marginBottom: '20px',
          }}
        >
          System architecture
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
          Configured around your operation,{' '}
          <span style={{ color: 'var(--nova-rage-400)' }}>not the other way round.</span>
        </h2>
      </div>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <EnterpriseArchitectureHighlights />
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <EnterpriseChannelsLayer />
          <EnterpriseChannelLinks />
          <EnterpriseConfigurationLayer />
          <EnterpriseConfigurationLinks />
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.18)',
              borderRadius: '20px',
              padding: '22px 24px 24px',
              boxShadow: 'var(--shadow-xs)',
              animation: 'ly-225 8s cubic-bezier(.2,0,0,1) infinite both',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '14px',
                flexWrap: 'wrap',
                marginBottom: '16px',
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
                Layer 3 · Your module shelf
              </div>
              <div style={{ fontSize: '13px', color: '#93939A', letterSpacing: '-.1px' }}>
                Switch on only what this entity needs
              </div>
            </div>
            <EnterpriseModuleShelf />
          </div>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              width: '100%',
              height: '64px',
              display: 'block',
              transformOrigin: 'top',
              overflow: 'visible',
              animation: 'cd-350 8s cubic-bezier(.2,0,0,1) infinite both',
            }}
          >
            <path
              d="M14 2 C14 48 50 52 50 98"
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke="#4469F0"
              strokeOpacity=".22"
              strokeWidth="1.2"
            />
            <path
              d="M38 2 C38 48 50 52 50 98"
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke="#4469F0"
              strokeOpacity=".22"
              strokeWidth="1.2"
            />
            <path
              d="M62 2 C62 48 50 52 50 98"
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke="#4469F0"
              strokeOpacity=".22"
              strokeWidth="1.2"
            />
            <path
              d="M86 2 C86 48 50 52 50 98"
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke="#4469F0"
              strokeOpacity=".22"
              strokeWidth="1.2"
            />
            <path
              d="M14 2 C14 48 50 52 50 98"
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke="#4469F0"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="6 194"
              style={{ animation: 'arch-flow 2.6s linear infinite 3.90s' }}
            />
            <path
              d="M38 2 C38 48 50 52 50 98"
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke="#6366F1"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="6 194"
              style={{ animation: 'arch-flow 2.6s linear infinite 4.20s' }}
            />
            <path
              d="M62 2 C62 48 50 52 50 98"
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke="#4469F0"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="6 194"
              style={{ animation: 'arch-flow 2.6s linear infinite 4.50s' }}
            />
            <path
              d="M86 2 C86 48 50 52 50 98"
              fill="none"
              vectorEffect="non-scaling-stroke"
              stroke="#6366F1"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="6 194"
              style={{ animation: 'arch-flow 2.6s linear infinite 4.80s' }}
            />
          </svg>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              animation: 'co-420 8s cubic-bezier(.2,0,0,1) infinite both',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                padding: '20px 34px 20px 24px',
                borderRadius: '22px',
                background: 'linear-gradient(150deg, #4469F0 0%, #213EA7 100%)',
                animation: 'cg-420 8s cubic-bezier(.2,0,0,1) infinite both',
              }}
            >
              <div
                data-hide-m
                style={{
                  position: 'absolute',
                  inset: '-14%',
                  borderRadius: '999px',
                  background: 'radial-gradient(circle, rgba(68,105,240,.34), transparent 68%)',
                  pointerEvents: 'none',
                  animation: 'ch-420 8s cubic-bezier(.2,0,0,1) infinite both',
                }}
              />
              <span
                style={{
                  position: 'relative',
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,.16)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '20px',
                  color: '#FFFFFF',
                  letterSpacing: '-1px',
                }}
              >
                G
              </span>
              <span style={{ position: 'relative' }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '500',
                    fontSize: '19px',
                    color: '#FFFFFF',
                    letterSpacing: '-.4px',
                  }}
                >
                  GNB Edge core
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: 'rgba(255,255,255,.76)',
                    marginTop: '4px',
                  }}
                >
                  One record, one audit trail, every entity
                </span>
              </span>
            </div>
          </div>
        </div>
        <p
          style={{
            maxWidth: '820px',
            margin: '56px auto 0',
            textAlign: 'center',
            fontSize: '17px',
            lineHeight: '28px',
            color: '#5D5D5E',
            textWrap: 'pretty',
          }}
        >
          No two enterprise fleets are set up the same way, so nothing here ships as a fixed
          template. Your fields, roles, approval rules, rate logic and reports are configured with
          your team, and each entity switches on only the modules it needs. Everything still writes
          to one record with one audit trail.
        </p>
      </div>
    </section>
  );
}
