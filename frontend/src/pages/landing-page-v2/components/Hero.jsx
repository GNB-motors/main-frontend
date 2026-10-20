import HeroFleetLiveTile from './hero/HeroFleetLiveTile.jsx';
import HeroPartyLedgerTile from './hero/HeroPartyLedgerTile.jsx';
import HeroFuelGapTile from './hero/HeroFuelGapTile.jsx';
import HeroProofOfDeliveryTile from './hero/HeroProofOfDeliveryTile.jsx';
import HeroTripRecordTile from './hero/HeroTripRecordTile.jsx';
import HeroServiceDueTile from './hero/HeroServiceDueTile.jsx';
import HeroAiRecoveryTile from './hero/HeroAiRecoveryTile.jsx';
import HeroMileageDriftTile from './hero/HeroMileageDriftTile.jsx';
import HeroLiveRouteTile from './hero/HeroLiveRouteTile.jsx';
import HeroEwayBillTile from './hero/HeroEwayBillTile.jsx';
import HeroRosterTile from './hero/HeroRosterTile.jsx';
import HeroDriverAdvanceTile from './hero/HeroDriverAdvanceTile.jsx';

export default function Hero() {
  return (
    <section
      id="top"
      data-screen-label="Hero"
      style={{ position: 'relative', background: '#F4F5FA', padding: '104px 40px' }}
    >
      <div
        data-hero-grid
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 620px',
          gap: '72px',
          alignItems: 'center',
        }}
      >
        <div data-reveal-group>
          <h1
            data-mhead
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '62px',
              lineHeight: '1.06',
              letterSpacing: '-2.2px',
              color: '#050816',
              margin: '0',
              textWrap: 'pretty',
            }}
          >
            The unified <span style={{ color: 'var(--nova-rage-400)' }}>AI-native</span> platform
            for fleet operations.
          </h1>
          <p
            style={{
              fontSize: '18px',
              lineHeight: '30px',
              color: '#5D5D5E',
              margin: '30px 0 0',
              maxWidth: '560px',
              textWrap: 'pretty',
            }}
          >
            From GPS telemetry and trip dispatch to GST, e-way bills, ledgers, payments and
            reporting, GNB Edge brings every part of fleet operations together on one intelligent
            platform, on web, mobile and API, built for single owners, contract fleets and
            enterprise networks alike.
          </p>
          <div
            data-btnrow
            style={{ display: 'flex', gap: '32px', alignItems: 'center', marginTop: '44px' }}
          >
            <a
              href="#demo"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '16px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: 'var(--nova-rage-400)',
                border: '1px solid var(--nova-rage-800)',
                padding: '18px 44px',
                borderRadius: '999px',
                transition: 'background 200ms cubic-bezier(.2,0,0,1)',
              }}
            >
              Reach us
            </a>
            <a
              href="#platform"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '16px',
                fontWeight: '600',
                color: '#050816',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
              }}
            >
              See the platform <span style={{ color: 'var(--nova-rage-400)' }}>→</span>
            </a>
          </div>
        </div>

        <div data-reveal data-hero-mosaic style={{ position: 'relative' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 196px)',
              gap: '16px',
              alignItems: 'start',
              width: '620px',
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '0px' }}
            >
              <div data-swapslot style={{ position: 'relative', height: '182px' }}>
                <HeroFleetLiveTile />
                <HeroPartyLedgerTile />
              </div>
              <div data-swapslot style={{ position: 'relative', height: '202px' }}>
                <HeroFuelGapTile />
                <HeroProofOfDeliveryTile />
              </div>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '30px' }}
            >
              <div data-swapslot style={{ position: 'relative', height: '210px' }}>
                <HeroTripRecordTile />
                <HeroServiceDueTile />
              </div>
              <div data-swapslot style={{ position: 'relative', height: '182px' }}>
                <HeroAiRecoveryTile />
                <HeroMileageDriftTile />
              </div>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '12px' }}
            >
              <div data-swapslot style={{ position: 'relative', height: '188px' }}>
                <HeroLiveRouteTile />
                <HeroEwayBillTile />
              </div>
              <div data-swapslot style={{ position: 'relative', height: '196px' }}>
                <HeroRosterTile />
                <HeroDriverAdvanceTile />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
