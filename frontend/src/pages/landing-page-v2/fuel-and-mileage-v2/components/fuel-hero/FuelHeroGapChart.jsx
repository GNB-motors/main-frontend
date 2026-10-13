export default function FuelHeroGapChart() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7,1fr)',
        borderTop: '1px solid rgba(5,8,22,.07)',
      }}
    >
      <div
        style={{
          padding: '13px 6px',
          textAlign: 'center',
          animation: 'fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.1s',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#5D5D5E',
          }}
        >
          +1.2
        </span>
        <span style={{ display: 'block', fontSize: '9.5px', color: '#B0B0B6', marginTop: '4px' }}>
          T1
        </span>
      </div>
      <div
        style={{
          padding: '13px 6px',
          textAlign: 'center',
          borderLeft: '1px solid rgba(5,8,22,.06)',
          animation: 'fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.16s',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#5D5D5E',
          }}
        >
          +2.0
        </span>
        <span style={{ display: 'block', fontSize: '9.5px', color: '#B0B0B6', marginTop: '4px' }}>
          T2
        </span>
      </div>
      <div
        style={{
          padding: '13px 6px',
          textAlign: 'center',
          borderLeft: '1px solid rgba(5,8,22,.06)',
          animation: 'fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.22s',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#5D5D5E',
          }}
        >
          +1.4
        </span>
        <span style={{ display: 'block', fontSize: '9.5px', color: '#B0B0B6', marginTop: '4px' }}>
          T3
        </span>
      </div>
      <div
        style={{
          padding: '13px 6px',
          textAlign: 'center',
          borderLeft: '1px solid rgba(5,8,22,.06)',
          animation: 'fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.28s',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#A9701A',
          }}
        >
          +6.8
        </span>
        <span style={{ display: 'block', fontSize: '9.5px', color: '#B0B0B6', marginTop: '4px' }}>
          T4
        </span>
      </div>
      <div
        style={{
          padding: '13px 6px',
          textAlign: 'center',
          borderLeft: '1px solid rgba(5,8,22,.06)',
          animation: 'fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.34s',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#A9701A',
          }}
        >
          +11.4
        </span>
        <span style={{ display: 'block', fontSize: '9.5px', color: '#B0B0B6', marginTop: '4px' }}>
          T5
        </span>
      </div>
      <div
        style={{
          padding: '13px 6px',
          textAlign: 'center',
          borderLeft: '1px solid rgba(5,8,22,.06)',
          animation: 'fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.4s',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#C4494C',
          }}
        >
          +14.2
        </span>
        <span style={{ display: 'block', fontSize: '9.5px', color: '#B0B0B6', marginTop: '4px' }}>
          T6
        </span>
      </div>
      <div
        style={{
          padding: '13px 6px',
          textAlign: 'center',
          borderLeft: '1px solid rgba(5,8,22,.06)',
          background: 'rgba(229,104,107,.07)',
          animation: 'fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.46s',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: '500',
            color: '#C4494C',
          }}
        >
          +25.6
        </span>
        <span style={{ display: 'block', fontSize: '9.5px', color: '#C4494C', marginTop: '4px' }}>
          T7
        </span>
      </div>
    </div>
  );
}
