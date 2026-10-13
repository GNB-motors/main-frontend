import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MENU } from './mega-nav/megaNavMenu.js';
import MenuRow from './mega-nav/MenuRow.jsx';

/* Reusable GNB Edge marketing nav with a desktop mega-menu and a mobile drawer.
   Menu items link to the real page routes; pages not built yet are marked
   "Soon" and are non-navigating until their route exists. */

export default function MegaNav() {
  const [open, setOpen] = useState(null); // active desktop dropdown label
  const [drawer, setDrawer] = useState(false); // mobile drawer open
  const [mobile, setMobile] = useState(false);
  const closeTimer = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 940px)');
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // small delay so moving the cursor from trigger to panel doesn't close it
  const openMenu = (label) => {
    clearTimeout(closeTimer.current);
    setOpen(label);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };

  const Logo = (
    <Link
      to="/"
      onClick={() => setDrawer(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        color: '#050816',
        textDecoration: 'none',
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: 'var(--nova-gradient-rage)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          color: '#fff',
          letterSpacing: '-.5px',
        }}
      >
        G
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 19,
          letterSpacing: '-.3px',
          whiteSpace: 'nowrap',
        }}
      >
        GNB Edge
      </span>
    </Link>
  );

  const Login = (
    <Link
      to="/login"
      data-navlogin
      onClick={() => setDrawer(false)}
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        fontWeight: 600,
        color: '#050816',
        padding: '10px 14px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        textDecoration: 'none',
      }}
    >
      Login
    </Link>
  );

  const Cta = (
    <Link
      to="/contact-us"
      data-navcta
      onClick={() => setDrawer(false)}
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        fontWeight: 600,
        color: '#FFFFFF',
        background: 'var(--nova-rage-400)',
        border: '1px solid var(--nova-rage-800)',
        padding: '12px 26px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        textDecoration: 'none',
      }}
    >
      Reach us
    </Link>
  );

  return (
    <div
      data-mega
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 80,
        padding: '0 40px',
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(5,8,22,.08)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <div data-navzone style={{ display: 'flex', alignItems: 'center', gap: 26, height: 78 }}>
          {Logo}

          {/* desktop menu */}
          {!mobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 12 }}>
              {MENU.map((group) => (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- hover-intent wrapper spanning the trigger and its panel; a keyboard path for the dropdown would change how it opens, so it is left as is (reported)
                <div
                  key={group.label}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => openMenu(group.label)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      font: 'inherit',
                      fontFamily: 'var(--font-ui)',
                      fontSize: 15,
                      fontWeight: 500,
                      color: open === group.label ? 'var(--nova-rage-600)' : '#050816',
                      padding: '10px 12px',
                      borderRadius: 10,
                    }}
                  >
                    {group.label}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: open === group.label ? 'rotate(180deg)' : 'none',
                        transition: 'transform 180ms',
                      }}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {open === group.label && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 10 }}>
                      <div
                        style={{
                          width: 360,
                          background: '#FFFFFF',
                          border: '1px solid rgba(5,8,22,.08)',
                          borderRadius: 16,
                          boxShadow: 'var(--shadow-lg)',
                          padding: 8,
                        }}
                      >
                        {group.items.map((item) => (
                          <MenuRow key={item.title} item={item} onNavigate={() => setOpen(null)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {mobile && (
              <button
                type="button"
                aria-label="Menu"
                onClick={() => setDrawer((v) => !v)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: '#F4F5FA',
                  border: '1px solid rgba(5,8,22,.10)',
                  color: '#050816',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {drawer ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  >
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </button>
            )}
            {Login}
            {Cta}
          </div>
        </div>

        {/* mobile drawer */}
        {mobile && drawer && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 10,
              background: '#FFFFFF',
              border: '1px solid rgba(5,8,22,.08)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-lg)',
              padding: 12,
              maxHeight: '78vh',
              overflowY: 'auto',
            }}
          >
            {MENU.map((group) => (
              <div key={group.label} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-eyebrow)',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '.24em',
                    textTransform: 'uppercase',
                    color: '#93939A',
                    padding: '8px 12px 4px',
                  }}
                >
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <MenuRow key={item.title} item={item} onNavigate={() => setDrawer(false)} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
