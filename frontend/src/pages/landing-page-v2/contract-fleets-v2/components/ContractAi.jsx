export default function ContractAi() {
  return (
    <section id="ai" data-screen-label="Contract AI" style={{ position: "relative", background: "#F1F4FE", padding: "112px 40px", overflow: "hidden" }}>
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
              AI on the contract margin,{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>load by load.</span>
            </h2>
          </div>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>Rate cards, SLAs, detention and billing sit in the same record as the trips. AI watches the gap between what you agreed to and what you are actually running.</p>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "22px", padding: "28px 30px 30px", boxShadow: "var(--shadow-sm)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "26px" }}>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Contract versus running · Hosur lane</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>14 trips this month</div>
          </div>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 1fr", gap: "18px", paddingBottom: "8px" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>What you agreed</div>
              <div style={{ textAlign: "center", fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>AI reads the gap</div>
              <div style={{ textAlign: "right", fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>What you are running</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 1fr", alignItems: "center", gap: "18px", padding: "15px 0", borderTop: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Rate per trip</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>₹46,200</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 13px", borderRadius: "999px", background: "rgba(229,104,107,.1)", color: "#C4494C", fontFamily: "var(--font-mono)", fontSize: "12px" }}>−₹2,350</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>₹43,850</span>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Rate per trip</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 1fr", alignItems: "center", gap: "18px", padding: "15px 0", borderTop: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>On-time delivery</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>97.0%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 13px", borderRadius: "999px", background: "rgba(229,104,107,.1)", color: "#C4494C", fontFamily: "var(--font-mono)", fontSize: "12px" }}>−0.8 pt</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>96.2%</span>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>On-time delivery</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 1fr", alignItems: "center", gap: "18px", padding: "15px 0", borderTop: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Detention billed</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>₹2.1L due</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 13px", borderRadius: "999px", background: "rgba(229,104,107,.1)", color: "#C4494C", fontFamily: "var(--font-mono)", fontSize: "12px" }}>unbilled</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>₹0 raised</span>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Detention billed</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 1fr", alignItems: "center", gap: "18px", padding: "15px 0", borderTop: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Free hours at consignee</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>4 h</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 13px", borderRadius: "999px", background: "rgba(229,104,107,.1)", color: "#C4494C", fontFamily: "var(--font-mono)", fontSize: "12px" }}>+2.4 h</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>6.4 h avg</span>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Free hours at consignee</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 1fr", alignItems: "center", gap: "18px", padding: "15px 0", borderTop: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Volume commitment</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>120 trips</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 13px", borderRadius: "999px", background: "rgba(24,122,50,.1)", color: "#187A32", fontFamily: "var(--font-mono)", fontSize: "12px" }}>+11</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#050816" }}>131 trips</span>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Volume commitment</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginTop: "26px", paddingTop: "22px", borderTop: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ padding: "18px 20px", borderRadius: "14px", background: "rgba(229,104,107,.07)", border: "1px solid rgba(229,104,107,.2)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", color: "#C4494C" }}>₹2.1L</div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>Billing leakage found</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "4px" }}>Detention hours never invoiced</div>
              </div>
              <div style={{ padding: "18px 20px", borderRadius: "14px", background: "#F4F5FA", border: "1px solid transparent" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", color: "#050816" }}>96.2%</div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>SLA closing below floor</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "4px" }}>Two more late runs triggers penalty</div>
              </div>
              <div style={{ padding: "18px 20px", borderRadius: "14px", background: "#F4F5FA", border: "1px solid transparent" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", color: "#050816" }}>₹46,200</div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>Rate to hold at renewal</div>
                <div style={{ fontSize: "12px", lineHeight: "18px", color: "#5D5D5E", marginTop: "4px" }}>Diesel up 6% since signing</div>
              </div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "56px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>
          <span>Trips against contract</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Rate and SLA terms</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Margin and SLA models</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Where the contract leaks</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Client-ready performance</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Rate and route changes</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Account manager acts</span>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-md)", padding: "40px 44px 34px", maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", paddingBottom: "24px" }}>
            <div>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginBottom: "12px" }}>Account review · generated by GNB Edge AI</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", letterSpacing: "-1.1px" }}>Hosur lane · monthly review</div>
            </div>
            <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "#93939A", lineHeight: "19px" }}>
              1 Sep 2026
              <br />
              14 trips · 131 of 120 committed
            </div>
          </div>
          <div style={{ padding: "24px 0", borderTop: "1px solid rgba(5,8,22,.08)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "28px", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Finding</span>
              <span>
                <span style={{ display: "block", fontSize: "17px", lineHeight: "27px", fontWeight: "500", letterSpacing: "-.2px", color: "#050816" }}>Detention on the lane is unbilled across 14 trips.</span>
                <span style={{ display: "block", fontSize: "15px", lineHeight: "25px", color: "#5D5D5E", marginTop: "8px" }}>₹2.1L is billable under the current contract and is sitting outside the invoice run. Free hours were agreed at 4, the lane is averaging 6.4.</span>
              </span>
            </div>
          </div>
          <div style={{ padding: "24px 0", borderTop: "1px solid rgba(5,8,22,.08)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "28px", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Risk</span>
              <span>
                <span style={{ display: "block", fontSize: "17px", lineHeight: "27px", fontWeight: "500", letterSpacing: "-.2px", color: "#050816" }}>On-time performance will close the month at 96.2%.</span>
                <span style={{ display: "block", fontSize: "15px", lineHeight: "25px", color: "#5D5D5E", marginTop: "8px" }}>The SLA floor is 97%. Two more late deliveries triggers the penalty clause, worth ₹3.4L against this contract.</span>
              </span>
            </div>
          </div>
          <div style={{ padding: "24px 0", borderTop: "1px solid rgba(5,8,22,.08)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "28px", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Recommendation</span>
              <span>
                <span style={{ display: "block", fontSize: "17px", lineHeight: "27px", fontWeight: "500", letterSpacing: "-.2px", color: "#050816" }}>Reopen the rate at renewal, at ₹46,200 per trip.</span>
                <span style={{ display: "block", fontSize: "15px", lineHeight: "25px", color: "#5D5D5E", marginTop: "8px" }}>Diesel is up 6% since signing and the lane now runs at a 3% margin. Volume is 9% above commitment, which supports the case.</span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", paddingTop: "24px", borderTop: "2px solid rgba(5,8,22,.1)" }}>
            <span style={{ fontSize: "14.5px", color: "#5D5D5E" }}>Every number above opens the trips behind it.</span>
            <a href="#ai" style={{ fontSize: "14.5px", fontWeight: "600" }}>Open the account review →</a>
          </div>
        </div>
        <div data-reveal style={{ marginTop: "44px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginRight: "4px" }}>Runs automatically</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Billing leakage detection
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            SLA breach prediction
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Automatic client report
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Rate revision alerts
          </span>
        </div>
      </div>
    </section>
  );
}
