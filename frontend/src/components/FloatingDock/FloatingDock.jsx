import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FloatingDock.css';

const DOCK_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'trips',
    label: 'Trips',
    path: '/trip-management',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 3h15v13H1z" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'new-trip',
    label: 'New Trip',
    path: '/trip/new',
    primary: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'fuel',
    label: 'Fuel',
    path: '/fuel-comparison',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18" />
        <path d="M3 22h12" />
        <path d="M11 3h2a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V7l-3-4" />
        <line x1="7" y1="8" x2="9" y2="8" />
      </svg>
    ),
  },
];

const FloatingDock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tooltip, setTooltip] = useState(null);

  return (
    <nav className="floating-dock" aria-label="Quick access">
      <div className="floating-dock__track">
        {DOCK_ITEMS.map((item) => {
          const isActive = !item.primary && location.pathname === item.path;
          return (
            <button
              key={item.id}
              className={[
                'floating-dock__item',
                item.primary ? 'floating-dock__item--primary' : '',
                isActive ? 'floating-dock__item--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setTooltip(item.id)}
              onMouseLeave={() => setTooltip(null)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="floating-dock__icon">{item.icon}</span>
              <span
                className={`floating-dock__tooltip ${tooltip === item.id ? 'floating-dock__tooltip--visible' : ''}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default FloatingDock;
