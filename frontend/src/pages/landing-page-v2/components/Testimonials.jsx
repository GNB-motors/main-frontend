import { useState } from 'react';

const CARDS = [
  {
    tag: 'Enterprise · 1,240 vehicles',
    title: '12 systems collapsed into one',
    body: 'Tracking, billing, ledgers and compliance used to live in four different places. Now every consignment carries its own paperwork from the moment it is booked.',
    role: 'Head of Operations',
    org: 'National logistics group',
  },
  {
    tag: 'Multi-depot · 18 branches',
    title: '92% less paperwork re-entry',
    body: 'E-way bills come straight off the trip record. Our accounts team stopped re-typing the same consignment three times and closes the month four days earlier.',
    role: 'Finance Controller',
    org: 'Regional transport network',
  },
  {
    tag: 'Single owner · 1 → 14 trucks',
    title: '₹19 lakh recovered in fuel',
    body: 'Fuel variance reporting showed us pilferage on two routes we had no visibility into. That paid for the platform in the first quarter.',
    role: 'Managing Director',
    org: 'Contract fleet operator',
  },
];

function Arrow({ dir, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous' : 'Next'}
      style={{ width: '46px', height: '46px', borderRadius: '999px', background: '#F4F5FA', border: '1px solid rgba(5,8,22,.10)', color: '#050816', cursor: disabled ? 'default' : 'pointer', display: 'grid', placeItems: 'center', opacity: disabled ? 0.4 : 1, transition: 'background 200ms cubic-bezier(.2,0,0,1), opacity 200ms' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

export default function Testimonials() {
  const [i, setI] = useState(0);
  const max = Math.max(0, CARDS.length - 2); // 2.4 cards visible -> stop when last card is in view

  return (
    <section data-screen-label="Testimonials" style={{ background: '#FFFFFF', padding: '112px 40px', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div data-reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '760px' }}>
            <div style={{ fontFamily: 'var(--font-eyebrow)', fontSize: '11px', fontWeight: 500, letterSpacing: '.44em', textTransform: 'uppercase', color: 'var(--nova-rage-600)', marginBottom: '20px' }}>Outcomes</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '46px', lineHeight: '1.08', letterSpacing: '-1.5px', margin: 0, textWrap: 'pretty' }}>
              What operators achieve{' '}
              <span style={{ color: 'var(--nova-rage-400)' }}>with GNB Edge.</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Arrow dir="prev" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))} />
            <Arrow dir="next" disabled={i >= max} onClick={() => setI((v) => Math.min(max, v + 1))} />
          </div>
        </div>
        <div data-reveal style={{ marginTop: '52px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '20px', transition: 'transform 520ms cubic-bezier(.2,0,0,1)', transform: `translateX(calc(${-i} * ((100% - 40px) / 2.4 + 20px)))` }}>
            {CARDS.map((c, idx) => (
              <div key={idx} style={{ flex: '0 0 calc((100% - 40px)/2.4)', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: '36px 34px 34px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'var(--font-eyebrow)', fontSize: '11px', fontWeight: 500, letterSpacing: '.24em', textTransform: 'uppercase', color: '#93939A' }}>{c.tag}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '30px', lineHeight: '1.14', letterSpacing: '-1px', color: 'var(--nova-rage-400)', margin: '18px 0 20px', textWrap: 'pretty' }}>{c.title}</div>
                <div style={{ fontSize: '16px', lineHeight: '26px', color: '#5D5D5E', flex: 1 }}>{c.body}</div>
                <div style={{ marginTop: '26px', paddingTop: '22px', borderTop: '1px solid rgba(5,8,22,.10)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#050816' }}>{c.role}</div>
                  <div style={{ fontSize: '14px', color: '#93939A', marginTop: '3px' }}>{c.org}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
