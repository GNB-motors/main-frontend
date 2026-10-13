import ContactChannels from './contact-form/ContactChannels.jsx';

export default function ContactForm() {
  return (
    <section
      id="contact-form"
      data-screen-label="Contact form"
      style={{ background: '#FFFFFF', padding: '96px 40px 112px' }}
    >
      <div
        data-mcol
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.25fr .85fr',
          gap: '72px',
          alignItems: 'start',
        }}
      >
        <div data-reveal>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(5,8,22,.08)',
              borderRadius: 'var(--radius-xtra-soft)',
              boxShadow: 'var(--shadow-lg)',
              padding: '40px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '26px',
                letterSpacing: '-.9px',
                marginBottom: '8px',
              }}
            >
              Send us the details
            </div>
            <div
              style={{
                fontSize: '15px',
                lineHeight: '24px',
                color: '#5D5D5E',
                marginBottom: '32px',
              }}
            >
              We reply within one working day, usually the same afternoon.
            </div>
            <div
              data-mcol2
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-.1px' }}>
                  Your name
                </span>
                <input type="text" placeholder="Full name" aria-label="Your name" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-.1px' }}>
                  Company
                </span>
                <input type="text" placeholder="Registered business name" aria-label="Company" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-.1px' }}>
                  Work email
                </span>
                <input type="email" placeholder="you@company.com" aria-label="Work email" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-.1px' }}>
                  Phone
                </span>
                <input type="tel" placeholder="+91" aria-label="Phone" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-.1px' }}>
                  Fleet size
                </span>
                <select>
                  <option>1 to 5 vehicles</option>
                  <option>6 to 25 vehicles</option>
                  <option>26 to 100 vehicles</option>
                  <option>101 to 500 vehicles</option>
                  <option>More than 500 vehicles</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-.1px' }}>
                  Where you operate
                </span>
                <input type="text" placeholder="City or states" aria-label="Where you operate" />
              </label>
            </div>
            <div style={{ marginTop: '28px' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  letterSpacing: '-.1px',
                  marginBottom: '13px',
                }}
              >
                What do you want to talk about
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  type="button"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '-.1px',
                    padding: '11px 18px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition:
                      'background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)',
                    background: '#FFFFFF',
                    border: '1px solid rgba(5,8,22,.14)',
                    color: '#5D5D5E',
                  }}
                >
                  A demo
                </button>
                <button
                  type="button"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '-.1px',
                    padding: '11px 18px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition:
                      'background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)',
                    background: '#FFFFFF',
                    border: '1px solid rgba(5,8,22,.14)',
                    color: '#5D5D5E',
                  }}
                >
                  Pricing
                </button>
                <button
                  type="button"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '-.1px',
                    padding: '11px 18px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition:
                      'background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)',
                    background: '#FFFFFF',
                    border: '1px solid rgba(5,8,22,.14)',
                    color: '#5D5D5E',
                  }}
                >
                  Moving off another system
                </button>
                <button
                  type="button"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '-.1px',
                    padding: '11px 18px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition:
                      'background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)',
                    background: '#FFFFFF',
                    border: '1px solid rgba(5,8,22,.14)',
                    color: '#5D5D5E',
                  }}
                >
                  Hardware and GPS devices
                </button>
                <button
                  type="button"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '-.1px',
                    padding: '11px 18px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition:
                      'background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)',
                    background: '#FFFFFF',
                    border: '1px solid rgba(5,8,22,.14)',
                    color: '#5D5D5E',
                  }}
                >
                  AI and reporting
                </button>
                <button
                  type="button"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '-.1px',
                    padding: '11px 18px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition:
                      'background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)',
                    background: '#FFFFFF',
                    border: '1px solid rgba(5,8,22,.14)',
                    color: '#5D5D5E',
                  }}
                >
                  Partnership
                </button>
              </div>
            </div>
            <label
              style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '28px' }}
            >
              <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-.1px' }}>
                Anything we should know
              </span>
              <textarea
                rows="4"
                aria-label="Anything we should know"
                placeholder="What you run today, what is breaking, what you want to fix first"
              />
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                marginTop: '32px',
              }}
            >
              <button
                type="button"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  background: 'var(--nova-rage-400)',
                  border: '1px solid var(--nova-rage-800)',
                  padding: '17px 40px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'background 200ms cubic-bezier(.2,0,0,1)',
                }}
              >
                Send enquiry
              </button>
              <span
                style={{
                  fontSize: '13px',
                  lineHeight: '20px',
                  color: '#93939A',
                  maxWidth: '280px',
                }}
              >
                We use these details only to reply to you. Nothing is shared outside GNB Edge.
              </span>
            </div>
          </div>
        </div>
        <ContactChannels />
      </div>
    </section>
  );
}
