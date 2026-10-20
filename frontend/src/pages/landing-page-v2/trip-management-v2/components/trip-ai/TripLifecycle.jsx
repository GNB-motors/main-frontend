import TripAiPricingCallout from './TripAiPricingCallout.jsx';
import TripAiDelayCallout from './TripAiDelayCallout.jsx';
import TripAiPaperworkCallout from './TripAiPaperworkCallout.jsx';

export default function TripLifecycle() {
  return (
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
          Trip lifecycle · where AI acts
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          GNB/2026/04817 · Mumbai → Nagpur
        </div>
      </div>
      <div style={{ paddingTop: '120px' }}>
        <div style={{ position: 'relative', height: '60px' }}>
          <div
            style={{
              position: 'absolute',
              left: '2%',
              right: '2%',
              top: '7px',
              height: '2px',
              background: 'rgba(68,105,240,.16)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '2%',
              width: '62%',
              top: '7px',
              height: '2px',
              background: 'var(--nova-rage-400)',
              transformOrigin: 'left',
              animation: 'ai-bar 1.4s cubic-bezier(.2,0,0,1) both .3s',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '2px',
              width: '12px',
              height: '12px',
              marginLeft: '-6px',
              borderRadius: '999px',
              background: 'rgba(68,105,240,.3)',
              animation: 'ai-run 5.5s cubic-bezier(.2,0,0,1) infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '2%',
              top: '0',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '999px',
                background: '#4469F0',
                border: '2px solid #4469F0',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#050816',
                whiteSpace: 'nowrap',
              }}
            >
              Booking
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '21%',
              top: '0',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '999px',
                background: '#4469F0',
                border: '2px solid #4469F0',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#050816',
                whiteSpace: 'nowrap',
              }}
            >
              Dispatch
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '43%',
              top: '0',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '999px',
                background: '#4469F0',
                border: '2px solid #4469F0',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#050816',
                whiteSpace: 'nowrap',
              }}
            >
              In transit
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '64%',
              top: '0',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '999px',
                background: '#FFFFFF',
                border: '2px solid rgba(68,105,240,.35)',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#93939A',
                whiteSpace: 'nowrap',
              }}
            >
              Delivery
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '83%',
              top: '0',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '999px',
                background: '#FFFFFF',
                border: '2px solid rgba(68,105,240,.35)',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#93939A',
                whiteSpace: 'nowrap',
              }}
            >
              POD
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '98%',
              top: '0',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '999px',
                background: '#FFFFFF',
                border: '2px solid rgba(68,105,240,.35)',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#93939A',
                whiteSpace: 'nowrap',
              }}
            >
              Invoice
            </span>
          </div>
          <TripAiPricingCallout />
          <TripAiDelayCallout />
          <TripAiPaperworkCallout />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginTop: '26px',
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'rgba(68,105,240,.06)',
            border: '1px dashed rgba(68,105,240,.3)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4469F0"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flex: '0 0 auto' }}
          >
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 5v6h-6" />
          </svg>
          <span style={{ fontSize: '13.5px', lineHeight: '21px', color: '#5D5D5E' }}>
            Every closed trip goes back into the model. The next quote on this lane is priced on 35
            runs, not 34.
          </span>
        </div>
      </div>
    </div>
  );
}
