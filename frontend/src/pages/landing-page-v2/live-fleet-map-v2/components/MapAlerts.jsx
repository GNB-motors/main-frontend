export default function MapAlerts() {
  return (
    <section data-screen-label="Map alerts" style={{ background: "#F4F5FA", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: "64px", alignItems: "start" }}>
        <div data-reveal>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>Off the map</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "40px", lineHeight: "1.1", letterSpacing: "-1.3px", margin: "0 0 32px", textWrap: "pretty" }}>The map raises the alert. Dispatch does not have to watch it.</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--shadow-xs)" }}>
              <span style={{ flex: "0 0 auto", width: "38px", height: "38px", borderRadius: "11px", background: "rgba(229,104,107,.10)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#C4494C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4.5 21 19.5H3z" />
                  <path d="M12 10v4M12 17h.01" />
                </svg>
              </span>
              <div style={{ flex: "1", minWidth: "0" }}>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#050816" }}>Halt over threshold · MP-09-HT-2214</div>
                <div style={{ fontSize: "13.5px", lineHeight: "21px", color: "#5D5D5E", marginTop: "3px" }}>Stopped 47 min on NH-47, outside any geofence.</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", whiteSpace: "nowrap" }}>11:58</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--shadow-xs)" }}>
              <span style={{ flex: "0 0 auto", width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8.5" strokeDasharray="3 4" />
                  <path d="M12 12h6" />
                </svg>
              </span>
              <div style={{ flex: "1", minWidth: "0" }}>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#050816" }}>Geofence exit · WB-19-DA-5540</div>
                <div style={{ fontSize: "13.5px", lineHeight: "21px", color: "#5D5D5E", marginTop: "3px" }}>Left Kolkata depot 26 min after the planned dispatch slot.</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", whiteSpace: "nowrap" }}>06:12</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--shadow-xs)" }}>
              <span style={{ flex: "0 0 auto", width: "38px", height: "38px", borderRadius: "11px", background: "rgba(249,160,97,.14)", display: "grid", placeItems: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#C97B3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 16a8 8 0 1 1 16 0z" />
                  <path d="M12 16l4-4" />
                </svg>
              </span>
              <div style={{ flex: "1", minWidth: "0" }}>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#050816" }}>Overspeed · KA-05-MR-6612</div>
                <div style={{ fontSize: "13.5px", lineHeight: "21px", color: "#5D5D5E", marginTop: "3px" }}>84 km/h sustained for 6 min on NH-48, limit set at 70.</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", whiteSpace: "nowrap" }}>10:31</span>
            </div>
          </div>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "20px", padding: "24px 22px 26px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginBottom: "18px" }}>Map layers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#050816" }}>Vehicles</span>
              <span style={{ width: "36px", height: "20px", borderRadius: "999px", background: "var(--nova-rage-400)", position: "relative" }}>
                <span style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "999px", background: "#FFFFFF" }} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#050816" }}>Planned routes</span>
              <span style={{ width: "36px", height: "20px", borderRadius: "999px", background: "var(--nova-rage-400)", position: "relative" }}>
                <span style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "999px", background: "#FFFFFF" }} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#050816" }}>Actual trail</span>
              <span style={{ width: "36px", height: "20px", borderRadius: "999px", background: "var(--nova-rage-400)", position: "relative" }}>
                <span style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "999px", background: "#FFFFFF" }} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#5D5D5E" }}>Geofences</span>
              <span style={{ width: "36px", height: "20px", borderRadius: "999px", background: "rgba(5,8,22,.14)", position: "relative" }}>
                <span style={{ position: "absolute", top: "2px", left: "2px", width: "16px", height: "16px", borderRadius: "999px", background: "#FFFFFF" }} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#5D5D5E" }}>Depots and ICDs</span>
              <span style={{ width: "36px", height: "20px", borderRadius: "999px", background: "rgba(5,8,22,.14)", position: "relative" }}>
                <span style={{ position: "absolute", top: "2px", left: "2px", width: "16px", height: "16px", borderRadius: "999px", background: "#FFFFFF" }} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#5D5D5E" }}>Halt markers</span>
              <span style={{ width: "36px", height: "20px", borderRadius: "999px", background: "rgba(5,8,22,.14)", position: "relative" }}>
                <span style={{ position: "absolute", top: "2px", left: "2px", width: "16px", height: "16px", borderRadius: "999px", background: "#FFFFFF" }} />
              </span>
            </div>
          </div>
          <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid rgba(5,8,22,.07)", fontSize: "13.5px", lineHeight: "21px", color: "#5D5D5E" }}>Every layer state is saved per user, so dispatch and management open the map they work with.</div>
        </div>
      </div>
    </section>
  );
}
