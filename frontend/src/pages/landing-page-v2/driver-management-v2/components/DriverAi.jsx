export default function DriverAi() {
  return (
    <section id="ai" data-screen-label="Driver AI" style={{ position: "relative", background: "#F1F4FE", padding: "112px 40px", overflow: "hidden" }}>
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
              AI that knows which driver needs attention{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>before the incident.</span>
            </h2>
          </div>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>Licences, duty hours, telemetry and incident history sit on one profile. AI scores risk, chases expiring documents and drafts the coaching note for the supervisor.</p>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "22px", padding: "28px 30px 30px", boxShadow: "var(--shadow-sm)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "26px" }}>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Driver risk model · signals in, score out</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>R. Kumar · 90-day window</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 62px 1.05fr 62px 1fr", alignItems: "center", gap: "0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "500", color: "#050816" }}>Duty hours</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>58 / 60 h</span>
                </div>
                <div style={{ height: "4px", borderRadius: "999px", background: "rgba(5,8,22,.08)" }}>
                  <div style={{ height: "100%", width: "92%", borderRadius: "999px", background: "var(--nova-rage-400)", transformOrigin: "left", animation: "ai-bar 900ms cubic-bezier(.2,0,0,1) both 0.20s" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "500", color: "#050816" }}>Harsh braking</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>11 events</span>
                </div>
                <div style={{ height: "4px", borderRadius: "999px", background: "rgba(5,8,22,.08)" }}>
                  <div style={{ height: "100%", width: "46%", borderRadius: "999px", background: "var(--nova-rage-400)", transformOrigin: "left", animation: "ai-bar 900ms cubic-bezier(.2,0,0,1) both 0.32s" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "500", color: "#050816" }}>Night driving</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>38% of km</span>
                </div>
                <div style={{ height: "4px", borderRadius: "999px", background: "rgba(5,8,22,.08)" }}>
                  <div style={{ height: "100%", width: "62%", borderRadius: "999px", background: "var(--nova-rage-400)", transformOrigin: "left", animation: "ai-bar 900ms cubic-bezier(.2,0,0,1) both 0.44s" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "500", color: "#050816" }}>Documents</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>1 expiring</span>
                </div>
                <div style={{ height: "4px", borderRadius: "999px", background: "rgba(5,8,22,.08)" }}>
                  <div style={{ height: "100%", width: "24%", borderRadius: "999px", background: "var(--nova-rage-400)", transformOrigin: "left", animation: "ai-bar 900ms cubic-bezier(.2,0,0,1) both 0.56s" }} />
                </div>
              </div>
            </div>
            <svg viewBox="0 0 60 200" preserveAspectRatio="none" style={{ width: "100%", height: "190px" }}>
              <path d="M2 30 C30 30 34 100 58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 30 C30 30 34 100 58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0s" }} />
              <path d="M2 77 C30 77 34 100 58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 77 C30 77 34 100 58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0.4s" }} />
              <path d="M2 123 C30 123 34 100 58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 123 C30 123 34 100 58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0.8s" }} />
              <path d="M2 170 C30 170 34 100 58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 170 C30 170 34 100 58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 1.2s" }} />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "22px 18px", borderRadius: "18px", background: "rgba(68,105,240,.06)", border: "1px solid rgba(68,105,240,.2)" }}>
              <svg viewBox="0 0 200 112" style={{ width: "190px", height: "106px" }}>
                <path d="M18 100 A82 82 0 0 1 182 100" fill="none" stroke="rgba(5,8,22,.09)" strokeWidth="13" strokeLinecap="round" />
                <path d="M18 100 A82 82 0 0 1 182 100" fill="none" stroke="#4469F0" strokeWidth="13" strokeLinecap="round" strokeDasharray="300" style={{ animation: "ai-arc 1.4s cubic-bezier(.2,0,0,1) both .3s" }} />
                <text x="100" y="84" textAnchor="middle" style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "40px", letterSpacing: "-1.5px", fill: "#050816" }}>68</text>
                <text x="100" y="104" textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fill: "#93939A" }}>risk score</text>
              </svg>
              <div style={{ fontSize: "12.5px", lineHeight: "19px", color: "#5D5D5E", textAlign: "center" }}>Above the 60 threshold. Fatigue is the largest single contributor this week.</div>
            </div>
            <svg viewBox="0 0 60 200" preserveAspectRatio="none" style={{ width: "100%", height: "190px" }}>
              <path d="M2 100 C26 100 30 40 58 40" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 100 C26 100 30 40 58 40" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0.2s" }} />
              <path d="M2 100 L58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 100 L58 100" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 0.6s" }} />
              <path d="M2 100 C26 100 30 160 58 160" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 100 C26 100 30 160 58 160" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.6s linear infinite 1s" }} />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ padding: "15px 17px", borderRadius: "14px", background: "#FFFFFF", border: "1px solid rgba(229,104,107,.28)", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ fontSize: "13.5px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816" }}>Fatigue alert</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "5px" }}>Supervisor notified before the Friday night run.</div>
              </div>
              <div style={{ padding: "15px 17px", borderRadius: "14px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.2)", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ fontSize: "13.5px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816" }}>Coaching note</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "5px" }}>Braking pattern on descents, drafted and assigned.</div>
              </div>
              <div style={{ padding: "15px 17px", borderRadius: "14px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.2)", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ fontSize: "13.5px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816" }}>Roster change</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "5px" }}>Surat night run reassigned to S. Yadav.</div>
              </div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "56px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>
          <span>Duty hours, telemetry</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>One driver profile</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Risk and fatigue models</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Who is trending badly</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Monthly scorecards</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Coaching and rostering</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Supervisor follows up</span>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "18px 24px", borderBottom: "1px solid rgba(5,8,22,.07)" }}>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#050816" }}>Driver watchlist · this week</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>ranked by risk</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 92px 1.6fr 1.1fr", gap: "20px", padding: "13px 24px", background: "#F4F5FA", fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>
            <span>Driver</span>
            <span>Risk</span>
            <span>What AI saw</span>
            <span>Next action</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 92px 1.6fr 1.1fr", gap: "20px", alignItems: "center", padding: "20px 24px", borderTop: "1px solid rgba(5,8,22,.05)" }}>
            <span>
              <span style={{ display: "block", fontSize: "15px", fontWeight: "600", letterSpacing: "-.15px" }}>A. Singh</span>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "3px" }}>MH-04-JN-8834</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "20px", letterSpacing: "-.6px", color: "#E5686B" }}>74</span>
              <span style={{ flex: "1", height: "4px", borderRadius: "999px", background: "rgba(5,8,22,.08)" }}>
                <span style={{ display: "block", height: "100%", width: "74%", borderRadius: "999px", background: "#E5686B" }} />
              </span>
            </span>
            <span style={{ fontSize: "14px", lineHeight: "21px", color: "#5D5D5E" }}>Licence expires in 11 days, medical not booked</span>
            <a href="#ai" style={{ fontSize: "13.5px", fontWeight: "600" }}>Reminder sent, escalate Friday →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 92px 1.6fr 1.1fr", gap: "20px", alignItems: "center", padding: "20px 24px", borderTop: "1px solid rgba(5,8,22,.05)" }}>
            <span>
              <span style={{ display: "block", fontSize: "15px", fontWeight: "600", letterSpacing: "-.15px" }}>R. Kumar</span>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "3px" }}>MH-40-BX-2291</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "20px", letterSpacing: "-.6px", color: "#E5686B" }}>68</span>
              <span style={{ flex: "1", height: "4px", borderRadius: "999px", background: "rgba(5,8,22,.08)" }}>
                <span style={{ display: "block", height: "100%", width: "68%", borderRadius: "999px", background: "#E5686B" }} />
              </span>
            </span>
            <span style={{ fontSize: "14px", lineHeight: "21px", color: "#5D5D5E" }}>Projected 62 duty hours by Friday, above threshold</span>
            <a href="#ai" style={{ fontSize: "13.5px", fontWeight: "600" }}>Rebalance the roster →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 92px 1.6fr 1.1fr", gap: "20px", alignItems: "center", padding: "20px 24px", borderTop: "1px solid rgba(5,8,22,.05)" }}>
            <span>
              <span style={{ display: "block", fontSize: "15px", fontWeight: "600", letterSpacing: "-.15px" }}>S. Yadav</span>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "3px" }}>MH-46-C-8890</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "20px", letterSpacing: "-.6px", color: "#187A32" }}>22</span>
              <span style={{ flex: "1", height: "4px", borderRadius: "999px", background: "rgba(5,8,22,.08)" }}>
                <span style={{ display: "block", height: "100%", width: "22%", borderRadius: "999px", background: "#187A32" }} />
              </span>
            </span>
            <span style={{ fontSize: "14px", lineHeight: "21px", color: "#5D5D5E" }}>Lowest harsh-braking rate on night lanes, 90 days</span>
            <a href="#ai" style={{ fontSize: "13.5px", fontWeight: "600" }}>Assign the Surat night run →</a>
          </div>
        </div>
        <div data-reveal style={{ marginTop: "44px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginRight: "4px" }}>Runs automatically</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Automatic document reminders
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Driver risk score
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Fatigue and hours alerts
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Monthly scorecard generated
          </span>
        </div>
      </div>
    </section>
  );
}
