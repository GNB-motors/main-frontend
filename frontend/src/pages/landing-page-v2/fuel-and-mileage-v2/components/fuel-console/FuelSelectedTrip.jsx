export default function FuelSelectedTrip() {
  return (
    <div
      style={{
        flex: '0 0 300px',
        borderLeft: '1px solid rgba(5,8,22,.08)',
        background: '#FAFAFC',
        padding: '22px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '9.5px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#93939A',
          }}
        >
          Selected trip
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '600',
            fontSize: '17px',
            letterSpacing: '-.4px',
            marginTop: '8px',
          }}
        >
          MH-46-C-8890
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#93939A',
            marginTop: '5px',
          }}
        >
          TRP-88104 · 18 Sep · Ravi S.
        </div>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(5,8,22,.08)',
          borderRadius: '12px',
          padding: '14px 14px 12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span style={{ fontSize: '11.5px', fontWeight: '500', color: '#5D5D5E' }}>
            km/l, last 7 trips
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#C4494C' }}>
            4.0 ▾
          </span>
        </div>
        <svg
          viewBox="0 0 240 56"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '52px', display: 'block' }}
        >
          <path d="M2 20 H238" stroke="rgba(5,8,22,.07)" strokeWidth="1" />
          <path d="M2 38 H238" stroke="rgba(5,8,22,.07)" strokeWidth="1" />
          <path
            d="M4 22 C40 18 62 26 92 24 C124 22 150 32 178 42 C200 49 218 50 236 48"
            fill="none"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="236" cy="48" r="3.4" fill="#E5686B" />
        </svg>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '9.5px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#93939A',
            marginBottom: '10px',
          }}
        >
          Evidence on file
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              background: '#FFFFFF',
              border: '1px solid rgba(5,8,22,.08)',
              borderRadius: '10px',
              padding: '9px 11px',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#0F1428',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                color: '#8FA6F5',
              }}
            >
              184
            </span>
            <span style={{ minWidth: '0' }}>
              <span style={{ display: 'block', fontSize: '12.5px', fontWeight: '500' }}>
                Odometer photo
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: '#93939A',
                }}
              >
                1,84,206 km · verified
              </span>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              background: '#FFFFFF',
              border: '1px solid rgba(5,8,22,.08)',
              borderRadius: '10px',
              padding: '9px 11px',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(68,105,240,.10)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
                <path d="M9 8h6M9 12h6" />
              </svg>
            </span>
            <span style={{ minWidth: '0' }}>
              <span style={{ display: 'block', fontSize: '12.5px', fontWeight: '500' }}>
                Fuel bill photo
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: '#93939A',
                }}
              >
                198.0 L · ₹18,216
              </span>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              background: '#FFFFFF',
              border: '1px solid rgba(5,8,22,.08)',
              borderRadius: '10px',
              padding: '9px 11px',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(68,105,240,.10)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4469F0"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17V8l4-3 5 3 4-2 5 3v8" />
                <path d="M3 17h18" />
              </svg>
            </span>
            <span style={{ minWidth: '0' }}>
              <span style={{ display: 'block', fontSize: '12.5px', fontWeight: '500' }}>
                Tank sensor log
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: '#93939A',
                }}
              >
                172.4 L · 30 s samples
              </span>
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 'auto',
          background: 'rgba(229,104,107,.08)',
          border: '1px solid rgba(229,104,107,.24)',
          borderRadius: '12px',
          padding: '13px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '22px',
              letterSpacing: '-.7px',
              color: '#C4494C',
            }}
          >
            25.6 L
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#5D5D5E' }}>
            ₹2,340
          </span>
        </div>
        <div
          style={{
            fontSize: '12px',
            lineHeight: '18px',
            color: '#5D5D5E',
            marginTop: '4px',
          }}
        >
          Bought and billed, never burned.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <span
          style={{
            flex: '1',
            textAlign: 'center',
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#FFFFFF',
            background: 'var(--nova-rage-400)',
            border: '1px solid var(--nova-rage-800)',
            borderRadius: '8px',
            padding: '10px 0',
          }}
        >
          Raise audit
        </span>
        <span
          style={{
            flex: '0 0 auto',
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#050816',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.12)',
            borderRadius: '8px',
            padding: '10px 14px',
          }}
        >
          Open trip
        </span>
      </div>
    </div>
  );
}
