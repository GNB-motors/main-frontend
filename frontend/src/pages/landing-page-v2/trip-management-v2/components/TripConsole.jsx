const ROWS = [
  { trip: "GNB/04817", route: "Mumbai → Nagpur", vehicle: "MH-40-BX-2291", driver: "R. Kumar", status: "In transit · 68%", statusBg: "rgba(68,105,240,.10)", statusColor: "var(--nova-rage-600)", margin: "+8%", marginColor: "#050816" },
  { trip: "GNB/04816", route: "Pune → Surat", vehicle: "MH-12-KL-8840", driver: "S. Patil", status: "Loading", statusBg: "rgba(5,8,22,.06)", statusColor: "#5D5D5E", margin: "+11%", marginColor: "#050816" },
  { trip: "GNB/04815", route: "Nashik → Indore", vehicle: "MH-15-CD-3372", driver: "A. Sheikh", status: "POD pending", statusBg: "rgba(5,8,22,.06)", statusColor: "#5D5D5E", margin: "+6%", marginColor: "#050816" },
  { trip: "GNB/04814", route: "Nagpur → Raipur", vehicle: "CG-04-HH-7719", driver: "M. Verma", status: "Delivered", statusBg: "rgba(24,122,50,.12)", statusColor: "#187A32", margin: "+14%", marginColor: "#050816" },
  { trip: "GNB/04812", route: "Aurangabad → Pune", vehicle: "—", driver: "Unassigned", status: "Needs vehicle", statusBg: "rgba(229,104,107,.14)", statusColor: "#BB2626", margin: "—", marginColor: "#93939A" },
];

const RAIL_ICONS = [
  { active: true, path: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 4v16M4 10h16" /></> },
  { active: false, path: <><path d="M4 7h13l3 4v6H4z" /><circle cx="8" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></> },
  { active: false, path: <><circle cx="12" cy="8" r="3.2" /><path d="M5 20a7 7 0 0 1 14 0" /></> },
  { active: false, path: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></> },
  { active: false, path: <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" /> },
];

const TABS = ["All trips", "In transit · 18", "Pending POD · 7", "Unassigned · 3", "Market vehicles"];

const NOTES = [
  "Costed against actual while the trip is still running",
  "PODs land from the driver app straight onto the trip",
  "Closing a trip raises the invoice and posts to the ledger",
];

export default function TripConsole() {
  return (
    <section data-screen-label="Trip console" style={{ background: "#F4F5FA", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div data-reveal style={{ display: "grid", gridTemplateColumns: "1fr .82fr", gap: "64px", alignItems: "end", marginBottom: "44px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1.12", letterSpacing: "-1.2px", margin: "0", textWrap: "pretty" }}>The dispatch board your operations room runs on.</h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>Open trips, unassigned loads and pending PODs on one screen, with every row opening into the full consignment record.</p>
        </div>

        <div data-reveal style={{ borderRadius: "var(--radius-xtra-soft)", overflow: "hidden", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-lg)", background: "#FFFFFF", display: "grid", gridTemplateColumns: "64px 1fr" }}>
          <div style={{ background: "#FAFAFC", borderRight: "1px solid rgba(5,8,22,.06)", padding: "22px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "26px", height: "26px", borderRadius: "8px", background: "var(--nova-gradient-rage)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "12px", color: "#fff", marginBottom: "14px" }}>G</span>
            {RAIL_ICONS.map((r, i) => (
              <div key={i} style={{ width: "36px", height: "36px", borderRadius: "10px", display: "grid", placeItems: "center", color: r.active ? "#4469F0" : "#93939A", background: r.active ? "rgba(68,105,240,.10)" : "transparent" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{r.path}</svg>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "20px 26px", borderBottom: "1px solid rgba(5,8,22,.06)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "17px", letterSpacing: "-.5px" }}>Dispatch board</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>Tue 14 Apr · 42 open trips</span>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "9px", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(5,8,22,.10)", color: "#93939A", fontSize: "12.5px", minWidth: "150px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                Search trips
              </span>
              <span style={{ width: "30px", height: "30px", borderRadius: "999px", background: "rgba(68,105,240,.12)", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: "600", color: "var(--nova-rage-600)" }}>RS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "16px 26px", flexWrap: "wrap" }}>
              {TABS.map((tab, i) => (
                <span
                  key={tab}
                  style={{
                    fontSize: "12.5px", fontWeight: "500", padding: "7px 13px", borderRadius: "999px", whiteSpace: "nowrap",
                    background: i === 0 ? "#050816" : "transparent",
                    border: i === 0 ? "1px solid #050816" : "1px solid rgba(5,8,22,.12)",
                    color: i === 0 ? "#FFFFFF" : "#5D5D5E",
                  }}
                >
                  {tab}
                </span>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.35fr 1.05fr .85fr 1.05fr .5fr", gap: "16px", padding: "0 26px 12px", fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>
              <span>Trip</span><span>Route</span><span>Vehicle</span><span>Driver</span><span>Status</span><span style={{ textAlign: "right" }}>Margin</span>
            </div>
            <div>
              {ROWS.map((row) => (
                <div key={row.trip} style={{ display: "grid", gridTemplateColumns: "1.05fr 1.35fr 1.05fr .85fr 1.05fr .5fr", gap: "16px", alignItems: "center", padding: "15px 26px", borderTop: "1px solid rgba(5,8,22,.06)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#5D5D5E" }}>{row.trip}</span>
                  <span style={{ fontSize: "13.5px", fontWeight: "500", color: "#050816" }}>{row.route}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#5D5D5E" }}>{row.vehicle}</span>
                  <span style={{ fontSize: "13px", color: "#5D5D5E" }}>{row.driver}</span>
                  <span>
                    <span style={{ display: "inline-block", fontSize: "11px", fontWeight: "600", padding: "5px 11px", borderRadius: "999px", background: row.statusBg, color: row.statusColor, whiteSpace: "nowrap" }}>{row.status}</span>
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: "500", textAlign: "right", color: row.marginColor }}>{row.margin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "40px", marginTop: "40px" }}>
          {NOTES.map((note) => (
            <div key={note}>
              <span style={{ display: "block", width: "28px", height: "2px", background: "var(--nova-rage-400)", marginBottom: "16px" }} />
              <div style={{ fontSize: "16px", lineHeight: "26px", color: "#050816", textWrap: "pretty" }}>{note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
