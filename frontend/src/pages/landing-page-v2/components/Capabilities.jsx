import VehicleTrackingCard from './capabilities/VehicleTrackingCard.jsx';
import TripDispatchCard from './capabilities/TripDispatchCard.jsx';
import ErpCard from './capabilities/ErpCard.jsx';
import FinanceLedgerCard from './capabilities/FinanceLedgerCard.jsx';
import ComplianceDocumentsCard from './capabilities/ComplianceDocumentsCard.jsx';
import AiFleetIntelligenceCard from './capabilities/AiFleetIntelligenceCard.jsx';

export default function Capabilities() {
  return (
    <section
      id="capabilities"
      data-darkzone
      data-screen-label="Capabilities"
      style={{
        position: 'relative',
        background: 'transparent',
        padding: '0 40px 132px',
        overflow: 'hidden',
      }}
    >
      <div
        data-veil
        style={{
          position: 'absolute',
          inset: '0',
          background: '#0B0F20',
          opacity: '0',
          pointerEvents: 'none',
          transition: 'opacity 700ms cubic-bezier(.2,0,0,1)',
        }}
      />
      <div
        data-glow
        style={{
          position: 'absolute',
          top: '120px',
          left: '-8%',
          width: '56%',
          height: '520px',
          borderRadius: '999px',
          background: 'radial-gradient(circle, rgba(68,105,240,.28), transparent 66%)',
          filter: 'blur(20px)',
          opacity: '.3',
          transition:
            'opacity 700ms cubic-bezier(.2,0,0,1), transform 900ms cubic-bezier(.2,0,0,1)',
          pointerEvents: 'none',
        }}
      />
      <div
        data-glow
        style={{
          position: 'absolute',
          top: '420px',
          right: '-10%',
          width: '52%',
          height: '560px',
          borderRadius: '999px',
          background: 'radial-gradient(circle, rgba(99,102,241,.22), transparent 68%)',
          filter: 'blur(20px)',
          opacity: '.3',
          transition:
            'opacity 700ms cubic-bezier(.2,0,0,1), transform 900ms cubic-bezier(.2,0,0,1)',
          pointerEvents: 'none',
        }}
      />
      <div
        data-cap-inner
        style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto', paddingTop: '210px' }}
      >
        <div data-reveal style={{ maxWidth: '900px', margin: '0 auto 72px', textAlign: 'center' }}>
          <div
            data-dk-pill
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              borderRadius: '999px',
              background: 'rgba(68,105,240,.16)',
              border: '1px solid rgba(129,150,255,.3)',
              marginBottom: '28px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: '#8FA6FF',
                boxShadow: '0 0 10px rgba(143,166,255,.9)',
                animation: 'cap-blink 2.4s ease-in-out infinite',
              }}
            />
            <span
              data-dk-eyebrow
              style={{
                fontFamily: 'var(--font-eyebrow)',
                fontSize: '10px',
                fontWeight: '500',
                letterSpacing: '.3em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.78)',
              }}
            >
              Inside the platform
            </span>
          </div>
          <h2
            data-mhead
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '52px',
              lineHeight: '1.06',
              letterSpacing: '-1.9px',
              color: '#FFFFFF',
              margin: '0',
              textWrap: 'pretty',
            }}
            data-dk-h
          >
            One platform.{' '}
            <span data-dk-accent style={{ color: '#8FA6FF' }}>
              Every fleet function.
            </span>
          </h2>
          <p
            data-dk-p
            style={{
              fontSize: '18px',
              lineHeight: '30px',
              color: 'rgba(255,255,255,.62)',
              margin: '26px auto 0',
              maxWidth: '720px',
              textWrap: 'pretty',
            }}
          >
            From vehicle tracking and dispatch to ERP, finance, compliance and AI-powered
            intelligence — every fleet operation works from one connected data layer.
          </p>
        </div>
        <div
          data-reveal-group
          data-cardgrid
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          <VehicleTrackingCard />
          <TripDispatchCard />
          <ErpCard />
          <FinanceLedgerCard />
          <ComplianceDocumentsCard />
          <AiFleetIntelligenceCard />
        </div>
        <div
          data-reveal
          style={{
            marginTop: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div
            data-dk-mono
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'rgba(255,255,255,.4)',
            }}
          >
            Vehicles → operations → ERP → finance → compliance → shared data → AI intelligence
          </div>
          <a
            href="#demo"
            data-dk-link
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '16px',
              fontWeight: '600',
              color: '#9FB4FF',
            }}
          >
            Browse the full module catalogue →
          </a>
        </div>
      </div>
    </section>
  );
}
