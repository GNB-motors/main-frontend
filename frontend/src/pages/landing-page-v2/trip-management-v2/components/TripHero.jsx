export default function TripHero() {
  return (
    <section data-screen-label="Trip hero" style={{ position: "relative", background: "#F4F5FA", padding: "104px 40px 88px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0", background: "radial-gradient(880px 500px at 82% 2%, rgba(68,105,240,.11), transparent 68%), radial-gradient(680px 440px at 4% 46%, rgba(68,105,240,.06), transparent 70%)" }} />
      <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(5,8,22,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(5,8,22,.035) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(circle at 60% 30%, #000, transparent 74%)" }} />
      <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr .92fr", gap: "64px", alignItems: "center" }}>
        <div data-reveal-group>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "26px" }}>
            <span style={{ width: "44px", height: "2px", background: "var(--nova-rage-400)" }} />
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "12px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Fleet · Trip management</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "5px 12px", borderRadius: "999px", background: "rgba(68,105,240,.10)", border: "1px solid rgba(68,105,240,.22)", color: "#4469F0" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
              </svg>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>AI native</span>
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "58px", lineHeight: "1.05", letterSpacing: "-2px", margin: "0", textWrap: "pretty" }}>
            Plan it, cost it, close it.{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>One trip record.</span>
          </h1>
          <p style={{ fontSize: "18px", lineHeight: "30px", color: "#5D5D5E", margin: "28px 0 0", maxWidth: "540px", textWrap: "pretty" }}>From booking to POD to invoice, every consignment carries its own vehicle, driver, expenses and paperwork, so nothing is reconstructed from memory at month end.</p>
          <div style={{ display: "flex", gap: "14px", marginTop: "40px" }}>
            <a href="#tm-demo" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Book a demo</a>
            <a href="/" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#050816", background: "transparent", border: "1px solid rgba(5,8,22,.16)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>All modules</a>
          </div>
        </div>
        <div data-reveal style={{ position: "relative", borderRadius: "var(--radius-soft)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", boxShadow: "var(--shadow-lg)", padding: "34px", display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A" }}>Trip · GNB/2026/04817</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "24px", letterSpacing: "-.9px", marginTop: "8px" }}>Mumbai → Nagpur</div>
            </div>
            <div style={{ flex: "0 0 auto", fontSize: "11px", fontWeight: "600", padding: "6px 12px", borderRadius: "999px", background: "rgba(68,105,240,.10)", color: "var(--nova-rage-600)" }}>In transit</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>MH-40-BX-2291</span>
            <span style={{ width: "4px", height: "4px", borderRadius: "999px", background: "#C9C9CE" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>R. Kumar</span>
            <span style={{ width: "4px", height: "4px", borderRadius: "999px", background: "#C9C9CE" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>18.4 t</span>
          </div>
          <div style={{ position: "relative", padding: "4px 0 2px" }}>
            <svg viewBox="0 0 300 8" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "8px" }}>
              <path d="M4 4 H296" stroke="rgba(68,105,240,.16)" strokeWidth="4" strokeLinecap="round" />
              <path d="M4 4 H296" stroke="#4469F0" strokeWidth="4" strokeLinecap="round" strokeDasharray="300" style={{ animation: "tm-track 1.5s cubic-bezier(.2,0,0,1) both .35s" }} />
            </svg>
            <div style={{ position: "absolute", left: "68%", top: "-4px", width: "16px", height: "16px", marginLeft: "-8px", borderRadius: "999px", background: "rgba(68,105,240,.34)", animation: "tm-pulse 2.4s ease-in-out infinite" }} />
            <div style={{ position: "absolute", left: "68%", top: "0", width: "8px", height: "8px", marginLeft: "-4px", borderRadius: "999px", background: "#2F58EE" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px", minHeight: "0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "12px 15px", borderRadius: "12px", background: "#F4F5FA", animation: "tm-step 460ms cubic-bezier(.2,0,0,1) both .5s" }}>
              <span style={{ flex: "0 0 auto", width: "26px", height: "26px", borderRadius: "999px", background: "rgba(24,122,50,.12)", display: "grid", placeItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#187A32" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span style={{ flex: "1", fontSize: "14px", fontWeight: "500" }}>Booked and costed</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>08:10</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "12px 15px", borderRadius: "12px", background: "#F4F5FA", animation: "tm-step 460ms cubic-bezier(.2,0,0,1) both .62s" }}>
              <span style={{ flex: "0 0 auto", width: "26px", height: "26px", borderRadius: "999px", background: "rgba(24,122,50,.12)", display: "grid", placeItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#187A32" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span style={{ flex: "1", fontSize: "14px", fontWeight: "500" }}>E-way bill generated</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>08:26</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "12px 15px", borderRadius: "12px", background: "rgba(68,105,240,.06)", animation: "tm-step 460ms cubic-bezier(.2,0,0,1) both .74s" }}>
              <span style={{ flex: "0 0 auto", width: "26px", height: "26px", borderRadius: "999px", background: "rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3.5 2" />
                </svg>
              </span>
              <span style={{ flex: "1", fontSize: "14px", fontWeight: "500", color: "var(--nova-rage-700)" }}>In transit · 68%</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)" }}>now</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "12px 15px", borderRadius: "12px", background: "#F4F5FA", opacity: ".62", animation: "tm-step 460ms cubic-bezier(.2,0,0,1) both .86s" }}>
              <span style={{ flex: "0 0 auto", width: "26px", height: "26px", borderRadius: "999px", border: "1.5px dashed rgba(5,8,22,.22)" }} />
              <span style={{ flex: "1", fontSize: "14px", fontWeight: "500", color: "#5D5D5E" }}>POD and invoice</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>pending</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "18px", borderTop: "1px solid rgba(5,8,22,.08)" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#93939A" }}>Costed</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", letterSpacing: "-.5px" }}>₹42,600</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#93939A" }}>Actual so far</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", letterSpacing: "-.5px" }}>₹39,180</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#93939A" }}>Margin</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "18px", letterSpacing: "-.5px", color: "var(--nova-fern-700)" }}>+8%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
