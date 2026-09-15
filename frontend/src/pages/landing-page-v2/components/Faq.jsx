import { useState } from 'react';

const FAQS = [
  {
    q: 'What exactly is GNB Edge?',
    a: 'GNB Edge is a unified fleet operating platform. It brings vehicle tracking, trip and dispatch management, ERP, CRM, GST and e-way bill compliance, ledgers, payments and reporting onto one system, replacing the disconnected stack most transport businesses run today.',
  },
  {
    q: 'Who is GNB Edge built for?',
    a: 'Three kinds of operation: single owners running one or two trucks, contract fleets serving dedicated clients, and enterprise networks with multiple depots, entities and GSTINs. The same platform scales across all three.',
  },
  {
    q: 'Do you have a mobile app?',
    a: 'Yes. There are two surfaces: a mobile app for owners and drivers, and the web platform for owners and office staff. In the app a driver sees his assigned vehicle and trip details and raises advances for fuel, tolls and food and sees his own earnings and trip payouts; the owner approves every request and tracks trips, fuel and mileage. Everything reads and writes the same record, and the public API covers the rest.',
  },
  {
    q: 'Does it replace my existing software?',
    a: 'In most cases, yes. GNB Edge consolidates tracking, dispatch, ERP, CRM, invoicing, ledgers, payments and reporting so your team stops logging into separate systems. Where you want to keep a tool, we integrate with it instead.',
  },
  {
    q: 'How does GST and e-way bill filing work?',
    a: 'Both are generated directly from the trip and consignment record. Invoices come out GSTR-ready with HSN, place of supply and reverse charge handled, and e-way bills can be generated, extended or cancelled without re-entering data.',
  },
  {
    q: 'How does fuel theft detection work?',
    a: 'For every trip, an odometer photo and a fuel bill photo are uploaded through the app, the web platform or the WhatsApp bot. GNB Edge calculates the vehicle’s actual mileage using the full-tank-to-full-tank method, then compares it against fuel consumption data from vehicle hardware and telematics and other available data points. Anything outside the expected range is flagged as unusual fuel usage or potential theft, with a fuel audit raised against the trip and vehicle.',
  },
  {
    q: 'Is fleet data updated in real time?',
    a: 'Yes. Telemetry refreshes across the live fleet map every 30 seconds, and trip, expense and ledger data updates as it happens rather than in overnight batches.',
  },
  {
    q: 'How long does implementation take?',
    a: 'A single-depot fleet is typically live within a week. Multi-depot networks average four days of rollout per region once master data is mapped, with a dedicated implementation team on Enterprise plans.',
  },
  {
    q: 'How do I get started?',
    a: 'Book a demo. We walk your current operation, map which of your systems consolidate onto GNB Edge, and show tracking, dispatch, compliance and finance working together on live data from your own routes.',
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div style={{ borderTop: '1px solid rgba(5,8,22,.10)' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', padding: '24px 0', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}
      >
        <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-.2px', color: '#050816' }}>{item.q}</span>
        <span style={{ flex: '0 0 auto', width: '34px', height: '34px', borderRadius: '999px', display: 'grid', placeItems: 'center', border: '1px solid rgba(5,8,22,.12)', color: '#050816', background: isOpen ? '#F4F5FA' : 'transparent', transition: 'background 200ms cubic-bezier(.2,0,0,1)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" style={{ transition: 'opacity 200ms cubic-bezier(.2,0,0,1)', opacity: isOpen ? 0 : 1 }} />
          </svg>
        </span>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 320ms cubic-bezier(.2,0,0,1)' }}>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: '16px', lineHeight: '26px', color: '#5D5D5E', padding: '0 60px 26px 0' }}>{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section data-screen-label="FAQ" style={{ background: '#F4F5FA', padding: '112px 40px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '.8fr 1.2fr', gap: '80px', alignItems: 'center' }}>
        <div data-reveal>
          <div style={{ fontFamily: 'var(--font-eyebrow)', fontSize: '11px', fontWeight: 500, letterSpacing: '.44em', textTransform: 'uppercase', color: 'var(--nova-rage-600)', marginBottom: '20px' }}>Questions</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '42px', lineHeight: '1.1', letterSpacing: '-1.3px', margin: 0, textWrap: 'pretty' }}>
            Frequently asked{' '}
            <span style={{ color: 'var(--nova-rage-400)' }}>questions.</span>
          </h2>
          <p style={{ fontSize: '17px', lineHeight: '28px', color: '#5D5D5E', margin: '22px 0 0' }}>Still unsure whether GNB Edge fits your operation? Book a walkthrough and we will map your current stack module by module.</p>
        </div>
        <div data-reveal style={{ display: 'flex', flexDirection: 'column' }}>
          {FAQS.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
