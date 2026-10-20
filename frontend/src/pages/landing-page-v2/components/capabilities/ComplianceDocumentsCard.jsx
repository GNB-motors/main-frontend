export default function ComplianceDocumentsCard() {
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
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '46%',
              transform: 'translate(-50%,-50%)',
              width: '70%',
              height: '58%',
              borderRadius: '999px',
              background: 'radial-gradient(circle, rgba(68,105,240,.24), transparent 68%)',
              animation: 'cap-glow 5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '36px',
              transform: 'translateX(-50%)',
              width: '172px',
              height: '212px',
              borderRadius: '14px',
              background: 'linear-gradient(180deg, rgba(24,32,66,.92), rgba(16,21,44,.92))',
              border: '1px solid rgba(129,150,255,.3)',
              boxShadow: '0 20px 46px rgba(3,6,18,.5)',
              overflow: 'hidden',
              animation: 'cap-float 6.2s ease-in-out infinite',
            }}
          >
            <div
              style={{
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '9px',
              }}
            >
              <span
                style={{
                  display: 'block',
                  height: '8px',
                  width: '52%',
                  borderRadius: '999px',
                  background: 'rgba(159,180,255,.75)',
                }}
              />
              <span
                style={{
                  display: 'block',
                  height: '1px',
                  width: '100%',
                  background: 'rgba(255,255,255,.1)',
                  margin: '4px 0',
                }}
              />
              <span
                style={{
                  display: 'block',
                  height: '6px',
                  width: '92%',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.18)',
                }}
              />
              <span
                style={{
                  display: 'block',
                  height: '6px',
                  width: '78%',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                }}
              />
              <span
                style={{
                  display: 'block',
                  height: '6px',
                  width: '88%',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                }}
              />
              <span
                style={{
                  display: 'block',
                  height: '6px',
                  width: '64%',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
              <span
                style={{
                  display: 'block',
                  height: '6px',
                  width: '84%',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.12)',
                }}
              />
              <span
                style={{
                  display: 'block',
                  height: '6px',
                  width: '48%',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                left: '0',
                right: '0',
                height: '56px',
                background:
                  'linear-gradient(180deg, transparent, rgba(110,139,255,.3), transparent)',
                animation: 'cap-scan 4.4s cubic-bezier(.2,0,0,1) infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '14px',
                bottom: '14px',
                width: '44px',
                height: '44px',
                borderRadius: '999px',
                background: 'rgba(24,122,50,.22)',
                border: '1px solid rgba(96,196,128,.55)',
                display: 'grid',
                placeItems: 'center',
                animation: 'cap-stamp 4.4s cubic-bezier(.2,0,0,1) infinite',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6FCF97"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '24px',
              right: '24px',
              bottom: '26px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 12px',
                borderRadius: '999px',
                background: 'rgba(24,122,50,.2)',
                border: '1px solid rgba(96,196,128,.45)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#6FCF97',
                whiteSpace: 'nowrap',
                animation: 'cap-insight 7.8s cubic-bezier(.2,0,0,1) infinite 0s',
              }}
            >
              GST return · filed
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 12px',
                borderRadius: '999px',
                background: 'rgba(24,122,50,.2)',
                border: '1px solid rgba(96,196,128,.45)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#6FCF97',
                whiteSpace: 'nowrap',
                animation: 'cap-insight 7.8s cubic-bezier(.2,0,0,1) infinite 2.6s',
              }}
            >
              E-way bill · verified
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 12px',
                borderRadius: '999px',
                background: 'rgba(229,104,107,.16)',
                border: '1px solid rgba(229,104,107,.4)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: '#E5868A',
                whiteSpace: 'nowrap',
                animation: 'cap-insight 7.8s cubic-bezier(.2,0,0,1) infinite 5.2s',
              }}
            >
              Permit · expires in 9 days
            </span>
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
          Compliance and documents
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
          Keep fleet documents and compliance requirements organised and proactively monitored.
        </div>
      </div>
    </article>
  );
}
