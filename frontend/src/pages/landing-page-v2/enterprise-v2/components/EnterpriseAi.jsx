export default function EnterpriseAi() {
  return (
    <section id="ai" data-screen-label="Enterprise AI" style={{ position: "relative", background: "#F1F4FE", padding: "112px 40px", overflow: "hidden" }}>
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
              AI across every entity,{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>with the governance to match.</span>
            </h2>
          </div>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>One model layer over every depot and entity, configured to your rules. Insights roll up to the group, and the data never leaves the boundary your security team approved.</p>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "22px", padding: "28px 30px 30px", boxShadow: "var(--shadow-sm)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "26px" }}>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Governed model layer · group topology</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>6 entities · 38 depots · 1,240 vehicles</div>
          </div>
          <div>
            <div style={{ display: "flex", gap: "14px" }}>
              <div style={{ flex: "1 1 0", padding: "16px 16px 15px", borderRadius: "16px", background: "#F4F5FA" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", marginBottom: "11px" }}>Entity A · North</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  <span style={{ padding: "5px 10px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#5D5D5E" }}>Depot 03</span>
                  <span style={{ padding: "5px 10px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#5D5D5E" }}>Depot 07</span>
                  <span style={{ padding: "5px 10px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#5D5D5E" }}>Depot 11</span>
                </div>
              </div>
              <div style={{ flex: "1 1 0", padding: "16px 16px 15px", borderRadius: "16px", background: "#F4F5FA" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", marginBottom: "11px" }}>Entity B · West</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  <span style={{ padding: "5px 10px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#5D5D5E" }}>Depot 12</span>
                  <span style={{ padding: "5px 10px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#5D5D5E" }}>Depot 19</span>
                </div>
              </div>
              <div style={{ flex: "1 1 0", padding: "16px 16px 15px", borderRadius: "16px", background: "#F4F5FA" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", marginBottom: "11px" }}>Entity C · South</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  <span style={{ padding: "5px 10px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#5D5D5E" }}>Depot 22</span>
                  <span style={{ padding: "5px 10px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#5D5D5E" }}>Depot 27</span>
                  <span style={{ padding: "5px 10px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#5D5D5E" }}>Depot 31</span>
                </div>
              </div>
            </div>
            <svg viewBox="0 0 300 46" preserveAspectRatio="none" style={{ width: "100%", height: "46px", display: "block" }}>
              <path d="M50 2 C50 26 150 20 150 44" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M50 2 C50 26 150 20 150 44" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0s" }} />
              <path d="M150 2 L150 44" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M150 2 L150 44" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0.4s" }} />
              <path d="M250 2 C250 26 150 20 150 44" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M250 2 C250 26 150 20 150 44" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0.8s" }} />
            </svg>
            <div style={{ padding: "22px 24px", borderRadius: "18px", background: "linear-gradient(150deg, rgba(68,105,240,.1), rgba(68,105,240,.04))", border: "1px solid rgba(68,105,240,.28)", animation: "ai-band 3.6s cubic-bezier(.2,0,0,1) infinite" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
                  <span style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(150deg,#4469F0,#213EA7)", display: "grid", placeItems: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                      <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
                    </svg>
                  </span>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px" }}>Group model layer</div>
                    <div style={{ fontSize: "12.5px", color: "#5D5D5E", marginTop: "3px" }}>Trained on group data, scoped per entity</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "8px 13px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.2)", fontSize: "12px", fontWeight: "500" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
                    </svg>
                    Data residency
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "8px 13px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.2)", fontSize: "12px", fontWeight: "500" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
                    </svg>
                    Role-based access
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "8px 13px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.2)", fontSize: "12px", fontWeight: "500" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
                    </svg>
                    Full audit trail
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "8px 13px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.2)", fontSize: "12px", fontWeight: "500" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
                    </svg>
                    Model versioning
                  </span>
                </div>
              </div>
            </div>
            <svg viewBox="0 0 300 46" preserveAspectRatio="none" style={{ width: "100%", height: "46px", display: "block" }}>
              <path d="M150 2 C150 26 50 20 50 44" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M150 2 C150 26 50 20 50 44" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0.2s" }} />
              <path d="M150 2 L150 44" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M150 2 L150 44" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0.6s" }} />
              <path d="M150 2 C150 26 250 20 250 44" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M150 2 C150 26 250 20 250 44" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 1s" }} />
            </svg>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
              <div style={{ padding: "17px 19px", borderRadius: "14px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ fontSize: "13.5px", fontWeight: "600", letterSpacing: "-.1px" }}>Cross-entity anomalies</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "6px" }}>Three depots 14 points below group median utilisation</div>
              </div>
              <div style={{ padding: "17px 19px", borderRadius: "14px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ fontSize: "13.5px", fontWeight: "600", letterSpacing: "-.1px" }}>Group forecast</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "6px" }}>Cost per km trending to ₹31.40 in Q3, 4.6% above plan</div>
              </div>
              <div style={{ padding: "17px 19px", borderRadius: "14px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ fontSize: "13.5px", fontWeight: "600", letterSpacing: "-.1px" }}>Board pack</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "6px" }}>Generated on the 1st, same numbers finance signs off</div>
              </div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "56px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>
          <span>Every depot and entity</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Group data layer</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Governed models</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Cross-entity anomalies</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Board-ready packs</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Ranked by group impact</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Programme team acts</span>
        </div>
        <div data-reveal-group style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 170px 190px", gap: "28px", alignItems: "center", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", padding: "26px 28px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--nova-rage-600)" }}>01</span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.45px" }}>Utilisation gap at three depots</span>
              <span style={{ display: "block", fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", marginTop: "7px" }}>Depots 7, 12 and 19 are running 14 points below group median on comparable lane mix.</span>
            </span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", color: "var(--nova-rage-600)" }}>₹1.8Cr</span>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "4px" }}>annualised</span>
            </span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>Assigned to</span>
              <span style={{ display: "block", fontSize: "14.5px", fontWeight: "500", marginTop: "6px" }}>Regional COO</span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 170px 190px", gap: "28px", alignItems: "center", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", padding: "26px 28px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--nova-rage-600)" }}>02</span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.45px" }}>Cost per km drifting above plan</span>
              <span style={{ display: "block", fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", marginTop: "7px" }}>Group trending to ₹31.40 in Q3, 4.6% above plan. Western region carries most of the variance.</span>
            </span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", color: "var(--nova-rage-600)" }}>₹94L</span>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "4px" }}>against plan</span>
            </span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>Assigned to</span>
              <span style={{ display: "block", fontSize: "14.5px", fontWeight: "500", marginTop: "6px" }}>Group finance</span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 170px 190px", gap: "28px", alignItems: "center", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", padding: "26px 28px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--nova-rage-600)" }}>03</span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.45px" }}>Rebalance 40 vehicles to Depot 7</span>
              <span style={{ display: "block", fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", marginTop: "7px" }}>Contracted volume at Depot 7 exceeds capacity while Depot 12 sits idle three days a week.</span>
            </span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", color: "var(--nova-rage-600)" }}>₹2.4Cr</span>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "4px" }}>contribution</span>
            </span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>Assigned to</span>
              <span style={{ display: "block", fontSize: "14.5px", fontWeight: "500", marginTop: "6px" }}>Programme office</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", padding: "8px 4px 0", fontSize: "14.5px", color: "#93939A" }}>
            <span>Ranked by group impact, refreshed weekly and carried into the board pack.</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px" }}>conf 0.78 – 0.92</span>
          </div>
        </div>
        <div data-reveal style={{ marginTop: "44px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginRight: "4px" }}>Runs automatically</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Cross-entity anomaly detection
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Utilisation forecasting
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Automatic board pack
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Access-controlled, in your region
          </span>
        </div>
      </div>
    </section>
  );
}
