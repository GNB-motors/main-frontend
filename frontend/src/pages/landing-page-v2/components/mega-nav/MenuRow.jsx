import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import SoonPill from './SoonPill.jsx';

export default function MenuRow({ item, onNavigate }) {
  const [hover, setHover] = useState(false);
  const inner = (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 13,
        padding: '11px 12px',
        borderRadius: 12,
        background: hover && !item.soon ? 'rgba(68,105,240,.06)' : 'transparent',
        transition: 'background 160ms',
        cursor: item.soon ? 'default' : 'pointer',
        opacity: item.soon ? 0.6 : 1,
      }}
    >
      <span
        style={{
          flex: '0 0 auto',
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'rgba(68,105,240,.09)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon d={item.icon} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-.1px',
            color: '#050816',
          }}
        >
          {item.title}
          {item.soon && <SoonPill />}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 13,
            lineHeight: '18px',
            color: '#5D5D5E',
            marginTop: 2,
          }}
        >
          {item.desc}
        </span>
      </span>
    </div>
  );
  if (item.soon) return inner;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      {inner}
    </Link>
  );
}
