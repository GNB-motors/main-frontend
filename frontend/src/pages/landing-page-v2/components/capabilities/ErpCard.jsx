export default function ErpCard() {
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
              top: '52%',
              transform: 'translate(-50%,-50%)',
              width: '78%',
              height: '62%',
              borderRadius: '999px',
              background: 'radial-gradient(circle, rgba(68,105,240,.26), transparent 68%)',
              animation: 'cap-glow 4.6s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '34px',
              left: '16px',
              right: '40px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(120deg, rgba(68,105,240,0.2), rgba(255,255,255,.03))',
              border: '1px solid rgba(129,150,255,0.3)',
              transform: 'perspective(700px) rotateX(24deg)',
              transformOrigin: 'center top',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              animation: 'cap-plane 6.4s ease-in-out infinite 0.0s',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,.8)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Consignments
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '90px',
              left: '24px',
              right: '32px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(120deg, rgba(68,105,240,0.17), rgba(255,255,255,.03))',
              border: '1px solid rgba(129,150,255,0.25)',
              transform: 'perspective(700px) rotateX(24deg)',
              transformOrigin: 'center top',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              animation: 'cap-plane 6.4s ease-in-out infinite 0.4s',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,.8)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Inventory
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '146px',
              left: '32px',
              right: '24px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(120deg, rgba(68,105,240,0.14), rgba(255,255,255,.03))',
              border: '1px solid rgba(129,150,255,0.19999999999999998)',
              transform: 'perspective(700px) rotateX(24deg)',
              transformOrigin: 'center top',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              animation: 'cap-plane 6.4s ease-in-out infinite 0.8s',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,.8)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Procurement
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '202px',
              left: '40px',
              right: '16px',
              height: '46px',
              borderRadius: '12px',
              background:
                'linear-gradient(120deg, rgba(68,105,240,0.11000000000000001), rgba(255,255,255,.03))',
              border: '1px solid rgba(129,150,255,0.14999999999999997)',
              transform: 'perspective(700px) rotateX(24deg)',
              transformOrigin: 'center top',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              animation: 'cap-plane 6.4s ease-in-out infinite 1.2s',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,.8)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Branch operations
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '14px',
              right: '14px',
              bottom: '26px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(150deg, rgba(47,88,238,.4), rgba(27,44,116,.5))',
              border: '1px solid rgba(146,168,255,.42)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 18px',
              boxShadow: '0 14px 34px rgba(47,88,238,.28)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-eyebrow)',
                fontSize: '9.5px',
                fontWeight: '500',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
              }}
            >
              Shared system of record
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: 'rgba(255,255,255,.6)',
              }}
            >
              one entry
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '34px',
              width: '3px',
              height: '34px',
              marginLeft: '-1.5px',
              borderRadius: '999px',
              background: 'linear-gradient(180deg, transparent, #9FB4FF)',
              boxShadow: '0 0 14px rgba(159,180,255,.8)',
              animation: 'cap-drop 3.4s cubic-bezier(.2,0,0,1) infinite',
            }}
          />
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
          ERP
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
          Manage consignments, inventory, procurement and branch operations on one connected system
          of record.
        </div>
      </div>
    </article>
  );
}
