export default function FuelAi() {
  return (
    <section id="ai" data-screen-label="Fuel AI" style={{ position: "relative", background: "#F1F4FE", padding: "112px 40px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0", background: "radial-gradient(900px 420px at 78% 0%, rgba(68,105,240,.12), transparent 66%)" }} />
      <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto" }}>
        <div data-reveal style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "end", marginBottom: "56px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>AI intelligence</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "5px 12px", borderRadius: "999px", background: "rgba(68,105,240,.10)", border: "1px solid rgba(68,105,240,.22)", color: "#4469F0" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                  <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                  <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
                </svg>
                <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>AI native</span>
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1.08", letterSpacing: "-1.5px", margin: "0", textWrap: "pretty" }}>
              AI that finds the fuel{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>before it disappears.</span>
            </h2>
          </div>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>Fills, odometer, load and terrain for every vehicle. AI separates a genuine mileage drop from a pilferage pattern, and puts a rupee number on both.</p>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "22px", padding: "28px 30px 30px", boxShadow: "var(--shadow-sm)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "26px" }}>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Fuel reconciliation · litres in versus litres explained</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>Fleet · last 30 days</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "9px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "500" }}>Fuel issued</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#5D5D5E" }}>1,240 L · ₹1,12,840</span>
              </div>
              <div style={{ height: "34px", borderRadius: "9px", background: "rgba(68,105,240,.5)", transformOrigin: "left", animation: "ai-bar 1s cubic-bezier(.2,0,0,1) both .2s" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "9px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "500" }}>Explained by distance, load and terrain</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#5D5D5E" }}>1,198 L</span>
              </div>
              <div style={{ display: "flex", gap: "6px", height: "34px" }}>
                <div style={{ flex: "0 0 96.6%", borderRadius: "9px", background: "rgba(68,105,240,.28)", transformOrigin: "left", animation: "ai-bar 1s cubic-bezier(.2,0,0,1) both .45s" }} />
                <div style={{ flex: "1", borderRadius: "9px", background: "rgba(229,104,107,.55)", animation: "ai-blip 2.4s ease-in-out infinite 1.4s" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "14px", background: "rgba(229,104,107,.08)", border: "1px solid rgba(229,104,107,.24)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", letterSpacing: "-.7px", color: "#C4494C" }}>42 L</span>
              <span style={{ fontSize: "13.5px", lineHeight: "20px", color: "#5D5D5E" }}>unexplained, worth ₹3,820. AI attributes it below before anyone calls it theft.</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", paddingTop: "20px", borderTop: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ padding: "16px 18px", borderRadius: "14px", background: "#F4F5FA" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px" }}>38%</div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>Mileage decay</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "4px" }}>Six vehicles overdue for service</div>
              </div>
              <div style={{ padding: "16px 18px", borderRadius: "14px", background: "#F4F5FA" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px" }}>34%</div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>Route and load</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "4px" }}>Ghat sections, heavier consignments</div>
              </div>
              <div style={{ padding: "16px 18px", borderRadius: "14px", background: "rgba(229,104,107,.07)", border: "1px solid rgba(229,104,107,.2)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", color: "#C4494C" }}>28%</div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>Pattern, not physics</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "4px" }}>Same lane, same fills, three weeks</div>
              </div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "56px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>
          <span>Fills, odometer, load</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Per-vehicle fuel history</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Variance and theft models</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Where the litres went</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Automatic variance report</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Service and route fixes</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Rupees recovered</span>
        </div>
        <div data-reveal style={{ display: "grid", gridTemplateColumns: "1.55fr .95fr", gap: "20px", alignItems: "stretch" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", padding: "28px 30px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "22px" }}>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#050816" }}>Recovery ledger · what AI found this month</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>30 days</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: "20px", alignItems: "baseline", padding: "17px 0", borderTop: "1px solid rgba(5,8,22,.06)" }}>
              <span>
                <span style={{ display: "block", fontSize: "15.5px", fontWeight: "500", letterSpacing: "-.15px" }}>Unexplained fuel on MH-46-C-8890</span>
                <span style={{ display: "block", fontSize: "13px", lineHeight: "20px", color: "#93939A", marginTop: "4px" }}>Two fills, no matching distance. Third week in a row.</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", letterSpacing: "-.7px" }}>₹3,820</span>
                <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "4px" }}>audit raised</span>
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: "20px", alignItems: "baseline", padding: "17px 0", borderTop: "1px solid rgba(5,8,22,.06)" }}>
              <span>
                <span style={{ display: "block", fontSize: "15.5px", fontWeight: "500", letterSpacing: "-.15px" }}>Mileage decay across six vehicles</span>
                <span style={{ display: "block", fontSize: "13px", lineHeight: "20px", color: "#93939A", marginTop: "4px" }}>Trending to 3.1 km/L by November unless serviced.</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", letterSpacing: "-.7px" }}>₹41,200</span>
                <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "4px" }}>per quarter</span>
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: "20px", alignItems: "baseline", padding: "17px 0", borderTop: "1px solid rgba(5,8,22,.06)" }}>
              <span>
                <span style={{ display: "block", fontSize: "15.5px", fontWeight: "500", letterSpacing: "-.15px" }}>Refuel point switched to Talegaon</span>
                <span style={{ display: "block", fontSize: "13px", lineHeight: "20px", color: "#93939A", marginTop: "4px" }}>₹2.70 per litre cheaper on the same route, no detour.</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", letterSpacing: "-.7px" }}>₹31,000</span>
                <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "4px" }}>per quarter</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "20px", paddingTop: "20px", marginTop: "6px", borderTop: "2px solid rgba(5,8,22,.12)" }}>
              <span style={{ fontSize: "15.5px", fontWeight: "600" }}>Recoverable, annualised</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", letterSpacing: "-1.1px", color: "var(--nova-rage-600)" }}>₹2.93L</span>
            </div>
          </div>
          <div style={{ background: "linear-gradient(150deg, #2F58EE 0%, #213EA7 100%)", borderRadius: "var(--radius-xl)", padding: "30px", color: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,.7)" }}>Variance report</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "32px", letterSpacing: "-1.2px", marginTop: "16px", lineHeight: "1.12" }}>Written on the 1st, before anyone asks</div>
              <div style={{ fontSize: "15px", lineHeight: "24px", color: "rgba(255,255,255,.82)", marginTop: "14px" }}>Every line above arrives as a report with the fills, distances and vehicles behind it attached.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "28px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "rgba(255,255,255,.78)" }}>conf 0.86 · 1,240 fills analysed</div>
          </div>
        </div>
        <div data-reveal style={{ marginTop: "44px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginRight: "4px" }}>Runs automatically</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Pilferage pattern detection
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Mileage degradation forecast
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Refuel point suggestions
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Automatic variance report
          </span>
        </div>
      </div>
    </section>
  );
}
