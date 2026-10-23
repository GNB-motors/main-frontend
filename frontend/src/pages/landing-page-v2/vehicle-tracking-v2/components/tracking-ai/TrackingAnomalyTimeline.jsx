export default function TrackingAnomalyTimeline() {
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
          Anomaly timeline · one vehicle, one day
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          MH-12-AB-4471 · 2,880 GPS pings
        </div>
      </div>
      <div data-vt-timeline style={{ paddingTop: '74px' }}>
        <div
          style={{
            position: 'relative',
            height: '46px',
            borderRadius: '8px',
            background: '#F4F5FA',
            overflow: 'visible',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '0%',
              width: '26%',
              top: '0',
              bottom: '0',
              background: 'rgba(68,105,240,.45)',
              borderRadius: '6px',
            }}
            title="Moving"
          />
          <div
            style={{
              position: 'absolute',
              left: '26%',
              width: '13%',
              top: '0',
              bottom: '0',
              background: 'rgba(229,104,107,.45)',
              borderRadius: '6px',
            }}
            title="Unscheduled halt"
          />
          <div
            style={{
              position: 'absolute',
              left: '39%',
              width: '22%',
              top: '0',
              bottom: '0',
              background: 'rgba(68,105,240,.45)',
              borderRadius: '6px',
            }}
            title="Moving"
          />
          <div
            style={{
              position: 'absolute',
              left: '61%',
              width: '9%',
              top: '0',
              bottom: '0',
              background: 'rgba(249,160,97,.5)',
              borderRadius: '6px',
            }}
            title="Off corridor"
          />
          <div
            style={{
              position: 'absolute',
              left: '70%',
              width: '14%',
              top: '0',
              bottom: '0',
              background: 'rgba(68,105,240,.45)',
              borderRadius: '6px',
            }}
            title="Moving"
          />
          <div
            style={{
              position: 'absolute',
              left: '84%',
              right: '0',
              top: '0',
              bottom: '0',
              borderRadius: '6px',
              border: '1.5px dashed rgba(68,105,240,.4)',
              background: 'rgba(68,105,240,.06)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              bottom: '-6px',
              width: '2px',
              background: 'linear-gradient(180deg, transparent, #4469F0, transparent)',
              animation: 'ai-scan 6s cubic-bezier(.2,0,0,1) infinite',
            }}
          />
          <div
            data-vt-callout
            style={{
              position: 'absolute',
              left: '32%',
              bottom: '100%',
              transform: 'translateX(-50%)',
              marginBottom: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 12px',
                borderRadius: '999px',
                background: 'rgba(229,104,107,.12)',
                border: '1px solid rgba(229,104,107,.3)',
                fontSize: '12px',
                fontWeight: '500',
                color: '#C4494C',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '999px',
                  background: '#E5686B',
                  animation: 'ai-blip 2.2s ease-in-out infinite',
                }}
              />
              47 min idle · ₹340 diesel{' '}
            </div>
            <div
              style={{
                width: '1px',
                height: '14px',
                background: 'rgba(229,104,107,.4)',
                margin: '0 auto',
              }}
            />
          </div>
          <div
            data-vt-callout
            style={{
              position: 'absolute',
              left: '65%',
              bottom: '100%',
              transform: 'translateX(-50%)',
              marginBottom: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 12px',
                borderRadius: '999px',
                background: 'rgba(229,104,107,.12)',
                border: '1px solid rgba(229,104,107,.3)',
                fontSize: '12px',
                fontWeight: '500',
                color: '#C4494C',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '999px',
                  background: '#E5686B',
                  animation: 'ai-blip 2.2s ease-in-out infinite',
                }}
              />
              Off corridor, 8 km{' '}
            </div>
            <div
              style={{
                width: '1px',
                height: '14px',
                background: 'rgba(229,104,107,.4)',
                margin: '0 auto',
              }}
            />
          </div>
          <div
            data-vt-callout
            style={{
              position: 'absolute',
              left: '92%',
              bottom: '100%',
              transform: 'translateX(-50%)',
              marginBottom: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 12px',
                borderRadius: '999px',
                background: 'rgba(68,105,240,.10)',
                border: '1px solid rgba(68,105,240,.26)',
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--nova-rage-700)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '999px',
                  background: '#4469F0',
                  animation: 'ai-blip 2.2s ease-in-out infinite',
                }}
              />
              Predicted arrival 18:42{' '}
            </div>
            <div
              style={{
                width: '1px',
                height: '14px',
                background: 'rgba(68,105,240,.34)',
                margin: '0 auto',
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: '#93939A',
          }}
        >
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>18:00</span>
          <span>21:00</span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(5,8,22,.07)',
            fontSize: '12px',
            color: '#5D5D5E',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '12px',
                height: '8px',
                borderRadius: '3px',
                background: 'rgba(68,105,240,.45)',
              }}
            />
            Moving as planned
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '12px',
                height: '8px',
                borderRadius: '3px',
                background: 'rgba(229,104,107,.45)',
              }}
            />
            Halt AI did not expect
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '12px',
                height: '8px',
                borderRadius: '3px',
                background: 'rgba(249,160,97,.5)',
              }}
            />
            Route deviation
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '12px',
                height: '8px',
                borderRadius: '3px',
                border: '1.5px dashed rgba(68,105,240,.5)',
              }}
            />
            Predicted, not yet driven
          </span>
        </div>
      </div>
    </div>
  );
}
