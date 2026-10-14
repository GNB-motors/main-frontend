export default function VehicleTrackingCard() {
  return (
    <article
      data-card
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '566px',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, #182042 0%, #10152C 100%)',
        border: '1px solid rgba(129,150,255,.16)',
        overflow: 'hidden',
        boxShadow: '0 18px 50px rgba(3,6,18,.45)',
        transition:
          'transform 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1)',
      }}
    >
      <div
        style={{
          position: 'relative',
          flex: '1',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #182042 0%, #10152C 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background:
              'radial-gradient(420px 240px at 50% 0%, rgba(68,105,240,.22), transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '0',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(circle at 50% 40%, #000, transparent 78%)',
          }}
        />
        <div style={{ position: 'absolute', inset: '0' }}>
          <svg
            viewBox="0 0 390 290"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: '0', width: '100%', height: '100%' }}
          >
            <path
              d="M18 250 C90 210 120 130 210 120 C290 112 320 70 372 58"
              fill="none"
              stroke="rgba(110,139,255,.3)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M14 120 C80 140 130 196 220 200 C300 204 340 236 380 244"
              fill="none"
              stroke="rgba(110,139,255,.22)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M40 40 C110 60 150 118 208 160 C260 198 320 200 376 176"
              fill="none"
              stroke="rgba(110,139,255,.16)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M18 250 C90 210 120 130 210 120 C290 112 320 70 372 58"
              fill="none"
              stroke="#7C97FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="520"
              style={{ animation: 'cap-draw 7s cubic-bezier(.2,0,0,1) infinite' }}
            />
            <path
              d="M14 120 C80 140 130 196 220 200 C300 204 340 236 380 244"
              fill="none"
              stroke="#5C7BF5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="520"
              style={{ animation: 'cap-draw 7s cubic-bezier(.2,0,0,1) infinite 1.2s' }}
            />
            <circle
              cx="210"
              cy="120"
              r="46"
              fill="rgba(68,105,240,.07)"
              stroke="rgba(110,139,255,.34)"
              strokeWidth="1.2"
              strokeDasharray="4 6"
            />
            <circle
              cx="210"
              cy="120"
              r="46"
              fill="none"
              stroke="rgba(110,139,255,.5)"
              strokeWidth="1.2"
              style={{
                animation: 'cap-geo 3.6s ease-out infinite',
                transformOrigin: '210px 120px',
              }}
            />
            <circle cx="210" cy="120" r="5" fill="#7C97FF" />
          </svg>
          <div style={{ position: 'absolute', inset: '0' }}>
            <span
              style={{
                position: 'absolute',
                left: '0',
                top: '0',
                width: '9px',
                height: '9px',
                margin: '-4.5px 0 0 -4.5px',
                borderRadius: '999px',
                background: '#8FA6FF',
                boxShadow: '0 0 14px #8FA6FF',
                offsetPath: "path('M18 250 C90 210 120 130 210 120 C290 112 320 70 372 58')",
                offsetRotate: '0deg',
                animation: 'cap-run 7s linear infinite 0s',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '0',
                top: '0',
                width: '9px',
                height: '9px',
                margin: '-4.5px 0 0 -4.5px',
                borderRadius: '999px',
                background: '#6E8BFF',
                boxShadow: '0 0 14px #6E8BFF',
                offsetPath: "path('M14 120 C80 140 130 196 220 200 C300 204 340 236 380 244')",
                offsetRotate: '0deg',
                animation: 'cap-run 8.5s linear infinite 1.1s',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '0',
                top: '0',
                width: '9px',
                height: '9px',
                margin: '-4.5px 0 0 -4.5px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,.75)',
                boxShadow: '0 0 14px rgba(255,255,255,.75)',
                offsetPath: "path('M40 40 C110 60 150 118 208 160 C260 198 320 200 376 176')",
                offsetRotate: '0deg',
                animation: 'cap-run 9.5s linear infinite 2.2s',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: '26px',
              left: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '9px 13px',
              borderRadius: '12px',
              background: 'rgba(19,25,50,.82)',
              border: '1px solid rgba(129,150,255,.24)',
              backdropFilter: 'blur(8px)',
              animation: 'cap-float 5.4s ease-in-out infinite 0s',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: '#6E8BFF',
                boxShadow: '0 0 10px rgba(110,139,255,.9)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: 'rgba(255,255,255,.86)',
                whiteSpace: 'nowrap',
              }}
            >
              MH-12-AB-4471
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: 'rgba(255,255,255,.42)',
                whiteSpace: 'nowrap',
              }}
            >
              62 km/h
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '120px',
              right: '22px',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '9px 13px',
              borderRadius: '12px',
              background: 'rgba(19,25,50,.82)',
              border: '1px solid rgba(129,150,255,.24)',
              backdropFilter: 'blur(8px)',
              animation: 'cap-float 5.4s ease-in-out infinite 1.4s',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: '#6E8BFF',
                boxShadow: '0 0 10px rgba(110,139,255,.9)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: 'rgba(255,255,255,.86)',
                whiteSpace: 'nowrap',
              }}
            >
              Geofence · Bhiwandi
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '26px',
              left: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '9px 13px',
              borderRadius: '12px',
              background: 'rgba(46,20,26,.72)',
              border: '1px solid rgba(229,104,107,.34)',
              backdropFilter: 'blur(8px)',
              animation: 'cap-float 5.4s ease-in-out infinite 2.6s',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: '#E5686B',
                boxShadow: '0 0 10px rgba(229,104,107,.9)',
                animation: 'cap-blink 1.8s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: 'rgba(255,255,255,.86)',
                whiteSpace: 'nowrap',
              }}
            >
              Halt detected · 47 min
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '26px',
              right: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              color: 'rgba(255,255,255,.34)',
            }}
          >
            1,240 vehicles live
          </div>
        </div>
      </div>
      <div
        data-card-body
        style={{
          minHeight: '176px',
          boxSizing: 'border-box',
          padding: '26px 28px 30px',
          borderTop: '1px solid rgba(255,255,255,.07)',
        }}
      >
        <div
          data-card-title
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '500',
            fontSize: '22px',
            letterSpacing: '-.5px',
            color: '#FFFFFF',
          }}
        >
          Vehicle tracking
        </div>
        <div
          data-card-desc
          style={{
            fontSize: '14.5px',
            lineHeight: '23px',
            color: 'rgba(255,255,255,.6)',
            marginTop: '10px',
            textWrap: 'pretty',
          }}
        >
          Real-time GPS, geofences, halt detection and live fleet visibility from one intelligent
          map.
        </div>
      </div>
    </article>
  );
}
