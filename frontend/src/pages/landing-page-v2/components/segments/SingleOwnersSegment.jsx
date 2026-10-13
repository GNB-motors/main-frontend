import SegmentArt from '../SegmentArt.jsx';

export default function SingleOwnersSegment() {
  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '566px',
        borderRadius: '24px',
        background: '#FFFFFF',
        border: '1px solid rgba(5,8,22,.07)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition:
          'transform 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1)',
      }}
    >
      <div style={{ position: 'relative', flex: '1', overflow: 'hidden', background: '#F3F3F6' }}>
        <SegmentArt variant="owner" />
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '8px 13px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,.92)',
            border: '1px solid rgba(5,8,22,.08)',
            backdropFilter: 'blur(8px)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '10px',
              fontWeight: '500',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: '#050816',
              whiteSpace: 'nowrap',
            }}
          >
            1 – 5 vehicles
          </span>
        </div>
      </div>
      <div
        style={{
          minHeight: '176px',
          boxSizing: 'border-box',
          padding: '26px 28px 30px',
          borderTop: '1px solid rgba(5,8,22,.07)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
          <span
            style={{
              flex: '0 0 auto',
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(68,105,240,.08)',
              border: '1px solid rgba(68,105,240,.16)',
              display: 'grid',
              placeItems: 'center',
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
            >
              <path d="M3 16V7h10v9" />
              <path d="M13 10h4l3 3.5V16" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
          </span>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
              fontSize: '22px',
              letterSpacing: '-.5px',
              color: '#050816',
            }}
          >
            Single owners
          </div>
        </div>
        <div
          style={{
            fontSize: '14.5px',
            lineHeight: '23px',
            color: '#5D5D5E',
            marginTop: '14px',
            textWrap: 'pretty',
          }}
        >
          One truck, one app, full compliance without an accounts team.
        </div>
        <a
          href="/single-owners"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--nova-rage-600)',
            marginTop: 'auto',
            paddingTop: '14px',
          }}
        >
          Explore →
        </a>
      </div>
    </article>
  );
}
