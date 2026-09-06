export default function OwnerAi() {
  return (
    <section id="ai" data-screen-label="Owner AI" style={{ position: "relative", background: "#F1F4FE", padding: "112px 40px", overflow: "hidden" }}>
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
              The analyst you cannot afford,{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>running on your own data.</span>
            </h2>
          </div>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>You do not have a back office to read reports. AI reads them for you and sends the three things that matter, in plain language, before the day starts.</p>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "22px", padding: "28px 30px 30px", boxShadow: "var(--shadow-sm)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "26px" }}>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Your data, once a day</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>3 vehicles · summary at 07:00</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: ".85fr 54px 1fr 54px 1.05fr", alignItems: "center", gap: "0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                  <path d="M3 7h11v9H3z" />
                  <path d="M14 10h4l3 3v3h-7z" />
                  <circle cx="7" cy="18" r="1.6" />
                  <circle cx="17" cy="18" r="1.6" />
                </svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "#5D5D5E" }}>MH-04-KL-2210 · Tata 1109</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                  <path d="M3 7h11v9H3z" />
                  <path d="M14 10h4l3 3v3h-7z" />
                  <circle cx="7" cy="18" r="1.6" />
                  <circle cx="17" cy="18" r="1.6" />
                </svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "#5D5D5E" }}>MH-04-JN-8834 · Eicher 1110</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "13px 15px", borderRadius: "12px", background: "#F4F5FA" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                  <path d="M3 7h11v9H3z" />
                  <path d="M14 10h4l3 3v3h-7z" />
                  <circle cx="7" cy="18" r="1.6" />
                  <circle cx="17" cy="18" r="1.6" />
                </svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "#5D5D5E" }}>MH-46-C-8890 · Ashok Leyland</span>
              </div>
            </div>
            <svg viewBox="0 0 54 150" preserveAspectRatio="none" style={{ width: "100%", height: "150px" }}>
              <path d="M2 25 C26 25 30 75 52 75" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 25 C26 25 30 75 52 75" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.4s linear infinite 0s" }} />
              <path d="M2 75 L52 75" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 75 L52 75" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.4s linear infinite 0.4s" }} />
              <path d="M2 125 C26 125 30 75 52 75" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 125 C26 125 30 75 52 75" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.4s linear infinite 0.8s" }} />
            </svg>
            <div style={{ padding: "20px 20px 18px", borderRadius: "18px", background: "rgba(68,105,240,.06)", border: "1px solid rgba(68,105,240,.2)" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "14px" }}>AI checks three things</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "2px" }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span style={{ fontSize: "13.5px", lineHeight: "20px", color: "#050816" }}>Is mileage falling on any vehicle</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "2px" }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span style={{ fontSize: "13.5px", lineHeight: "20px", color: "#050816" }}>Is any trip running below cost</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "2px" }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span style={{ fontSize: "13.5px", lineHeight: "20px", color: "#050816" }}>Is a document or service due</span>
                </div>
              </div>
            </div>
            <svg viewBox="0 0 54 150" preserveAspectRatio="none" style={{ width: "100%", height: "150px" }}>
              <path d="M2 75 L52 75" fill="none" vectorEffect="non-scaling-stroke" stroke="rgba(68,105,240,.24)" strokeWidth="1.2" />
              <path d="M2 75 L52 75" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="4 96" style={{ animation: "ai-flow 2.4s linear infinite 0.3s" }} />
            </svg>
            <div style={{ borderRadius: "20px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-md)", padding: "18px 18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>GNB Edge</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>07:00</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <div style={{ padding: "12px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(68,105,240,.08)", fontSize: "13px", lineHeight: "20px", color: "#050816", animation: "ai-msg 520ms cubic-bezier(.2,0,0,1) both 0.60s" }}>Tata 1109 mileage down 12% this month.</div>
                <div style={{ padding: "12px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(68,105,240,.08)", fontSize: "13px", lineHeight: "20px", color: "#050816", animation: "ai-msg 520ms cubic-bezier(.2,0,0,1) both 0.75s" }}>Two Solapur runs did not cover cost. Short by ₹2,400 each.</div>
                <div style={{ padding: "12px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(68,105,240,.08)", fontSize: "13px", lineHeight: "20px", color: "#050816", animation: "ai-msg 520ms cubic-bezier(.2,0,0,1) both 0.90s" }}>Fitness certificate for MH-46-C-8890 expires in 9 days.</div>
              </div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "56px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>
          <span>Your trips and fills</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Kept for every vehicle</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Simple pattern checks</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Plain language findings</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>One summary a day</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>What to fix today</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>You act, from the phone</span>
        </div>
        <div data-reveal-group style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 70px", gap: "32px", alignItems: "baseline", padding: "30px 0", borderTop: "1px solid rgba(5,8,22,.1)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", letterSpacing: "-1.7px", color: "var(--nova-rage-600)", lineHeight: "1" }}>12%</span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#050816" }}>Mileage on your Tata 1109 is down this month</span>
              <span style={{ display: "block", fontSize: "15.5px", lineHeight: "25px", color: "#5D5D5E", marginTop: "9px", maxWidth: "640px" }}>Same route, same load. Worth checking the air filter and tyre pressure before the next long run.</span>
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", textAlign: "right" }}>conf 0.90</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 70px", gap: "32px", alignItems: "baseline", padding: "30px 0", borderTop: "1px solid rgba(5,8,22,.1)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", letterSpacing: "-1.7px", color: "var(--nova-rage-600)", lineHeight: "1" }}>₹64,000</span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#050816" }}>Where this month is heading</span>
              <span style={{ display: "block", fontSize: "15.5px", lineHeight: "25px", color: "#5D5D5E", marginTop: "9px", maxWidth: "640px" }}>About ₹9,000 below last month, mostly from two empty return runs on the Solapur side.</span>
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", textAlign: "right" }}>conf 0.85</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 70px", gap: "32px", alignItems: "baseline", padding: "30px 0", borderTop: "1px solid rgba(5,8,22,.1)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", letterSpacing: "-1.7px", color: "var(--nova-rage-600)", lineHeight: "1" }}>₹2,400</span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#050816" }}>Short on every Solapur run</span>
              <span style={{ display: "block", fontSize: "15.5px", lineHeight: "25px", color: "#5D5D5E", marginTop: "9px", maxWidth: "640px" }}>At today’s diesel price that lane needs ₹2,400 more per trip just to break even.</span>
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", textAlign: "right" }}>conf 0.80</span>
          </div>
          <div style={{ paddingTop: "26px", borderTop: "1px solid rgba(5,8,22,.1)", fontSize: "15px", lineHeight: "24px", color: "#93939A" }}>All three arrive as one message at 07:00. Nothing to log in to, nothing to read a report for.</div>
        </div>
        <div data-reveal style={{ marginTop: "44px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginRight: "4px" }}>Runs automatically</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Daily summary at 07:00
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Mileage drop alerts
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Service and document reminders
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Month-end profit view
          </span>
        </div>
      </div>
    </section>
  );
}
