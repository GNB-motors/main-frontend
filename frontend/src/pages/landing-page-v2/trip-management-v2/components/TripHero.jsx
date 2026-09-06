export default function TripHero() {
  return (
    <section data-screen-label="Trip hero" style={{ position: "relative", background: "#F4F5FA", padding: "92px 40px 0", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0", background: "radial-gradient(900px 520px at 88% -6%, rgba(68,105,240,.11), transparent 66%), radial-gradient(680px 420px at 2% 40%, rgba(68,105,240,.06), transparent 70%)" }} />
      <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(5,8,22,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(5,8,22,.035) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(circle at 70% 20%, #000, transparent 72%)" }} />

      <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "30px" }}>
          <span style={{ width: "44px", height: "2px", background: "var(--nova-rage-400)" }} />
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "12px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Fleet · Trip management</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "5px 12px", borderRadius: "999px", background: "rgba(68,105,240,.10)", border: "1px solid rgba(68,105,240,.22)", color: "#4469F0" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
              <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
            </svg>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".16em", textTransform: "uppercase" }}>AI native</span>
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.12fr .88fr", gap: "72px", alignItems: "end" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "62px", lineHeight: "1.03", letterSpacing: "-2.4px", margin: "0", color: "#050816", textWrap: "pretty" }}>
            Plan it, cost it, close it. <span style={{ color: "var(--nova-rage-400)" }}>One trip record.</span>
          </h1>
          <div>
            <p style={{ fontSize: "18px", lineHeight: "30px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>From booking to POD to invoice, every consignment carries its own vehicle, driver, expenses and paperwork, so nothing is reconstructed from memory at month end.</p>
          </div>
        </div>

        <div style={{ marginTop: "64px", borderRadius: "var(--radius-soft)", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr 1fr 1.05fr" }}>

            <div style={{ padding: "30px 32px 32px", display: "flex", flexDirection: "column", gap: "18px", animation: "tm-step 460ms cubic-bezier(.2,0,0,1) both .35s" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A" }}>Consignment</div>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>GNB/2026/04817</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-1px", color: "#050816", marginTop: "8px" }}>Mumbai → Nagpur</div>
              </div>
              <div style={{ position: "relative", padding: "2px 0" }}>
                <svg viewBox="0 0 300 8" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "8px" }}>
                  <path d="M4 4 H296" stroke="rgba(68,105,240,.16)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M4 4 H296" stroke="#4469F0" strokeWidth="4" strokeLinecap="round" strokeDasharray="300" style={{ animation: "tm-track 1.5s cubic-bezier(.2,0,0,1) both .35s" }} />
                </svg>
                <div style={{ position: "absolute", left: "68%", top: "-2px", width: "16px", height: "16px", marginLeft: "-8px", borderRadius: "999px", background: "rgba(68,105,240,.34)", animation: "tm-pulse 2.4s ease-in-out infinite" }} />
                <div style={{ position: "absolute", left: "68%", top: "2px", width: "8px", height: "8px", marginLeft: "-4px", borderRadius: "999px", background: "#2F58EE" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", padding: "5px 11px", borderRadius: "999px", background: "rgba(68,105,240,.10)", color: "var(--nova-rage-600)" }}>In transit · 68%</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>ETA 17:40</span>
              </div>
            </div>

            <div style={{ padding: "30px 32px 32px", borderLeft: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column", gap: "18px", animation: "tm-step 460ms cubic-bezier(.2,0,0,1) both" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A" }}>Assigned</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
                <span style={{ fontSize: "14px", color: "#93939A" }}>Vehicle</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "500", color: "#050816" }}>MH-40-BX-2291</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
                <span style={{ fontSize: "14px", color: "#93939A" }}>Driver</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "500", color: "#050816" }}>R. Kumar</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
                <span style={{ fontSize: "14px", color: "#93939A" }}>Load</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "500", color: "#050816" }}>18.4 t</span>
              </div>
            </div>

            <div style={{ padding: "30px 32px 32px", borderLeft: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column", gap: "18px", animation: "tm-step 460ms cubic-bezier(.2,0,0,1) both" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A" }}>Costing</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
                <span style={{ fontSize: "14px", color: "#93939A" }}>Costed</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "500", color: "#050816" }}>₹42,600</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
                <span style={{ fontSize: "14px", color: "#93939A" }}>Actual so far</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "500", color: "#050816" }}>₹39,180</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
                <span style={{ fontSize: "14px", color: "#93939A" }}>Margin</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "500", color: "var(--nova-fern-700)" }}>+8%</span>
              </div>
            </div>

            <div style={{ padding: "30px 32px 32px", borderLeft: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column", gap: "18px", animation: "tm-step 460ms cubic-bezier(.2,0,0,1) both" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A" }}>Paperwork</div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <span style={{ flex: "0 0 auto", width: "20px", height: "20px", borderRadius: "999px", background: "rgba(24,122,50,.12)", display: "grid", placeItems: "center" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#187A32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span style={{ flex: "1", fontSize: "14px", fontWeight: "500", color: "#050816" }}>LR</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>08:10</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <span style={{ flex: "0 0 auto", width: "20px", height: "20px", borderRadius: "999px", background: "rgba(24,122,50,.12)", display: "grid", placeItems: "center" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#187A32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span style={{ flex: "1", fontSize: "14px", fontWeight: "500", color: "#050816" }}>E-way bill</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>08:26</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <span style={{ flex: "0 0 auto", width: "20px", height: "20px", borderRadius: "999px", border: "1.5px dashed rgba(5,8,22,.22)" }} />
                <span style={{ flex: "1", fontSize: "14px", fontWeight: "500", color: "#5D5D5E" }}>POD</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#C0C0C8" }}>pending</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <span style={{ flex: "0 0 auto", width: "20px", height: "20px", borderRadius: "999px", border: "1.5px dashed rgba(5,8,22,.22)" }} />
                <span style={{ flex: "1", fontSize: "14px", fontWeight: "500", color: "#5D5D5E" }}>Invoice</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#C0C0C8" }}>pending</span>
              </div>
            </div>
          </div>
        </div>

        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", margin: "0 -32px", padding: "56px 0 88px" }}>
          <div style={{ padding: "0 32px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1", letterSpacing: "-1.4px", color: "#050816" }}>1 rec</div>
            <div style={{ fontSize: "14px", lineHeight: "22px", color: "#5D5D5E", marginTop: "14px" }}>Booking to invoice on one trip record</div>
          </div>
          <div style={{ padding: "0 32px", borderLeft: "1px solid rgba(5,8,22,.10)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1", letterSpacing: "-1.4px", color: "#050816" }}>6 stage</div>
            <div style={{ fontSize: "14px", lineHeight: "22px", color: "#5D5D5E", marginTop: "14px" }}>Booked, loaded, in transit, delivered, POD, billed</div>
          </div>
          <div style={{ padding: "0 32px", borderLeft: "1px solid rgba(5,8,22,.10)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1", letterSpacing: "-1.4px", color: "#050816" }}>0 entry</div>
            <div style={{ fontSize: "14px", lineHeight: "22px", color: "#5D5D5E", marginTop: "14px" }}>Re-typing between trip, e-way bill and invoice</div>
          </div>
          <div style={{ padding: "0 32px", borderLeft: "1px solid rgba(5,8,22,.10)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1", letterSpacing: "-1.4px", color: "#050816" }}>live</div>
            <div style={{ fontSize: "14px", lineHeight: "22px", color: "#5D5D5E", marginTop: "14px" }}>Costed against actual, while the trip runs</div>
          </div>
        </div>
      </div>
    </section>
  );
}
