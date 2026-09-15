export default function TrackingAi() {
  return (
    <section id="ai" data-screen-label="Tracking AI" style={{ position: "relative", background: "#F1F4FE", padding: "112px 40px", overflow: "hidden" }}>
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
              AI watching the map{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>so nobody has to.</span>
            </h2>
          </div>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>Tracking writes a ping every thirty seconds. AI turns that stream into deviations, dwell patterns and arrival times you can commit to in front of a client.</p>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "22px", padding: "28px 30px 30px", boxShadow: "var(--shadow-sm)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "26px" }}>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Anomaly timeline · one vehicle, one day</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>MH-12-AB-4471 · 2,880 GPS pings</div>
          </div>
          <div style={{ paddingTop: "74px" }}>
            <div style={{ position: "relative", height: "46px", borderRadius: "8px", background: "#F4F5FA", overflow: "visible" }}>
              <div style={{ position: "absolute", left: "0%", width: "26%", top: "0", bottom: "0", background: "rgba(68,105,240,.45)", borderRadius: "6px" }} title="Moving" />
              <div style={{ position: "absolute", left: "26%", width: "13%", top: "0", bottom: "0", background: "rgba(229,104,107,.45)", borderRadius: "6px" }} title="Unscheduled halt" />
              <div style={{ position: "absolute", left: "39%", width: "22%", top: "0", bottom: "0", background: "rgba(68,105,240,.45)", borderRadius: "6px" }} title="Moving" />
              <div style={{ position: "absolute", left: "61%", width: "9%", top: "0", bottom: "0", background: "rgba(249,160,97,.5)", borderRadius: "6px" }} title="Off corridor" />
              <div style={{ position: "absolute", left: "70%", width: "14%", top: "0", bottom: "0", background: "rgba(68,105,240,.45)", borderRadius: "6px" }} title="Moving" />
              <div style={{ position: "absolute", left: "84%", right: "0", top: "0", bottom: "0", borderRadius: "6px", border: "1.5px dashed rgba(68,105,240,.4)", background: "rgba(68,105,240,.06)" }} />
              <div style={{ position: "absolute", top: "-6px", bottom: "-6px", width: "2px", background: "linear-gradient(180deg, transparent, #4469F0, transparent)", animation: "ai-scan 6s cubic-bezier(.2,0,0,1) infinite" }} />
              <div style={{ position: "absolute", left: "32%", bottom: "100%", transform: "translateX(-50%)", marginBottom: "14px", whiteSpace: "nowrap" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 12px", borderRadius: "999px", background: "rgba(229,104,107,.12)", border: "1px solid rgba(229,104,107,.3)", fontSize: "12px", fontWeight: "500", color: "#C4494C" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#E5686B", animation: "ai-blip 2.2s ease-in-out infinite" }} />
                  47 min idle · ₹340 diesel{' '}
                </div>
                <div style={{ width: "1px", height: "14px", background: "rgba(229,104,107,.4)", margin: "0 auto" }} />
              </div>
              <div style={{ position: "absolute", left: "65%", bottom: "100%", transform: "translateX(-50%)", marginBottom: "14px", whiteSpace: "nowrap" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 12px", borderRadius: "999px", background: "rgba(229,104,107,.12)", border: "1px solid rgba(229,104,107,.3)", fontSize: "12px", fontWeight: "500", color: "#C4494C" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#E5686B", animation: "ai-blip 2.2s ease-in-out infinite" }} />
                  Off corridor, 8 km{' '}
                </div>
                <div style={{ width: "1px", height: "14px", background: "rgba(229,104,107,.4)", margin: "0 auto" }} />
              </div>
              <div style={{ position: "absolute", left: "92%", bottom: "100%", transform: "translateX(-50%)", marginBottom: "14px", whiteSpace: "nowrap" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 12px", borderRadius: "999px", background: "rgba(68,105,240,.10)", border: "1px solid rgba(68,105,240,.26)", fontSize: "12px", fontWeight: "500", color: "var(--nova-rage-700)" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#4469F0", animation: "ai-blip 2.2s ease-in-out infinite" }} />
                  Predicted arrival 18:42{' '}
                </div>
                <div style={{ width: "1px", height: "14px", background: "rgba(68,105,240,.34)", margin: "0 auto" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#93939A" }}>
              <span>06:00</span>
              <span>09:00</span>
              <span>12:00</span>
              <span>15:00</span>
              <span>18:00</span>
              <span>21:00</span>
            </div>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(5,8,22,.07)", fontSize: "12px", color: "#5D5D5E" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "3px", background: "rgba(68,105,240,.45)" }} />
                Moving as planned
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "3px", background: "rgba(229,104,107,.45)" }} />
                Halt AI did not expect
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "3px", background: "rgba(249,160,97,.5)" }} />
                Route deviation
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "3px", border: "1.5px dashed rgba(68,105,240,.5)" }} />
                Predicted, not yet driven
              </span>
            </div>
          </div>
        </div>
        <div data-reveal style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "56px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>
          <span>GPS ping every 30 s</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Route and halt history</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Deviation and idling models</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Where time is lost</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Daily movement summary</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Route and stop changes</span>
          <span style={{ color: "var(--nova-rage-400)" }}>→</span>
          <span>Dispatcher acts on it</span>
        </div>
        <div data-reveal-group style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "18px 24px", borderBottom: "1px solid rgba(5,8,22,.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#4469F0", animation: "ai-blip 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#050816" }}>Live insight feed</span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>today · 3 open</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "74px 148px 1fr 190px 62px", alignItems: "center", gap: "20px", padding: "20px 24px", borderBottom: "1px solid rgba(5,8,22,.05)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#93939A" }}>14:22</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#5D5D5E" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#E5686B", flex: "0 0 auto" }} />
              Smart alert
            </span>
            <span>
              <span style={{ display: "block", fontSize: "15.5px", fontWeight: "500", letterSpacing: "-.15px", color: "#050816" }}>MH-12-AB-4471 idling 47 minutes at Bhiwandi</span>
              <span style={{ display: "block", fontSize: "13px", lineHeight: "20px", color: "#93939A", marginTop: "3px" }}>No scheduled stop, ₹340 of diesel burned</span>
            </span>
            <a href="#ai" style={{ fontSize: "13.5px", fontWeight: "600" }}>Call the driver →</a>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", textAlign: "right" }}>0.94</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "74px 148px 1fr 190px 62px", alignItems: "center", gap: "20px", padding: "20px 24px", borderBottom: "1px solid rgba(5,8,22,.05)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#93939A" }}>14:05</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#5D5D5E" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#4469F0", flex: "0 0 auto" }} />
              Prediction
            </span>
            <span>
              <span style={{ display: "block", fontSize: "15.5px", fontWeight: "500", letterSpacing: "-.15px", color: "#050816" }}>Nagpur run arriving 18:42, 42 minutes past window</span>
              <span style={{ display: "block", fontSize: "13px", lineHeight: "20px", color: "#93939A", marginTop: "3px" }}>Live speed plus eleven past runs on this lane</span>
            </span>
            <a href="#ai" style={{ fontSize: "13.5px", fontWeight: "600" }}>Notify the client →</a>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", textAlign: "right" }}>0.88</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "74px 148px 1fr 190px 62px", alignItems: "center", gap: "20px", padding: "20px 24px", borderBottom: "1px solid rgba(5,8,22,.05)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#93939A" }}>09:40</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#5D5D5E" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#187A32", flex: "0 0 auto" }} />
              Recommendation
            </span>
            <span>
              <span style={{ display: "block", fontSize: "15.5px", fontWeight: "500", letterSpacing: "-.15px", color: "#050816" }}>Route the Wardha leg via NH-44</span>
              <span style={{ display: "block", fontSize: "13px", lineHeight: "20px", color: "#93939A", marginTop: "3px" }}>Saves 38 minutes on twelve weekly runs at the same fuel cost</span>
            </span>
            <a href="#ai" style={{ fontSize: "13.5px", fontWeight: "600" }}>Apply to the lane →</a>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", textAlign: "right" }}>0.82</span>
          </div>
        </div>
        <div data-reveal style={{ marginTop: "44px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginRight: "4px" }}>Runs automatically</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Unscheduled halt detection
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Predicted ETA on every trip
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Geofence tuning from history
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
            Weekly movement report
          </span>
        </div>
      </div>
    </section>
  );
}
