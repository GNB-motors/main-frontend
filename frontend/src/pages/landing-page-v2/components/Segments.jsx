import SingleOwnersSegment from './segments/SingleOwnersSegment.jsx';
import ContractFleetsSegment from './segments/ContractFleetsSegment.jsx';
import EnterpriseSegment from './segments/EnterpriseSegment.jsx';

export default function Segments() {
  return (
    <section data-screen-label="Segments" style={{ background: '#F4F5FA', padding: '112px 40px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div data-reveal style={{ maxWidth: '800px' }}>
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
            Who it is for
          </div>
          <h2
            data-mhead
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '46px',
              lineHeight: '1.08',
              letterSpacing: '-1.5px',
              margin: '0',
              textWrap: 'pretty',
            }}
          >
            Built for every fleet.{' '}
            <span style={{ color: 'var(--nova-rage-400)' }}>Ready for every stage of growth.</span>
          </h2>
          <p style={{ fontSize: '18px', lineHeight: '29px', color: '#5D5D5E', margin: '22px 0 0' }}>
            Single owners, contract fleets and enterprise networks all run on the same platform.
          </p>
        </div>
        <div
          data-reveal-group
          data-cardgrid
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginTop: '60px',
          }}
        >
          <SingleOwnersSegment />
          <ContractFleetsSegment />
          <EnterpriseSegment />
        </div>
      </div>
    </section>
  );
}
