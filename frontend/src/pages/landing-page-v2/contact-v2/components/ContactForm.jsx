export default function ContactForm() {
  return (
    <section id="contact-form" data-screen-label="Contact form" style={{ background: "#FFFFFF", padding: "96px 40px 112px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.25fr .85fr", gap: "72px", alignItems: "start" }}>
        <div data-reveal>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", borderRadius: "var(--radius-xtra-soft)", boxShadow: "var(--shadow-lg)", padding: "40px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", marginBottom: "8px" }}>Send us the details</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginBottom: "32px" }}>We reply within one working day, usually the same afternoon.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Your name</span>
                <input type="text" placeholder="Full name" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Company</span>
                <input type="text" placeholder="Registered business name" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Work email</span>
                <input type="email" placeholder="you@company.com" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Phone</span>
                <input type="tel" placeholder="+91" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Fleet size</span>
                <select>
                  <option>1 to 5 vehicles</option>
                  <option>6 to 25 vehicles</option>
                  <option>26 to 100 vehicles</option>
                  <option>101 to 500 vehicles</option>
                  <option>More than 500 vehicles</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Where you operate</span>
                <input type="text" placeholder="City or states" />
              </label>
            </div>
            <div style={{ marginTop: "28px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", marginBottom: "13px" }}>What do you want to talk about</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <button type="button" style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: "500", letterSpacing: "-.1px", padding: "11px 18px", borderRadius: "999px", cursor: "pointer", transition: "background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.14)", color: "#5D5D5E" }}>A demo</button>
                <button type="button" style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: "500", letterSpacing: "-.1px", padding: "11px 18px", borderRadius: "999px", cursor: "pointer", transition: "background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.14)", color: "#5D5D5E" }}>Pricing</button>
                <button type="button" style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: "500", letterSpacing: "-.1px", padding: "11px 18px", borderRadius: "999px", cursor: "pointer", transition: "background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.14)", color: "#5D5D5E" }}>Moving off another system</button>
                <button type="button" style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: "500", letterSpacing: "-.1px", padding: "11px 18px", borderRadius: "999px", cursor: "pointer", transition: "background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.14)", color: "#5D5D5E" }}>Hardware and GPS devices</button>
                <button type="button" style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: "500", letterSpacing: "-.1px", padding: "11px 18px", borderRadius: "999px", cursor: "pointer", transition: "background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.14)", color: "#5D5D5E" }}>AI and reporting</button>
                <button type="button" style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: "500", letterSpacing: "-.1px", padding: "11px 18px", borderRadius: "999px", cursor: "pointer", transition: "background 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.14)", color: "#5D5D5E" }}>Partnership</button>
              </div>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "28px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Anything we should know</span>
              <textarea rows="4" placeholder="What you run today, what is breaking, what you want to fix first" />
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", marginTop: "32px" }}>
              <button type="button" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", padding: "17px 40px", borderRadius: "999px", cursor: "pointer", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Send enquiry</button>
              <span style={{ fontSize: "13px", lineHeight: "20px", color: "#93939A", maxWidth: "280px" }}>We use these details only to reply to you. Nothing is shared outside GNB Edge.</span>
            </div>
          </div>
        </div>
        <div data-reveal-group style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ background: "#F4F5FA", borderRadius: "var(--radius-xl)", padding: "26px 26px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6.5 12 13l9-6.5" />
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                </svg>
              </span>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px" }}>Sales</div>
            </div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E" }}>New deployments, pricing and demos.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "16px" }}>
              <a href="mailto:gnbmotors60@gmail.com" style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>gnbmotors60@gmail.com</a>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#5D5D5E" }}>+91 00000 00000</span>
            </div>
          </div>
          <div style={{ background: "#F4F5FA", borderRadius: "var(--radius-xl)", padding: "26px 26px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
                  <path d="M9.5 12l1.8 1.8 3.4-3.4" />
                </svg>
              </span>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px" }}>Support</div>
            </div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E" }}>For fleets already live on GNB Edge.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "16px" }}>
              <a href="mailto:gnbmotors60@gmail.com" style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>gnbmotors60@gmail.com</a>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#5D5D5E" }}>Mon–Sat · 08:00–21:00</span>
            </div>
          </div>
          <div style={{ background: "#F4F5FA", borderRadius: "var(--radius-xl)", padding: "26px 26px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px" }}>Head office</div>
            </div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E" }}>Kolkata · add your registered address here</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#5D5D5E", marginTop: "16px" }}>Mon–Sat · 09:30–19:00</div>
          </div>
          <div style={{ borderRadius: "var(--radius-xl)", padding: "26px", background: "linear-gradient(150deg, #2F58EE 0%, #213EA7 100%)", color: "#FFFFFF" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px" }}>Already a customer?</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "rgba(255,255,255,.82)", marginTop: "10px" }}>Raise a ticket from inside the platform and it lands with your named implementation lead.</div>
            <a href="/" style={{ display: "inline-block", marginTop: "18px", fontSize: "15px", fontWeight: "600", color: "#FFFFFF" }}>Open the portal →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
