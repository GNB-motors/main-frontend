import TripConsignmentCard from './trip-hero/TripConsignmentCard.jsx';
import TripAssignedCard from './trip-hero/TripAssignedCard.jsx';
import TripCostingCard from './trip-hero/TripCostingCard.jsx';
import TripPaperworkCard from './trip-hero/TripPaperworkCard.jsx';

export default function TripHero() {
  return (
    <section
      data-screen-label="Trip hero"
      style={{
        position: 'relative',
        background: '#F4F5FA',
        padding: '92px 40px 0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0',
          background:
            'radial-gradient(900px 520px at 88% -6%, rgba(68,105,240,.11), transparent 66%), radial-gradient(680px 420px at 2% 40%, rgba(68,105,240,.06), transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '0',
          backgroundImage:
            'linear-gradient(rgba(5,8,22,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(5,8,22,.035) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(circle at 70% 20%, #000, transparent 72%)',
        }}
      />

      <div style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
          <span style={{ width: '44px', height: '2px', background: 'var(--nova-rage-400)' }} />
          <span
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '12px',
              fontWeight: '500',
              letterSpacing: '.44em',
              textTransform: 'uppercase',
              color: 'var(--nova-rage-600)',
            }}
          >
            Fleet · Trip management
          </span>
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
              }}
            >
              AI native
            </span>
          </span>
        </div>

        <div
          data-mcol
          style={{
            display: 'grid',
            gridTemplateColumns: '1.12fr .88fr',
            gap: '72px',
            alignItems: 'end',
          }}
        >
          <h1
            data-mhead
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '62px',
              lineHeight: '1.03',
              letterSpacing: '-2.4px',
              margin: '0',
              color: '#050816',
              textWrap: 'pretty',
            }}
          >
            Plan it, cost it, close it.{' '}
            <span style={{ color: 'var(--nova-rage-400)' }}>One trip record.</span>
          </h1>
          <div>
            <p
              style={{
                fontSize: '18px',
                lineHeight: '30px',
                color: '#5D5D5E',
                margin: '0',
                textWrap: 'pretty',
              }}
            >
              From booking to POD to invoice, every consignment carries its own vehicle, driver,
              expenses and paperwork, so nothing is reconstructed from memory at month end.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: '64px',
            borderRadius: 'var(--radius-soft)',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.06)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
        >
          <div data-mcol3 style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr 1fr 1.05fr' }}>
            <TripConsignmentCard />

            <TripAssignedCard />

            <TripCostingCard />

            <TripPaperworkCard />
          </div>
        </div>

        <div
          data-reveal-group
          data-mcol3
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            margin: '0 -32px',
            padding: '56px 0 88px',
          }}
        >
          <div style={{ padding: '0 32px' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '38px',
                lineHeight: '1',
                letterSpacing: '-1.4px',
                color: '#050816',
              }}
            >
              1 rec
            </div>
            <div
              style={{ fontSize: '14px', lineHeight: '22px', color: '#5D5D5E', marginTop: '14px' }}
            >
              Booking to invoice on one trip record
            </div>
          </div>
          <div style={{ padding: '0 32px', borderLeft: '1px solid rgba(5,8,22,.10)' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '38px',
                lineHeight: '1',
                letterSpacing: '-1.4px',
                color: '#050816',
              }}
            >
              6 stage
            </div>
            <div
              style={{ fontSize: '14px', lineHeight: '22px', color: '#5D5D5E', marginTop: '14px' }}
            >
              Booked, loaded, in transit, delivered, POD, billed
            </div>
          </div>
          <div style={{ padding: '0 32px', borderLeft: '1px solid rgba(5,8,22,.10)' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '38px',
                lineHeight: '1',
                letterSpacing: '-1.4px',
                color: '#050816',
              }}
            >
              0 entry
            </div>
            <div
              style={{ fontSize: '14px', lineHeight: '22px', color: '#5D5D5E', marginTop: '14px' }}
            >
              Re-typing between trip, e-way bill and invoice
            </div>
          </div>
          <div style={{ padding: '0 32px', borderLeft: '1px solid rgba(5,8,22,.10)' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '38px',
                lineHeight: '1',
                letterSpacing: '-1.4px',
                color: '#050816',
              }}
            >
              live
            </div>
            <div
              style={{ fontSize: '14px', lineHeight: '22px', color: '#5D5D5E', marginTop: '14px' }}
            >
              Costed against actual, while the trip runs
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
