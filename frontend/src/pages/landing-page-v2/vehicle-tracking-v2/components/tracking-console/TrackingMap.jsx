export default function TrackingMap() {
  return (
    <div
      style={{
        flex: '1 1 auto',
        minWidth: '150px',
        position: 'relative',
        background: '#EEF1F8',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 280 360"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: '0', width: '100%', height: '100%' }}
      >
        <rect width="280" height="360" fill="#EEF1F8" />
        <path
          d="M-10 88 H290 M-10 186 H290 M-10 286 H290 M70 -10 V370 M176 -10 V370"
          stroke="rgba(5,8,22,.05)"
          strokeWidth="1"
        />
        <path
          d="M-10 246 C56 238 84 196 132 182 C186 166 214 118 290 108"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M52 370 C64 292 106 258 122 196 C138 132 178 96 190 -10"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M-10 62 C64 54 96 82 152 68 C204 55 236 66 290 52"
          fill="none"
          stroke="rgba(255,255,255,.7)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M34 322 C74 288 88 252 124 232 C168 208 176 152 216 66"
          fill="none"
          stroke="#4469F0"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray="7 6"
          style={{ animation: 'ai-flow 1.6s linear infinite' }}
        />
        <circle cx="34" cy="322" r="5" fill="#FFFFFF" stroke="#4469F0" strokeWidth="2.6" />
        <circle cx="216" cy="66" r="5" fill="#4469F0" />
        <circle cx="70" cy="128" r="4.2" fill="#187A32" />
        <circle cx="228" cy="266" r="4.2" fill="#E0A93B" />
        <circle cx="122" cy="318" r="4.2" fill="#E5686B" />
        <g>
          <circle
            cx="150"
            cy="198"
            r="12"
            fill="rgba(68,105,240,.30)"
            style={{
              transformOrigin: '150px 198px',
              animation: 'vt-ping 2.2s cubic-bezier(.2,0,0,1) infinite',
            }}
          />
          <circle cx="150" cy="198" r="6.8" fill="#4469F0" stroke="#FFFFFF" strokeWidth="2.4" />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: '12px',
          top: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,.94)',
          border: '1px solid rgba(5,8,22,.07)',
          boxShadow: '0 4px 14px rgba(30,34,56,.10)',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '999px',
            background: '#187A32',
            animation: 'ai-blip 1.8s ease-in-out infinite',
          }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#5D5D5E' }}>
          live · 30 s ping
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '54%',
          top: 'calc(55% + 16px)',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          padding: '7px 10px',
          borderRadius: '9px',
          background: '#FFFFFF',
          border: '1px solid rgba(5,8,22,.08)',
          boxShadow: '0 8px 22px rgba(30,34,56,.16)',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '9.5px',
            fontWeight: '500',
          }}
        >
          GJ-05-KT-1180
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '8.5px',
            color: '#93939A',
            marginTop: '2px',
          }}
        >
          62 km/h · ETA 14:20
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: '10px',
          top: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        <span
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '7px',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.09)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '13px',
            color: '#5D5D5E',
            lineHeight: '1',
          }}
        >
          +
        </span>
        <span
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '7px',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.09)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '13px',
            color: '#5D5D5E',
            lineHeight: '1',
          }}
        >
          −
        </span>
      </div>
    </div>
  );
}
