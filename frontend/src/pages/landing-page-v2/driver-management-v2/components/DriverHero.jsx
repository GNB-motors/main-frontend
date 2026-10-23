import DriverDutyRoster from './driver-hero/DriverDutyRoster.jsx';

export default function DriverHero() {
  return (
    <section
      data-screen-label="Driver hero"
      style={{
        position: 'relative',
        background: '#F4F5FA',
        padding: '104px 40px 88px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0',
          background:
            'radial-gradient(880px 500px at 82% 2%, rgba(68,105,240,.11), transparent 68%), radial-gradient(680px 440px at 4% 46%, rgba(68,105,240,.06), transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '0',
          backgroundImage:
            'linear-gradient(rgba(5,8,22,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(5,8,22,.035) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(circle at 60% 30%, #000, transparent 74%)',
        }}
      />
      <div
        data-mcol
        style={{
          position: 'relative',
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr .92fr',
          gap: '64px',
          alignItems: 'center',
        }}
      >
        <div data-reveal-group>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '26px' }}>
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
              Fleet · Driver management
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
                  color: 'var(--nova-rage-600)',
                }}
              >
                AI native
              </span>
            </span>
          </div>
          <h1
            data-mhead
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '58px',
              lineHeight: '1.05',
              letterSpacing: '-2px',
              margin: '0',
              textWrap: 'pretty',
            }}
          >
            Every driver, every licence,{' '}
            <span style={{ color: 'var(--nova-rage-400)' }}>every settlement.</span>
          </h1>
          <p
            style={{
              fontSize: '18px',
              lineHeight: '30px',
              color: '#5D5D5E',
              margin: '28px 0 0',
              maxWidth: '540px',
              textWrap: 'pretty',
            }}
          >
            Licence expiry that warns you a month out, duty hours counted against the trip, and
            driver advances settled against the same ledger your accounts team already uses.
          </p>
          <div data-btnrow style={{ display: 'flex', gap: '14px', marginTop: '40px' }}>
            <a
              href="#dm-demo"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '16px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: 'var(--nova-rage-400)',
                border: '1px solid var(--nova-rage-800)',
                padding: '18px 40px',
                borderRadius: '999px',
                transition: 'background 200ms cubic-bezier(.2,0,0,1)',
              }}
            >
              Book a demo
            </a>
            <a
              href="/"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '16px',
                fontWeight: '600',
                color: '#050816',
                background: 'transparent',
                border: '1px solid rgba(5,8,22,.16)',
                padding: '18px 40px',
                borderRadius: '999px',
                transition: 'background 200ms cubic-bezier(.2,0,0,1)',
              }}
            >
              All modules
            </a>
          </div>
        </div>
        <DriverDutyRoster />
      </div>
    </section>
  );
}
