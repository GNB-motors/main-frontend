export default function DriverHero() {
  return (
    <section data-screen-label="Driver hero" style={{ position: "relative", background: "#F4F5FA", padding: "104px 40px 88px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0", background: "radial-gradient(880px 500px at 82% 2%, rgba(68,105,240,.11), transparent 68%), radial-gradient(680px 440px at 4% 46%, rgba(68,105,240,.06), transparent 70%)" }} />
      <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(5,8,22,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(5,8,22,.035) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(circle at 60% 30%, #000, transparent 74%)" }} />
      <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr .92fr", gap: "64px", alignItems: "center" }}>
        <div data-reveal-group>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "26px" }}>
            <span style={{ width: "44px", height: "2px", background: "var(--nova-rage-400)" }} />
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "12px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Fleet · Driver management</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "5px 12px", borderRadius: "999px", background: "rgba(68,105,240,.10)", border: "1px solid rgba(68,105,240,.22)", color: "#4469F0" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
              </svg>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>AI native</span>
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "58px", lineHeight: "1.05", letterSpacing: "-2px", margin: "0", textWrap: "pretty" }}>
            Every driver, every licence,{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>every settlement.</span>
          </h1>
          <p style={{ fontSize: "18px", lineHeight: "30px", color: "#5D5D5E", margin: "28px 0 0", maxWidth: "540px", textWrap: "pretty" }}>Licence expiry that warns you a month out, duty hours counted against the trip, and driver advances settled against the same ledger your accounts team already uses.</p>
          <div style={{ display: "flex", gap: "14px", marginTop: "40px" }}>
            <a href="#dm-demo" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Book a demo</a>
            <a href="/" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#050816", background: "transparent", border: "1px solid rgba(5,8,22,.16)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>All modules</a>
          </div>
        </div>
        <div data-reveal style={{ position: "relative", borderRadius: "var(--radius-soft)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", boxShadow: "var(--shadow-lg)", padding: "34px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A" }}>Duty roster · today</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--nova-rage-600)" }}>18 on duty</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
            <div style={{ position: "relative", width: "104px", height: "104px", flex: "0 0 auto" }}>
              <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(68,105,240,.12)" strokeWidth="11" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#4469F0" strokeWidth="11" strokeLinecap="round" strokeDasharray="314" style={{ animation: "dm-fill 1.4s cubic-bezier(.2,0,0,1) both .3s" }} />
              </svg>
              <div style={{ position: "absolute", inset: "0", display: "grid", placeItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "24px", letterSpacing: "-1px", lineHeight: "1" }}>72%</div>
                  <div style={{ fontSize: "10px", color: "#93939A", marginTop: "2px" }}>utilised</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: "1" }}>
              <div>
                <div style={{ fontSize: "13px", color: "#5D5D5E" }}>Duty hours logged</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", letterSpacing: "-.6px" }}>148 h</div>
              </div>
              <div style={{ height: "1px", background: "rgba(5,8,22,.08)" }} />
              <div>
                <div style={{ fontSize: "13px", color: "#5D5D5E" }}>Licences expiring in 30 days</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", letterSpacing: "-.6px", color: "var(--nova-blaze-500)" }}>3</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px", flex: "1", minHeight: "0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA", animation: "dm-rise 460ms cubic-bezier(.2,0,0,1) both .5s" }}>
              <span style={{ flex: "0 0 auto", width: "32px", height: "32px", borderRadius: "999px", background: "rgba(68,105,240,.12)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", color: "var(--nova-rage-600)" }}>RK</span>
              <span style={{ flex: "1", fontSize: "14px", fontWeight: "500" }}>Ramesh Kumar</span>
              <span style={{ fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "999px", background: "rgba(24,122,50,.10)", color: "var(--nova-fern-700)" }}>On trip</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA", animation: "dm-rise 460ms cubic-bezier(.2,0,0,1) both .62s" }}>
              <span style={{ flex: "0 0 auto", width: "32px", height: "32px", borderRadius: "999px", background: "rgba(68,105,240,.12)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", color: "var(--nova-rage-600)" }}>SP</span>
              <span style={{ flex: "1", fontSize: "14px", fontWeight: "500" }}>Suresh Patil</span>
              <span style={{ fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "999px", background: "rgba(68,105,240,.10)", color: "var(--nova-rage-600)" }}>Available</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA", animation: "dm-rise 460ms cubic-bezier(.2,0,0,1) both .74s" }}>
              <span style={{ flex: "0 0 auto", width: "32px", height: "32px", borderRadius: "999px", background: "rgba(68,105,240,.12)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", color: "var(--nova-rage-600)" }}>AY</span>
              <span style={{ flex: "1", fontSize: "14px", fontWeight: "500" }}>Arun Yadav</span>
              <span style={{ fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "999px", background: "rgba(229,104,107,.12)", color: "var(--nova-blaze-700)" }}>Licence due</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
