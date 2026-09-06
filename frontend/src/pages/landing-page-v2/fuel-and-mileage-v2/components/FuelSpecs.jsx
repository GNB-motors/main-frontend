export default function FuelSpecs() {
  return (
    <section data-screen-label="Fuel specs" style={{ background: "#FFFFFF", padding: "88px 40px 96px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "34px" }}>
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>How the module measures</span>
          <span style={{ flex: "1", height: "1px", background: "rgba(5,8,22,.10)" }} />
        </div>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          <div style={{ padding: "0 30px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.09)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18" />
                  <path d="M7 7h10M7 12h10M7 17h10" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#B0B0B6" }}>01</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1", letterSpacing: "-1.6px" }}>±2 %</div>
            <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "13px", textWrap: "pretty" }}>Tank sensor reading tolerance</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginTop: "14px" }}>calibrated per tank</div>
          </div>
          <div style={{ padding: "0 30px", borderLeft: "1px solid rgba(5,8,22,.10)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.09)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5V12l3 2" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#B0B0B6" }}>02</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1", letterSpacing: "-1.6px" }}>30 s</div>
            <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "13px", textWrap: "pretty" }}>Sampling interval, same as telemetry</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginTop: "14px" }}>2,880 reads a day</div>
          </div>
          <div style={{ padding: "0 30px", borderLeft: "1px solid rgba(5,8,22,.10)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.09)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h10M4 18h6" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#B0B0B6" }}>03</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1", letterSpacing: "-1.6px" }}>4 way</div>
            <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "13px", textWrap: "pretty" }}>Variance cut by vehicle, route, driver, depot</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginTop: "14px" }}>any combination</div>
          </div>
          <div style={{ padding: "0 0 0 30px", borderLeft: "1px solid rgba(5,8,22,.10)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.09)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
                  <path d="M20.5 4v5h-5" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#B0B0B6" }}>04</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1", letterSpacing: "-1.6px" }}>90 d</div>
            <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "13px", textWrap: "pretty" }}>Consumption history retained by default</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginTop: "14px" }}>extendable on request</div>
          </div>
        </div>
      </div>
    </section>
  );
}
