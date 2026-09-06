import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* Reusable GNB Edge marketing nav with a desktop mega-menu and a mobile drawer.
   Menu items link to the real page routes; pages not built yet are marked
   "Soon" and are non-navigating until their route exists. */

function Icon({ d }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--nova-rage-400)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const MENU = [
  {
    label: 'Platform',
    items: [
      { title: 'Live Fleet Map', desc: 'Every vehicle on one live map', to: '/live-fleet-map', icon: ['M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3z', 'M9 7v13', 'M15 4v13'] },
      { title: 'Vehicle Tracking', desc: 'GPS, geofences and halt detection', to: '/vehicle-tracking', icon: ['M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z', 'M12 10a2.5 2.5 0 1 0 0-.01'] },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { title: 'Trip Management', desc: 'Booking to invoice on one record', to: '/trips', icon: ['M6 18a2.5 2.5 0 1 0 0-.01', 'M18 6a2.5 2.5 0 1 0 0-.01', 'M8.5 18h5a4 4 0 0 0 4-4V8.5'] },
      { title: 'Driver Management', desc: 'Licences, duty hours, settlements', to: '/driver-management', icon: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M5 21c0-3.5 3-6 7-6s7 2.5 7 6'] },
      { title: 'Fuel & Mileage', desc: 'Variance and theft detection', to: '/fuel-and-mileage', icon: ['M5 3h9v18H5z', 'M9 3v6h5', 'M14 8h3v9a2 2 0 0 1-4 0'] },
    ],
  },
  {
    label: 'Customers',
    items: [
      { title: 'Single Owners', desc: 'Run the business from your phone', to: '/single-owners', icon: ['M7 2.5h10v19H7z', 'M11 18.5h2'] },
      { title: 'Contract Fleets', desc: 'SLA tracking and client reporting', to: '/contract-fleets', icon: ['M5 21V7l7-4 7 4v14', 'M9 21v-6h6v6'] },
      { title: 'Enterprise', desc: 'Multi-entity, centralised control', to: '/enterprise', icon: ['M4 21V5l8-3v19', 'M12 21V8l8 3v10', 'M4 21h16'] },
    ],
  },
  {
    label: 'Company',
    items: [
      { title: 'About GNB Edge', desc: 'Who we are and how we work', to: '/about', icon: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5', 'M12 8h.01'] },
      { title: 'Contact us', desc: 'Talk to the team', to: '/contact-us', icon: ['M4 5h16v14H4z', 'm4 6 8 6 8-6'] },
    ],
  },
];

function SoonPill() {
  return (
    <span style={{ marginLeft: 8, fontFamily: 'var(--font-eyebrow)', fontSize: 9, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--nova-rage-600)', background: 'rgba(68,105,240,.10)', border: '1px solid rgba(68,105,240,.22)', borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap' }}>Soon</span>
  );
}

function MenuRow({ item, onNavigate }) {
  const [hover, setHover] = useState(false);
  const inner = (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '11px 12px', borderRadius: 12, background: hover && !item.soon ? 'rgba(68,105,240,.06)' : 'transparent', transition: 'background 160ms', cursor: item.soon ? 'default' : 'pointer', opacity: item.soon ? 0.6 : 1 }}
    >
      <span style={{ flex: '0 0 auto', width: 36, height: 36, borderRadius: 10, background: 'rgba(68,105,240,.09)', display: 'grid', placeItems: 'center' }}>
        <Icon d={item.icon} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 600, letterSpacing: '-.1px', color: '#050816' }}>
          {item.title}{item.soon && <SoonPill />}
        </span>
        <span style={{ display: 'block', fontSize: 13, lineHeight: '18px', color: '#5D5D5E', marginTop: 2 }}>{item.desc}</span>
      </span>
    </div>
  );
  if (item.soon) return inner;
  return (
    <Link to={item.to} onClick={onNavigate} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
  );
}

export default function MegaNav() {
  const [open, setOpen] = useState(null);      // active desktop dropdown label
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
  const openMenu = (label) => { clearTimeout(closeTimer.current); setOpen(label); };
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setOpen(null), 120); };

  const Logo = (
    <Link to="/" onClick={() => setDrawer(false)} style={{ display: 'flex', alignItems: 'center', gap: 11, color: '#050816', textDecoration: 'none' }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--nova-gradient-rage)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '-.5px' }}>G</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-.3px', whiteSpace: 'nowrap' }}>GNB Edge</span>
    </Link>
  );

  const Login = (
    <Link to="/login" onClick={() => setDrawer(false)} style={{ fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, color: '#050816', padding: '10px 14px', borderRadius: 999, whiteSpace: 'nowrap', textDecoration: 'none' }}>Login</Link>
  );

  const Cta = (
    <Link to="/contact-us" data-navcta onClick={() => setDrawer(false)} style={{ fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, color: '#FFFFFF', background: 'var(--nova-rage-400)', border: '1px solid var(--nova-rage-800)', padding: '12px 26px', borderRadius: 999, whiteSpace: 'nowrap', textDecoration: 'none' }}>Reach us</Link>
  );

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 80, padding: '0 40px', background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(5,8,22,.08)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <div data-navzone style={{ display: 'flex', alignItems: 'center', gap: 26, height: 78 }}>
          {Logo}

          {/* desktop menu */}
          {!mobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 12 }}>
              {MENU.map((group) => (
                <div key={group.label} style={{ position: 'relative' }} onMouseEnter={() => openMenu(group.label)} onMouseLeave={scheduleClose}>
                  <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 0, cursor: 'pointer', font: 'inherit', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500, color: open === group.label ? 'var(--nova-rage-600)' : '#050816', padding: '10px 12px', borderRadius: 10 }}>
                    {group.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open === group.label ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  {open === group.label && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 10 }}>
                      <div style={{ width: 360, background: '#FFFFFF', border: '1px solid rgba(5,8,22,.08)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', padding: 8 }}>
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
              <button type="button" aria-label="Menu" onClick={() => setDrawer((v) => !v)} style={{ width: 42, height: 42, borderRadius: 999, background: '#F4F5FA', border: '1px solid rgba(5,8,22,.10)', color: '#050816', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                {drawer
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
              </button>
            )}
            {Login}
            {Cta}
          </div>
        </div>

        {/* mobile drawer */}
        {mobile && drawer && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 10, background: '#FFFFFF', border: '1px solid rgba(5,8,22,.08)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', padding: 12, maxHeight: '78vh', overflowY: 'auto' }}>
            {MENU.map((group) => (
              <div key={group.label} style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-eyebrow)', fontSize: 11, fontWeight: 500, letterSpacing: '.24em', textTransform: 'uppercase', color: '#93939A', padding: '8px 12px 4px' }}>{group.label}</div>
                {group.items.map((item) => <MenuRow key={item.title} item={item} onNavigate={() => setDrawer(false)} />)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
