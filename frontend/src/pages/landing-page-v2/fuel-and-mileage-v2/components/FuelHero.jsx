export default function FuelHero() {
  return (
    <section data-screen-label="Fuel hero" style={{ position: "relative", background: "#F4F5FA", padding: "104px 40px 88px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0", background: "radial-gradient(880px 500px at 82% 2%, rgba(68,105,240,.11), transparent 68%), radial-gradient(680px 440px at 4% 46%, rgba(68,105,240,.06), transparent 70%)" }} />
      <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(5,8,22,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(5,8,22,.035) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(circle at 60% 30%, #000, transparent 74%)" }} />
      <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr .92fr", gap: "64px", alignItems: "center" }}>
        <div data-reveal-group>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "26px" }}>
            <span style={{ width: "44px", height: "2px", background: "var(--nova-rage-400)" }} />
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "12px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Fleet · Fuel and mileage</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "5px 12px", borderRadius: "999px", background: "rgba(68,105,240,.10)", border: "1px solid rgba(68,105,240,.22)", color: "#4469F0" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
              </svg>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>AI native</span>
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "58px", lineHeight: "1.05", letterSpacing: "-2px", margin: "0", textWrap: "pretty" }}>
            Fuel you paid for,{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>against distance you actually ran.</span>
          </h1>
          <p style={{ fontSize: "18px", lineHeight: "30px", color: "#5D5D5E", margin: "28px 0 0", maxWidth: "540px", textWrap: "pretty" }}>Sensor readings and refuelling entries measured against GPS distance, per vehicle and per route, so pilferage and drift surface on their own instead of at the end of the quarter.</p>
          <div style={{ display: "flex", gap: "14px", marginTop: "40px" }}>
            <a href="#fm-demo" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Book a demo</a>
            <a href="/" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#050816", background: "transparent", border: "1px solid rgba(5,8,22,.16)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>All modules</a>
          </div>
        </div>
        <div data-reveal style={{ position: "relative", borderRadius: "var(--radius-soft)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", aspectRatio: "1/.92", overflow: "hidden", boxShadow: "var(--shadow-lg)", padding: "34px", display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A" }}>Fuel variance · MH-40-BX-2291</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "28px", letterSpacing: "-1.1px", marginTop: "8px" }}>
                3.8 km/l{' '}
                <span style={{ fontSize: "15px", fontWeight: "400", color: "#93939A", letterSpacing: "0" }}>actual</span>
              </div>
            </div>
            <div style={{ flex: "0 0 auto", fontSize: "11px", fontWeight: "600", padding: "6px 12px", borderRadius: "999px", background: "rgba(229,104,107,.12)", color: "var(--nova-blaze-700)", animation: "fm-flag 460ms cubic-bezier(.2,0,0,1) both 1.1s" }}>−14% vs plan</div>
          </div>
          <div style={{ position: "relative", flex: "1", minHeight: "0" }}>
            <svg viewBox="0 0 320 180" preserveAspectRatio="none" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" }}>
              <path d="M0 45 H320" stroke="rgba(5,8,22,.07)" strokeWidth="1" />
              <path d="M0 90 H320" stroke="rgba(5,8,22,.07)" strokeWidth="1" />
              <path d="M0 135 H320" stroke="rgba(5,8,22,.07)" strokeWidth="1" />
              <path d="M4 62 C50 58 74 66 104 64 C140 62 168 70 196 96 C226 124 258 132 316 128" fill="none" stroke="rgba(68,105,240,.30)" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
              <path d="M4 62 C50 58 74 66 104 64 C140 62 168 70 196 96 C226 124 258 132 316 128" fill="none" stroke="#4469F0" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="620" style={{ animation: "fm-draw 1.8s cubic-bezier(.2,0,0,1) both .35s" }} />
              <circle cx="196" cy="96" r="4.4" fill="#E5686B" style={{ animation: "fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.35s" }} />
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "74px" }}>
            <div style={{ flex: "1", height: "46%", borderRadius: "6px 6px 0 0", background: "rgba(68,105,240,.22)", transformOrigin: "bottom", animation: "fm-bar 520ms cubic-bezier(.2,0,0,1) both .5s" }} />
            <div style={{ flex: "1", height: "64%", borderRadius: "6px 6px 0 0", background: "rgba(68,105,240,.28)", transformOrigin: "bottom", animation: "fm-bar 520ms cubic-bezier(.2,0,0,1) both .58s" }} />
            <div style={{ flex: "1", height: "52%", borderRadius: "6px 6px 0 0", background: "rgba(68,105,240,.22)", transformOrigin: "bottom", animation: "fm-bar 520ms cubic-bezier(.2,0,0,1) both .66s" }} />
            <div style={{ flex: "1", height: "88%", borderRadius: "6px 6px 0 0", background: "#E5686B", transformOrigin: "bottom", animation: "fm-bar 520ms cubic-bezier(.2,0,0,1) both .74s" }} />
            <div style={{ flex: "1", height: "58%", borderRadius: "6px 6px 0 0", background: "rgba(68,105,240,.28)", transformOrigin: "bottom", animation: "fm-bar 520ms cubic-bezier(.2,0,0,1) both .82s" }} />
            <div style={{ flex: "1", height: "40%", borderRadius: "6px 6px 0 0", background: "rgba(68,105,240,.22)", transformOrigin: "bottom", animation: "fm-bar 520ms cubic-bezier(.2,0,0,1) both .9s" }} />
            <div style={{ flex: "1", height: "70%", borderRadius: "6px 6px 0 0", background: "rgba(68,105,240,.28)", transformOrigin: "bottom", animation: "fm-bar 520ms cubic-bezier(.2,0,0,1) both .98s" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#93939A" }}>
            <span>Mumbai → Nagpur, last 7 trips</span>
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: "#E5686B" }} />
              flagged
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
