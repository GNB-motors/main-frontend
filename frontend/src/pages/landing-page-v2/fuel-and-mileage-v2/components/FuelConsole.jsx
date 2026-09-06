export default function FuelConsole() {
  return (
    <section data-screen-label="Fuel console" style={{ background: "#FFFFFF", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "1fr .92fr", gap: "72px", alignItems: "end", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1.12", letterSpacing: "-1.2px", margin: "0", textWrap: "pretty" }}>Variance you can act on, not a spreadsheet you argue about.</h2>
          <div>
            <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "0 0 22px" }}>Every flagged trip opens into its own telemetry, refuelling slips and driver record, so the conversation starts with evidence.</p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "13px 0", borderTop: "1px solid rgba(5,8,22,.09)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <div style={{ fontSize: "15.5px", lineHeight: "24px", color: "#050816" }}>A flagged drop shows where the truck was standing when it happened</div>
              </div>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "13px 0", borderTop: "1px solid rgba(5,8,22,.09)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <div style={{ fontSize: "15.5px", lineHeight: "24px", color: "#050816" }}>Refuelling slips reconcile against fuel card and vendor statements</div>
              </div>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "13px 0", borderTop: "1px solid rgba(5,8,22,.09)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <div style={{ fontSize: "15.5px", lineHeight: "24px", color: "#050816" }}>Fuel cost lands in route profitability without a second entry</div>
              </div>
            </div>
          </div>
        </div>

        <div data-reveal style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(5,8,22,.11)", boxShadow: "var(--shadow-lg)", background: "#FFFFFF" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", height: "54px", padding: "0 18px", background: "#FAFAFC", borderBottom: "1px solid rgba(5,8,22,.08)" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "7px", background: "var(--nova-gradient-rage)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "11px", color: "#fff", flex: "0 0 auto" }}>G</span>
            <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Fuel and mileage</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", whiteSpace: "nowrap" }}>/ variance</span>
            <span style={{ flex: "1", maxWidth: "300px", marginLeft: "12px", height: "30px", borderRadius: "8px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.10)", display: "flex", alignItems: "center", gap: "8px", padding: "0 11px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#93939A" strokeWidth="2" strokeLinecap="round" style={{ flex: "0 0 auto" }}>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span style={{ fontSize: "12px", color: "#B0B0B6" }}>Vehicle, route or bill no.</span>
            </span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "9px", flex: "0 0 auto" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5D5D5E", padding: "6px 11px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.10)" }}>12 – 18 Sep</span>
              <span style={{ width: "26px", height: "26px", borderRadius: "999px", background: "rgba(68,105,240,.14)", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: "600", color: "var(--nova-rage-600)" }}>RS</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "stretch", minHeight: "534px" }}>
            <div style={{ flex: "0 0 58px", background: "#FAFAFC", borderRight: "1px solid rgba(5,8,22,.08)", padding: "14px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(68,105,240,.12)", display: "grid", placeItems: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="3" width="11" height="18" rx="2" />
                  <path d="M4 12h11" />
                  <path d="M15 8h2.5a2 2 0 0 1 2 2v7a1.5 1.5 0 0 0 1.5 1.5" />
                </svg>
              </span>
              <span style={{ width: "34px", height: "34px", borderRadius: "10px", display: "grid", placeItems: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#93939A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 18L9 8l5 6 6-10" />
                </svg>
              </span>
              <span style={{ width: "34px", height: "34px", borderRadius: "10px", display: "grid", placeItems: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#93939A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l9 16H3z" />
                  <path d="M12 9v4M12 16h.01" />
                </svg>
              </span>
              <span style={{ width: "34px", height: "34px", borderRadius: "10px", display: "grid", placeItems: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#93939A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
                  <path d="M3 9.5h18" />
                </svg>
              </span>
              <span style={{ width: "34px", height: "34px", borderRadius: "10px", display: "grid", placeItems: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#93939A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
                </svg>
              </span>
              <span style={{ marginTop: "auto", width: "34px", height: "34px", borderRadius: "10px", display: "grid", placeItems: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#93939A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 3v3M12 18v3M4.6 7.5l2.6 1.5M16.8 15l2.6 1.5M4.6 16.5l2.6-1.5M16.8 9l2.6-1.5" />
                </svg>
              </span>
            </div>

            <div style={{ flex: "1", minWidth: "0", padding: "22px 24px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px" }}>Fuel variance</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>38 trips reconciled</span>
                <span style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: "500", padding: "6px 11px", borderRadius: "999px", background: "var(--nova-rage-400)", color: "#FFFFFF" }}>Flagged · 3</span>
                  <span style={{ fontSize: "11.5px", fontWeight: "500", padding: "6px 11px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.11)", color: "#5D5D5E" }}>Within band</span>
                  <span style={{ fontSize: "11.5px", fontWeight: "500", padding: "6px 11px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.11)", color: "#5D5D5E" }}>All depots</span>
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr", gap: "12px", padding: "16px 4px 10px", borderBottom: "1px solid rgba(5,8,22,.10)", fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#93939A" }}>
                <span>Vehicle</span><span>Route</span><span style={{ textAlign: "right" }}>Distance</span><span style={{ textAlign: "right" }}>Bills</span><span style={{ textAlign: "right" }}>Sensor</span><span style={{ textAlign: "right" }}>Gap</span><span style={{ textAlign: "right" }}>Status</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr", gap: "12px", alignItems: "center", padding: "15px 4px 15px 10px", marginLeft: "-10px", borderBottom: "1px solid rgba(5,8,22,.06)", background: "rgba(68,105,240,.05)", boxShadow: "inset 2px 0 0 var(--nova-rage-400)" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "600", letterSpacing: "-.15px" }}>MH-46-C-8890</span>
                <span style={{ fontSize: "13px", color: "#5D5D5E" }}>Mumbai → Nagpur</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right", color: "#5D5D5E" }}>792 km</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>198.0 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>172.4 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: "500", textAlign: "right", color: "#C4494C" }}>+25.6 L</span>
                <span style={{ textAlign: "right" }}><span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 10px", borderRadius: "999px", background: "rgba(229,104,107,.13)", color: "#C4494C", whiteSpace: "nowrap" }}>Audit raised</span></span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr", gap: "12px", alignItems: "center", padding: "15px 4px", borderBottom: "1px solid rgba(5,8,22,.06)" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "500", letterSpacing: "-.15px" }}>GJ-05-KT-7712</span>
                <span style={{ fontSize: "13px", color: "#5D5D5E" }}>Surat → Indore</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right", color: "#5D5D5E" }}>588 km</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>156.2 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>138.0 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: "500", textAlign: "right", color: "#C4494C" }}>+18.2 L</span>
                <span style={{ textAlign: "right" }}><span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 10px", borderRadius: "999px", background: "rgba(229,104,107,.13)", color: "#C4494C", whiteSpace: "nowrap" }}>Flagged</span></span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr", gap: "12px", alignItems: "center", padding: "15px 4px", borderBottom: "1px solid rgba(5,8,22,.06)" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "500", letterSpacing: "-.15px" }}>KA-51-AB-3390</span>
                <span style={{ fontSize: "13px", color: "#5D5D5E" }}>Hubli → Belgaum</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right", color: "#5D5D5E" }}>268 km</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>68.4 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>61.7 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: "500", textAlign: "right", color: "#A9701A" }}>+6.7 L</span>
                <span style={{ textAlign: "right" }}><span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 10px", borderRadius: "999px", background: "rgba(230,168,60,.16)", color: "#A9701A", whiteSpace: "nowrap" }}>Reviewing</span></span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr", gap: "12px", alignItems: "center", padding: "15px 4px", borderBottom: "1px solid rgba(5,8,22,.06)" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "500", letterSpacing: "-.15px" }}>MH-40-BX-2291</span>
                <span style={{ fontSize: "13px", color: "#5D5D5E" }}>Pune → Surat</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right", color: "#5D5D5E" }}>614 km</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>141.5 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>138.9 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", textAlign: "right", color: "#5D5D5E" }}>+2.6 L</span>
                <span style={{ textAlign: "right" }}><span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 10px", borderRadius: "999px", background: "rgba(24,122,50,.10)", color: "#187A32", whiteSpace: "nowrap" }}>Within band</span></span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1.3fr .72fr .72fr .72fr .82fr 1fr", gap: "12px", alignItems: "center", padding: "15px 4px", borderBottom: "1px solid rgba(5,8,22,.06)" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "500", letterSpacing: "-.15px" }}>MH-12-QR-4460</span>
                <span style={{ fontSize: "13px", color: "#5D5D5E" }}>Nashik → Aurangabad</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right", color: "#5D5D5E" }}>322 km</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>74.0 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>73.1 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", textAlign: "right", color: "#5D5D5E" }}>+0.9 L</span>
                <span style={{ textAlign: "right" }}><span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 10px", borderRadius: "999px", background: "rgba(24,122,50,.10)", color: "#187A32", whiteSpace: "nowrap" }}>Within band</span></span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", paddingTop: "18px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>
                <span>Showing 5 of 38 · sorted by gap</span>
                <span>Fleet gap this week · 53.9 L · ₹4,960</span>
              </div>
            </div>

            <div style={{ flex: "0 0 300px", borderLeft: "1px solid rgba(5,8,22,.08)", background: "#FAFAFC", padding: "22px 20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>Selected trip</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "17px", letterSpacing: "-.4px", marginTop: "8px" }}>MH-46-C-8890</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "5px" }}>TRP-88104 · 18 Sep · Ravi S.</div>
              </div>

              <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", borderRadius: "12px", padding: "14px 14px 12px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: "500", color: "#5D5D5E" }}>km/l, last 7 trips</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#C4494C" }}>4.0 ▾</span>
                </div>
                <svg viewBox="0 0 240 56" preserveAspectRatio="none" style={{ width: "100%", height: "52px", display: "block" }}>
                  <path d="M2 20 H238" stroke="rgba(5,8,22,.07)" strokeWidth="1" />
                  <path d="M2 38 H238" stroke="rgba(5,8,22,.07)" strokeWidth="1" />
                  <path d="M4 22 C40 18 62 26 92 24 C124 22 150 32 178 42 C200 49 218 50 236 48" fill="none" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="236" cy="48" r="3.4" fill="#E5686B" />
                </svg>
              </div>

              <div>
                <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginBottom: "10px" }}>Evidence on file</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", borderRadius: "10px", padding: "9px 11px" }}>
                    <span style={{ flex: "0 0 auto", width: "30px", height: "30px", borderRadius: "8px", background: "#0F1428", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: "8px", color: "#8FA6F5" }}>184</span>
                    <span style={{ minWidth: "0" }}>
                      <span style={{ display: "block", fontSize: "12.5px", fontWeight: "500" }}>Odometer photo</span>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A" }}>1,84,206 km · verified</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", borderRadius: "10px", padding: "9px 11px" }}>
                    <span style={{ flex: "0 0 auto", width: "30px", height: "30px", borderRadius: "8px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
                        <path d="M9 8h6M9 12h6" />
                      </svg>
                    </span>
                    <span style={{ minWidth: "0" }}>
                      <span style={{ display: "block", fontSize: "12.5px", fontWeight: "500" }}>Fuel bill photo</span>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A" }}>198.0 L · ₹18,216</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", borderRadius: "10px", padding: "9px 11px" }}>
                    <span style={{ flex: "0 0 auto", width: "30px", height: "30px", borderRadius: "8px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 17V8l4-3 5 3 4-2 5 3v8" />
                        <path d="M3 17h18" />
                      </svg>
                    </span>
                    <span style={{ minWidth: "0" }}>
                      <span style={{ display: "block", fontSize: "12.5px", fontWeight: "500" }}>Tank sensor log</span>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A" }}>172.4 L · 30 s samples</span>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "auto", background: "rgba(229,104,107,.08)", border: "1px solid rgba(229,104,107,.24)", borderRadius: "12px", padding: "13px 14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "22px", letterSpacing: "-.7px", color: "#C4494C" }}>25.6 L</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5D5D5E" }}>₹2,340</span>
                </div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "4px" }}>Bought and billed, never burned.</div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ flex: "1", textAlign: "center", fontSize: "12.5px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", borderRadius: "8px", padding: "10px 0" }}>Raise audit</span>
                <span style={{ flex: "0 0 auto", fontSize: "12.5px", fontWeight: "600", color: "#050816", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.12)", borderRadius: "8px", padding: "10px 14px" }}>Open trip</span>
              </div>
            </div>
          </div>
        </div>

        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "32px", marginTop: "24px" }}>
          <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(5,8,22,.10)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginBottom: "7px" }}>Bills · sensor · gap</div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>Both records sit in the same row, so the gap is a column, not a calculation someone has to run.</div>
          </div>
          <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(5,8,22,.10)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginBottom: "7px" }}>Evidence on file</div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>Odometer photo, fuel bill and the tank sensor log stay attached to the trip that raised the flag.</div>
          </div>
          <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(5,8,22,.10)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginBottom: "7px" }}>Audit trail</div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>Raising an audit records who saw it and when, against the trip, the vehicle and the driver.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
