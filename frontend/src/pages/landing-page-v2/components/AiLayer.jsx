export default function AiLayer() {
  return (
    <section id="ai" data-screen-label="AI layer" style={{ position: "relative", background: "#F1F4FE", padding: "112px 40px", overflow: "hidden" }}>
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
              AI that reads every kilometre{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>and tells you what to do next.</span>
            </h2>
          </div>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>Every vehicle writes to GNB Edge continuously: GPS pings, trip costs, fuel fills, driver hours, invoices. AI works on that record to surface what changed, what it will cost you, and what to do about it.</p>
        </div>
        <div data-reveal style={{ display: "flex", alignItems: "stretch", gap: "0", margin: "0 auto 22px" }}>
          <div style={{ flex: "1 1 0", minWidth: "0", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", borderRadius: "16px", padding: "16px 12px 15px", textAlign: "center", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#93939A", marginBottom: "10px" }}>01</div>
            <span style={{ width: "38px", height: "38px", margin: "0 auto", borderRadius: "12px", background: "rgba(68,105,240,.08)", display: "grid", placeItems: "center", color: "#4469F0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <path d="M3 7h11v9H3z" />
                <path d="M14 10h4l3 3v3h-7z" />
                <circle cx="7" cy="18" r="1.6" />
                <circle cx="17" cy="18" r="1.6" />
              </svg>
            </span>
            <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.15px", color: "#050816", marginTop: "12px", lineHeight: "17px", overflowWrap: "anywhere", hyphens: "auto" }}>Vehicle data</div>
            <div style={{ fontSize: "11px", lineHeight: "16px", color: "#93939A", marginTop: "6px", overflowWrap: "anywhere" }}>GPS, fuel, trips, expenses</div>
          </div>
          <div style={{ flex: "0 0 22px", display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 22 10" style={{ width: "22px", height: "10px", overflow: "visible" }}>
              <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M1 5h20" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 39" style={{ animation: "ai-flow 2.4s linear infinite 0.00s" }} />
              <path d="M17.6 2.2 20.6 5l-3 2.8" fill="none" stroke="rgba(68,105,240,.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", borderRadius: "16px", padding: "16px 12px 15px", textAlign: "center", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#93939A", marginBottom: "10px" }}>02</div>
            <span style={{ width: "38px", height: "38px", margin: "0 auto", borderRadius: "12px", background: "rgba(68,105,240,.08)", display: "grid", placeItems: "center", color: "#4469F0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <ellipse cx="12" cy="6" rx="7" ry="3" />
                <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
                <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
              </svg>
            </span>
            <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.15px", color: "#050816", marginTop: "12px", lineHeight: "17px", overflowWrap: "anywhere", hyphens: "auto" }}>Data storage</div>
            <div style={{ fontSize: "11px", lineHeight: "16px", color: "#93939A", marginTop: "6px", overflowWrap: "anywhere" }}>One record per vehicle</div>
          </div>
          <div style={{ flex: "0 0 22px", display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 22 10" style={{ width: "22px", height: "10px", overflow: "visible" }}>
              <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M1 5h20" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 39" style={{ animation: "ai-flow 2.4s linear infinite 0.28s" }} />
              <path d="M17.6 2.2 20.6 5l-3 2.8" fill="none" stroke="rgba(68,105,240,.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.34)", borderRadius: "16px", padding: "16px 12px 15px", textAlign: "center", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#93939A", marginBottom: "10px" }}>03</div>
            <span style={{ width: "38px", height: "38px", margin: "0 auto", borderRadius: "12px", background: "rgba(68,105,240,.14)", display: "grid", placeItems: "center", color: "#4469F0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
              </svg>
            </span>
            <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.15px", color: "#050816", marginTop: "12px", lineHeight: "17px", overflowWrap: "anywhere", hyphens: "auto" }}>AI analysis</div>
            <div style={{ fontSize: "11px", lineHeight: "16px", color: "#93939A", marginTop: "6px", overflowWrap: "anywhere" }}>Patterns, anomalies, trends</div>
          </div>
          <div style={{ flex: "0 0 22px", display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 22 10" style={{ width: "22px", height: "10px", overflow: "visible" }}>
              <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M1 5h20" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 39" style={{ animation: "ai-flow 2.4s linear infinite 0.56s" }} />
              <path d="M17.6 2.2 20.6 5l-3 2.8" fill="none" stroke="rgba(68,105,240,.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.34)", borderRadius: "16px", padding: "16px 12px 15px", textAlign: "center", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#93939A", marginBottom: "10px" }}>04</div>
            <span style={{ width: "38px", height: "38px", margin: "0 auto", borderRadius: "12px", background: "rgba(68,105,240,.14)", display: "grid", placeItems: "center", color: "#4469F0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <path d="M9.5 18h5" />
                <path d="M10.5 21h3" />
                <path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.8 1 .8 1.6h5.2c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" />
              </svg>
            </span>
            <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.15px", color: "#050816", marginTop: "12px", lineHeight: "17px", overflowWrap: "anywhere", hyphens: "auto" }}>Smart insights</div>
            <div style={{ fontSize: "11px", lineHeight: "16px", color: "#93939A", marginTop: "6px", overflowWrap: "anywhere" }}>What changed and why</div>
          </div>
          <div style={{ flex: "0 0 22px", display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 22 10" style={{ width: "22px", height: "10px", overflow: "visible" }}>
              <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M1 5h20" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 39" style={{ animation: "ai-flow 2.4s linear infinite 0.84s" }} />
              <path d="M17.6 2.2 20.6 5l-3 2.8" fill="none" stroke="rgba(68,105,240,.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", borderRadius: "16px", padding: "16px 12px 15px", textAlign: "center", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#93939A", marginBottom: "10px" }}>05</div>
            <span style={{ width: "38px", height: "38px", margin: "0 auto", borderRadius: "12px", background: "rgba(68,105,240,.08)", display: "grid", placeItems: "center", color: "#4469F0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 13v4M12 9v8M16 15v2" />
              </svg>
            </span>
            <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.15px", color: "#050816", marginTop: "12px", lineHeight: "17px", overflowWrap: "anywhere", hyphens: "auto" }}>Reports</div>
            <div style={{ fontSize: "11px", lineHeight: "16px", color: "#93939A", marginTop: "6px", overflowWrap: "anywhere" }}>Generated and scheduled</div>
          </div>
          <div style={{ flex: "0 0 22px", display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 22 10" style={{ width: "22px", height: "10px", overflow: "visible" }}>
              <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M1 5h20" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 39" style={{ animation: "ai-flow 2.4s linear infinite 1.12s" }} />
              <path d="M17.6 2.2 20.6 5l-3 2.8" fill="none" stroke="rgba(68,105,240,.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", borderRadius: "16px", padding: "16px 12px 15px", textAlign: "center", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#93939A", marginBottom: "10px" }}>06</div>
            <span style={{ width: "38px", height: "38px", margin: "0 auto", borderRadius: "12px", background: "rgba(68,105,240,.08)", display: "grid", placeItems: "center", color: "#4469F0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <path d="M4 6h9M4 12h9M4 18h6" />
                <path d="M15.6 16.8l1.9 1.9 3.5-3.7" />
              </svg>
            </span>
            <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.15px", color: "#050816", marginTop: "12px", lineHeight: "17px", overflowWrap: "anywhere", hyphens: "auto" }}>Recommendations</div>
            <div style={{ fontSize: "11px", lineHeight: "16px", color: "#93939A", marginTop: "6px", overflowWrap: "anywhere" }}>Ranked by rupee impact</div>
          </div>
          <div style={{ flex: "0 0 22px", display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 22 10" style={{ width: "22px", height: "10px", overflow: "visible" }}>
              <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M1 5h20" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 39" style={{ animation: "ai-flow 2.4s linear infinite 1.40s" }} />
              <path d="M17.6 2.2 20.6 5l-3 2.8" fill="none" stroke="rgba(68,105,240,.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: "1 1 0", minWidth: "0", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", borderRadius: "16px", padding: "16px 12px 15px", textAlign: "center", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#93939A", marginBottom: "10px" }}>07</div>
            <span style={{ width: "38px", height: "38px", margin: "0 auto", borderRadius: "12px", background: "rgba(68,105,240,.08)", display: "grid", placeItems: "center", color: "#4469F0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <circle cx="12" cy="12" r="8.6" />
                <path d="M8.6 12h6.8M12.6 9.2 15.4 12l-2.8 2.8" />
              </svg>
            </span>
            <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.15px", color: "#050816", marginTop: "12px", lineHeight: "17px", overflowWrap: "anywhere", hyphens: "auto" }}>Business actions</div>
            <div style={{ fontSize: "11px", lineHeight: "16px", color: "#93939A", marginTop: "6px", overflowWrap: "anywhere" }}>Assigned, tracked, closed</div>
          </div>
        </div>
        <div data-reveal style={{ display: "flex", gap: "0", marginBottom: "56px", fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>
          <span style={{ flex: "2 1 0", textAlign: "center" }}>Collect</span>
          <span style={{ flex: "2 1 0", textAlign: "center" }}>Analyse</span>
          <span style={{ flex: "3 1 0", textAlign: "center" }}>Act</span>
        </div>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px", alignItems: "stretch" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "22px 22px 18px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "13px", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 12px", borderRadius: "999px", background: "rgba(229,104,107,.12)", color: "#C4494C" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                  <path d="M12 4.5 21 19.5H3z" />
                  <path d="M12 10v4M12 17h.01" />
                </svg>
                <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".16em", textTransform: "uppercase" }}>Smart alert</span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>07:04</span>
            </div>
            <div style={{ fontSize: "17px", lineHeight: "26px", fontWeight: "500", letterSpacing: "-.2px", color: "#050816", textWrap: "pretty" }}>Fuel variance crossed 8% on four vehicles this week</div>
            <div style={{ fontSize: "14px", lineHeight: "22px", color: "#5D5D5E", textWrap: "pretty" }}>Bhiwandi depot · ₹18,400 estimated leakage against expected consumption.</div>
            <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(5,8,22,.07)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--nova-rage-600)" }}>Open fuel audit →</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>conf 0.91</span>
            </div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "22px 22px 18px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "13px", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 12px", borderRadius: "999px", background: "rgba(68,105,240,.12)", color: "#2F58EE" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                  <path d="M3.5 16.5 9 11l3.5 3.5L20.5 6.5" />
                  <path d="M15.5 6.5h5v5" />
                </svg>
                <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".16em", textTransform: "uppercase" }}>Trend</span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>90 days</span>
            </div>
            <div style={{ fontSize: "17px", lineHeight: "26px", fontWeight: "500", letterSpacing: "-.2px", color: "#050816", textWrap: "pretty" }}>Cost per km rose 4.6% on the western routes</div>
            <div style={{ fontSize: "14px", lineHeight: "22px", color: "#5D5D5E", textWrap: "pretty" }}>Measured from closed trips, fuel fills and expenses. Bhiwandi and Nashik runs carry most of it.</div>
            <svg viewBox="0 0 200 44" style={{ width: "100%", height: "44px", display: "block", marginTop: "2px" }}>
              <rect x="1" y="23.2" width="10" height="20.8" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="17.6" y="24.8" width="10" height="19.2" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="34.2" y="22" width="10" height="22" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="50.800000000000004" y="20" width="10" height="24" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="67.4" y="20.8" width="10" height="23.2" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="84" y="18.4" width="10" height="25.6" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="100.60000000000001" y="16.400000000000002" width="10" height="27.599999999999998" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="117.20000000000002" y="15.200000000000003" width="10" height="28.799999999999997" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="133.8" y="12.799999999999997" width="10" height="31.200000000000003" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="150.4" y="10.399999999999999" width="10" height="33.6" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="167" y="8.799999999999997" width="10" height="35.2" rx="2.5" fill="rgba(68,105,240,.62)" />
              <rect x="183.60000000000002" y="6.799999999999997" width="10" height="37.2" rx="2.5" fill="rgba(68,105,240,.62)" />
            </svg>
            <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(5,8,22,.07)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--nova-rage-600)" }}>See the breakdown →</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>from closed trips</span>
            </div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "22px 22px 18px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "13px", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 12px", borderRadius: "999px", background: "rgba(24,122,50,.12)", color: "#187A32" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                  <path d="M12 3l1.8 4.4L18.2 9.2 13.8 11 12 15.4 10.2 11 5.8 9.2l4.4-1.8z" />
                  <path d="M15.6 17.6l1.7 1.7 3.2-3.3" />
                </svg>
                <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".16em", textTransform: "uppercase" }}>Recommendation</span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>today</span>
            </div>
            <div style={{ fontSize: "17px", lineHeight: "26px", fontWeight: "500", letterSpacing: "-.2px", color: "#050816", textWrap: "pretty" }}>Move three Nagpur runs to the Pune vehicle pool</div>
            <div style={{ fontSize: "14px", lineHeight: "22px", color: "#5D5D5E", textWrap: "pretty" }}>Projected +₹1.1L margin this quarter at current rate cards and utilisation.</div>
            <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(5,8,22,.07)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--nova-rage-600)" }}>Model the change →</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>conf 0.79</span>
            </div>
          </div>
        </div>
        <div data-reveal style={{ marginTop: "44px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginRight: "4px" }}>Runs automatically</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Daily fleet digest at 07:00
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Exception alerts in real time
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Monthly P&L pack on the 1st
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Auto-drafted client updates
          </span>
        </div>
      </div>
    </section>
  );
}
