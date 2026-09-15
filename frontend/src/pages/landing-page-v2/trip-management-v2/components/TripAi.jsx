export default function TripAi() {
  return (
    <section id="ai" data-screen-label="Trip AI" style={{ position: "relative", background: "#F1F4FE", padding: "112px 40px", overflow: "hidden" }}>
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
              AI that costs the trip{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>before you commit to it.</span>
            </h2>
          </div>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>Every closed consignment is a data point. AI prices the next one, flags the lanes quietly losing money and matches the paperwork behind them.</p>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "22px", padding: "28px 30px 30px", boxShadow: "var(--shadow-sm)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "26px" }}>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Trip lifecycle · where AI acts</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>GNB/2026/04817 · Mumbai → Nagpur</div>
          </div>
          <div style={{ paddingTop: "120px" }}>
            <div style={{ position: "relative", height: "60px" }}>
              <div style={{ position: "absolute", left: "2%", right: "2%", top: "7px", height: "2px", background: "rgba(68,105,240,.16)" }} />
              <div style={{ position: "absolute", left: "2%", width: "62%", top: "7px", height: "2px", background: "var(--nova-rage-400)", transformOrigin: "left", animation: "ai-bar 1.4s cubic-bezier(.2,0,0,1) both .3s" }} />
              <div style={{ position: "absolute", top: "2px", width: "12px", height: "12px", marginLeft: "-6px", borderRadius: "999px", background: "rgba(68,105,240,.3)", animation: "ai-run 5.5s cubic-bezier(.2,0,0,1) infinite" }} />
              <div style={{ position: "absolute", left: "2%", top: "0", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "15px", height: "15px", borderRadius: "999px", background: "#4469F0", border: "2px solid #4469F0" }} />
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#050816", whiteSpace: "nowrap" }}>Booking</span>
              </div>
              <div style={{ position: "absolute", left: "21%", top: "0", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "15px", height: "15px", borderRadius: "999px", background: "#4469F0", border: "2px solid #4469F0" }} />
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#050816", whiteSpace: "nowrap" }}>Dispatch</span>
              </div>
              <div style={{ position: "absolute", left: "43%", top: "0", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "15px", height: "15px", borderRadius: "999px", background: "#4469F0", border: "2px solid #4469F0" }} />
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#050816", whiteSpace: "nowrap" }}>In transit</span>
              </div>
              <div style={{ position: "absolute", left: "64%", top: "0", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "15px", height: "15px", borderRadius: "999px", background: "#FFFFFF", border: "2px solid rgba(68,105,240,.35)" }} />
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#93939A", whiteSpace: "nowrap" }}>Delivery</span>
              </div>
              <div style={{ position: "absolute", left: "83%", top: "0", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "15px", height: "15px", borderRadius: "999px", background: "#FFFFFF", border: "2px solid rgba(68,105,240,.35)" }} />
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#93939A", whiteSpace: "nowrap" }}>POD</span>
              </div>
              <div style={{ position: "absolute", left: "98%", top: "0", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "15px", height: "15px", borderRadius: "999px", background: "#FFFFFF", border: "2px solid rgba(68,105,240,.35)" }} />
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#93939A", whiteSpace: "nowrap" }}>Invoice</span>
              </div>
              <div style={{ position: "absolute", left: "12%", bottom: "100%", transform: "translateX(-50%)", marginBottom: "16px", width: "210px" }}>
                <div style={{ padding: "13px 15px", borderRadius: "14px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.26)", boxShadow: "var(--shadow-xs)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "7px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: "var(--nova-rage-400)", animation: "ai-blip 2.2s ease-in-out infinite" }} />
                    AI
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Prices the trip</div>
                  <div style={{ fontSize: "11.5px", lineHeight: "17px", color: "#5D5D5E", marginTop: "4px" }}>Predicted landed cost ₹38,900 against ₹42,600 quoted.</div>
                </div>
                <div style={{ width: "1px", height: "16px", background: "rgba(68,105,240,.3)", margin: "0 auto" }} />
              </div>
              <div style={{ position: "absolute", left: "50%", bottom: "100%", transform: "translateX(-50%)", marginBottom: "16px", width: "210px" }}>
                <div style={{ padding: "13px 15px", borderRadius: "14px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.26)", boxShadow: "var(--shadow-xs)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "7px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: "var(--nova-rage-400)", animation: "ai-blip 2.2s ease-in-out infinite" }} />
                    AI
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Predicts the delay</div>
                  <div style={{ fontSize: "11.5px", lineHeight: "17px", color: "#5D5D5E", marginTop: "4px" }}>Arrival slipping 42 min. Client notified automatically.</div>
                </div>
                <div style={{ width: "1px", height: "16px", background: "rgba(68,105,240,.3)", margin: "0 auto" }} />
              </div>
              <div style={{ position: "absolute", left: "88%", bottom: "100%", transform: "translateX(-50%)", marginBottom: "16px", width: "210px" }}>
                <div style={{ padding: "13px 15px", borderRadius: "14px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.26)", boxShadow: "var(--shadow-xs)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "7px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: "var(--nova-rage-400)", animation: "ai-blip 2.2s ease-in-out infinite" }} />
                    AI
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px" }}>Closes the paperwork</div>
                  <div style={{ fontSize: "11.5px", lineHeight: "17px", color: "#5D5D5E", marginTop: "4px" }}>POD matched to the trip, invoice drafted, ledger posted.</div>
                </div>
                <div style={{ width: "1px", height: "16px", background: "rgba(68,105,240,.3)", margin: "0 auto" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "26px", padding: "16px 20px", borderRadius: "14px", background: "rgba(68,105,240,.06)", border: "1px dashed rgba(68,105,240,.3)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <path d="M20 11a8 8 0 1 0-2.3 5.7" />
                <path d="M20 5v6h-6" />
              </svg>
              <span style={{ fontSize: "13.5px", lineHeight: "21px", color: "#5D5D5E" }}>Every closed trip goes back into the model. The next quote on this lane is priced on 35 runs, not 34.</span>
            </div>
          </div>
        </div>
        <div data-reveal style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "56px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>
          <span>Bookings, costs, PODs</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Full trip history</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Margin and delay models</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Which trips lose money</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Automatic trip P&L</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Pricing and assignment</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Dispatch decides</span>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", padding: "30px 32px 26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", paddingBottom: "18px" }}>
            <div style={{ paddingRight: "28px" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>The same trip without AI</div>
            </div>
            <div style={{ paddingLeft: "28px", borderLeft: "1px solid rgba(5,8,22,.06)", display: "flex", alignItems: "center", gap: "11px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", animation: "ai-blip 2.2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>With GNB Edge AI</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderTop: "1px solid rgba(5,8,22,.06)" }}>
            <div style={{ padding: "22px 28px 22px 0", fontSize: "15px", lineHeight: "24px", color: "#93939A" }}>Quoted from last year’s rate card and a feel for the lane.</div>
            <div style={{ padding: "22px 0 22px 28px", borderLeft: "1px solid rgba(5,8,22,.06)", fontSize: "15px", lineHeight: "24px", color: "#050816" }}>Priced on 34 comparable runs. Predicted landed cost ₹38,900 against ₹42,600 quoted, at booking.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderTop: "1px solid rgba(5,8,22,.06)" }}>
            <div style={{ padding: "22px 28px 22px 0", fontSize: "15px", lineHeight: "24px", color: "#93939A" }}>The delay is discovered when the client calls to ask.</div>
            <div style={{ padding: "22px 0 22px 28px", borderLeft: "1px solid rgba(5,8,22,.06)", fontSize: "15px", lineHeight: "24px", color: "#050816" }}>Arrival slip of 42 minutes flagged at 14:20. Client notified before they noticed.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderTop: "1px solid rgba(5,8,22,.06)" }}>
            <div style={{ padding: "22px 28px 22px 0", fontSize: "15px", lineHeight: "24px", color: "#93939A" }}>POD chased at month end, invoice raised a week late.</div>
            <div style={{ padding: "22px 0 22px 28px", borderLeft: "1px solid rgba(5,8,22,.06)", fontSize: "15px", lineHeight: "24px", color: "#050816" }}>POD matched to the trip on upload, invoice drafted, ledger posted the same day.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderTop: "1px solid rgba(5,8,22,.06)" }}>
            <div style={{ padding: "22px 28px 22px 0", fontSize: "15px", lineHeight: "24px", color: "#93939A" }}>Mumbai → Indore quietly loses margin for a quarter.</div>
            <div style={{ padding: "22px 0 22px 28px", borderLeft: "1px solid rgba(5,8,22,.06)", fontSize: "15px", lineHeight: "24px", color: "#050816" }}>Lane flagged at 11% below costed margin after eight trips, with detention named as the cause.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", paddingTop: "22px", marginTop: "6px", borderTop: "2px solid rgba(5,8,22,.1)" }}>
            <span style={{ fontSize: "15.5px", fontWeight: "600" }}>Quote to hold on the Surat renewal</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "28px", letterSpacing: "-1px", color: "var(--nova-rage-600)" }}>₹46,200</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>conf 0.83</span>
            </span>
          </div>
        </div>
        <div data-reveal style={{ marginTop: "44px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginRight: "4px" }}>Runs automatically</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Predicted cost at booking
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Delay and detention alerts
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Automatic POD matching
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Monthly route P&L
          </span>
        </div>
      </div>
    </section>
  );
}
