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
        <div data-reveal style={{ position: "relative", borderRadius: "var(--radius-soft)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 26px", borderBottom: "1px solid rgba(5,8,22,.07)", background: "#FAFAFC" }}>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#050816" }}>Fuel variance</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>MH-46-C-8890 · Mumbai → Nagpur</span>
            <span style={{ marginLeft: "auto", fontSize: "10.5px", fontWeight: "600", padding: "5px 11px", borderRadius: "999px", background: "rgba(229,104,107,.13)", color: "#C4494C", whiteSpace: "nowrap", animation: "fm-flag 460ms cubic-bezier(.2,0,0,1) both 1.1s" }}>audit raised</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(5,8,22,.07)" }}>
            <div style={{ padding: "22px 26px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "20px", height: "2.5px", borderRadius: "2px", background: "rgba(68,105,240,.85)" }} />
                <span style={{ fontSize: "12px", color: "#5D5D5E" }}>Billed on fuel slips</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "32px", letterSpacing: "-1.3px", marginTop: "10px" }}>
                4.0 <span style={{ fontSize: "15px", fontWeight: "400", color: "#93939A", letterSpacing: "0" }}>km/l</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "6px" }}>198.0 L over 792 km</div>
            </div>
            <div style={{ padding: "22px 26px 20px", borderLeft: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "20px", height: "2.5px", borderRadius: "2px", background: "rgba(68,105,240,.3)" }} />
                <span style={{ fontSize: "12px", color: "#5D5D5E" }}>Tank sensor says</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "32px", letterSpacing: "-1.3px", marginTop: "10px" }}>
                4.6 <span style={{ fontSize: "15px", fontWeight: "400", color: "#93939A", letterSpacing: "0" }}>km/l</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "6px" }}>172.4 L over 792 km</div>
            </div>
          </div>

          <div style={{ padding: "24px 26px 18px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", marginBottom: "14px" }}>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>Mileage, last 7 trips</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#C4494C" }}>gap widening</span>
            </div>
            <div style={{ position: "relative", height: "150px" }}>
              <svg viewBox="0 0 320 130" preserveAspectRatio="none" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" }}>
                <path d="M0 20 H320" stroke="rgba(5,8,22,.06)" strokeWidth="1" />
                <path d="M0 65 H320" stroke="rgba(5,8,22,.06)" strokeWidth="1" />
                <path d="M0 110 H320" stroke="rgba(5,8,22,.06)" strokeWidth="1" />
                <path d="M10 40 L60 47 L110 40 L160 47 L210 40 L260 47 L310 47 L310 93 L260 87 L210 80 L160 67 L110 47 L60 53 L10 47 Z" fill="rgba(229,104,107,.14)" style={{ animation: "fm-flag 700ms cubic-bezier(.2,0,0,1) both 1s" }} />
                <path d="M10 40 L60 47 L110 40 L160 47 L210 40 L260 47 L310 47" fill="none" stroke="rgba(68,105,240,.34)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="620" style={{ animation: "fm-draw 1.6s cubic-bezier(.2,0,0,1) both .3s" }} />
                <path d="M10 47 L60 53 L110 47 L160 67 L210 80 L260 87 L310 93" fill="none" stroke="#4469F0" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="620" style={{ animation: "fm-draw 1.6s cubic-bezier(.2,0,0,1) both .45s" }} />
                <circle cx="310" cy="93" r="4.2" fill="#E5686B" style={{ animation: "fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.5s" }} />
              </svg>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderTop: "1px solid rgba(5,8,22,.07)" }}>
            <div style={{ padding: "13px 6px", textAlign: "center", animation: "fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.1s" }}>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5D5D5E" }}>+1.2</span>
              <span style={{ display: "block", fontSize: "9.5px", color: "#B0B0B6", marginTop: "4px" }}>T1</span>
            </div>
            <div style={{ padding: "13px 6px", textAlign: "center", borderLeft: "1px solid rgba(5,8,22,.06)", animation: "fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.16s" }}>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5D5D5E" }}>+2.0</span>
              <span style={{ display: "block", fontSize: "9.5px", color: "#B0B0B6", marginTop: "4px" }}>T2</span>
            </div>
            <div style={{ padding: "13px 6px", textAlign: "center", borderLeft: "1px solid rgba(5,8,22,.06)", animation: "fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.22s" }}>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5D5D5E" }}>+1.4</span>
              <span style={{ display: "block", fontSize: "9.5px", color: "#B0B0B6", marginTop: "4px" }}>T3</span>
            </div>
            <div style={{ padding: "13px 6px", textAlign: "center", borderLeft: "1px solid rgba(5,8,22,.06)", animation: "fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.28s" }}>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#A9701A" }}>+6.8</span>
              <span style={{ display: "block", fontSize: "9.5px", color: "#B0B0B6", marginTop: "4px" }}>T4</span>
            </div>
            <div style={{ padding: "13px 6px", textAlign: "center", borderLeft: "1px solid rgba(5,8,22,.06)", animation: "fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.34s" }}>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#A9701A" }}>+11.4</span>
              <span style={{ display: "block", fontSize: "9.5px", color: "#B0B0B6", marginTop: "4px" }}>T5</span>
            </div>
            <div style={{ padding: "13px 6px", textAlign: "center", borderLeft: "1px solid rgba(5,8,22,.06)", animation: "fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.4s" }}>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#C4494C" }}>+14.2</span>
              <span style={{ display: "block", fontSize: "9.5px", color: "#B0B0B6", marginTop: "4px" }}>T6</span>
            </div>
            <div style={{ padding: "13px 6px", textAlign: "center", borderLeft: "1px solid rgba(5,8,22,.06)", background: "rgba(229,104,107,.07)", animation: "fm-flag 400ms cubic-bezier(.2,0,0,1) both 1.46s" }}>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "500", color: "#C4494C" }}>+25.6</span>
              <span style={{ display: "block", fontSize: "9.5px", color: "#C4494C", marginTop: "4px" }}>T7</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "15px 26px", borderTop: "1px solid rgba(5,8,22,.07)", background: "#FAFAFC" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>unaccounted litres per trip</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", letterSpacing: "-.7px", color: "#C4494C" }}>62.6 L</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5D5D5E" }}>₹5,720 this week</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
