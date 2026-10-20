import OwnerArchitectureHighlights from './customer-architecture/OwnerArchitectureHighlights.jsx';
import OwnerFieldChannels from './customer-architecture/OwnerFieldChannels.jsx';
import OwnerModuleStack from './customer-architecture/OwnerModuleStack.jsx';

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
          The same platform the big fleets run,{' '}
          <span style={{ color: 'var(--nova-rage-400)' }}>sized for one owner.</span>
        </h2>
      </div>
      <div data-reveal style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <OwnerArchitectureHighlights />
        <div
          data-flow
          style={{
            display: 'grid',
            gridTemplateColumns: '.95fr .34fr 1.55fr .3fr .52fr',
            alignItems: 'center',
            gap: '0',
          }}
        >
          <OwnerFieldChannels />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '230px', display: 'block' }}
          >
            <path
              d="M2 18 C40 18 58 50 98 50"
              fill="none"
              stroke="#4469F0"
              strokeOpacity=".26"
              strokeWidth="1.2"
            />
            <path
              d="M2 34 C40 34 58 50 98 50"
              fill="none"
              stroke="#6366F1"
              strokeOpacity=".26"
              strokeWidth="1.2"
            />
            <path
              d="M2 50 L98 50"
              fill="none"
              stroke="#2F58EE"
              strokeOpacity=".26"
              strokeWidth="1.2"
            />
            <path
              d="M2 66 C40 66 58 50 98 50"
              fill="none"
              stroke="#6366F1"
              strokeOpacity=".26"
              strokeWidth="1.2"
            />
            <path
              d="M2 82 C40 82 58 50 98 50"
              fill="none"
              stroke="#4469F0"
              strokeOpacity=".26"
              strokeWidth="1.2"
            />
            <path
              d="M2 18 C40 18 58 50 98 50"
              fill="none"
              stroke="#4469F0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 188"
              style={{ animation: 'arch-flow 2.8s linear infinite 0s' }}
            />
            <path
              d="M2 34 C40 34 58 50 98 50"
              fill="none"
              stroke="#6366F1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 188"
              style={{ animation: 'arch-flow 2.8s linear infinite 0.35s' }}
            />
            <path
              d="M2 50 L98 50"
              fill="none"
              stroke="#2F58EE"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 188"
              style={{ animation: 'arch-flow 2.8s linear infinite 0.7s' }}
            />
            <path
              d="M2 66 C40 66 58 50 98 50"
              fill="none"
              stroke="#6366F1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 188"
              style={{ animation: 'arch-flow 2.8s linear infinite 1.05s' }}
            />
            <path
              d="M2 82 C40 82 58 50 98 50"
              fill="none"
              stroke="#4469F0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 188"
              style={{ animation: 'arch-flow 2.8s linear infinite 1.4s' }}
            />
          </svg>
          <OwnerModuleStack />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '180px', display: 'block' }}
          >
            <path
              d="M2 30 C40 30 60 50 98 50"
              fill="none"
              stroke="#4469F0"
              strokeOpacity=".26"
              strokeWidth="1.2"
            />
            <path
              d="M2 50 L98 50"
              fill="none"
              stroke="#2F58EE"
              strokeOpacity=".26"
              strokeWidth="1.2"
            />
            <path
              d="M2 70 C40 70 60 50 98 50"
              fill="none"
              stroke="#6366F1"
              strokeOpacity=".26"
              strokeWidth="1.2"
            />
            <path
              d="M2 30 C40 30 60 50 98 50"
              fill="none"
              stroke="#4469F0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 188"
              style={{ animation: 'arch-flow 2.8s linear infinite 0.2s' }}
            />
            <path
              d="M2 50 L98 50"
              fill="none"
              stroke="#2F58EE"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 188"
              style={{ animation: 'arch-flow 2.8s linear infinite 0.6s' }}
            />
            <path
              d="M2 70 C40 70 60 50 98 50"
              fill="none"
              stroke="#6366F1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 188"
              style={{ animation: 'arch-flow 2.8s linear infinite 1s' }}
            />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ position: 'relative', width: '82px', height: '82px' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: '-22%',
                  borderRadius: '999px',
                  background: 'radial-gradient(circle, rgba(68,105,240,.30), transparent 68%)',
                  animation: 'arch-orb 3.6s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '0',
                  borderRadius: '22px',
                  background: 'linear-gradient(150deg, #4469F0 0%, #213EA7 100%)',
                  boxShadow: '0 16px 40px rgba(68,105,240,.42)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: '700',
                    fontSize: '26px',
                    color: '#FFFFFF',
                    letterSpacing: '-1px',
                  }}
                >
                  G
                </span>
              </div>
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
          You get the whole stack from day one. Book a load on the phone, the e-way bill generates
          itself, the GPS device reports the trip, and the invoice reaches your client before you
          reach the depot.
        </p>
      </div>
    </section>
  );
}
