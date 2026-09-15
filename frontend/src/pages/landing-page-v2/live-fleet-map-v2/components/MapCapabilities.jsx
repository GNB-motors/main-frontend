export default function MapCapabilities() {
  return (
    <section data-screen-label="Map capabilities" style={{ background: "#FFFFFF", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 data-reveal style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 56px", maxWidth: "760px", textWrap: "pretty" }}>What the map gives dispatch.</h2>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "26px 24px 28px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)" }}>
            <span style={{ width: "42px", height: "42px", borderRadius: "13px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.4px", marginTop: "20px" }}>Live positions</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "10px", textWrap: "pretty" }}>Every vehicle plotted with heading, speed and last ping, refreshed every 30 seconds.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "26px 24px 28px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)" }}>
            <span style={{ width: "42px", height: "42px", borderRadius: "13px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19c5-1 6-6 10-7s5-4 6-5" />
                <circle cx="4.5" cy="19" r="1.8" />
                <circle cx="19.5" cy="7" r="1.8" />
              </svg>
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.4px", marginTop: "20px" }}>Planned route and actual trail</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "10px", textWrap: "pretty" }}>The path the truck actually took, drawn against the route it was given.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "26px 24px 28px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)" }}>
            <span style={{ width: "42px", height: "42px", borderRadius: "13px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8.5" strokeDasharray="3 4" />
                <circle cx="12" cy="12" r="2.6" />
              </svg>
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.4px", marginTop: "20px" }}>Geofences</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "10px", textWrap: "pretty" }}>Depots, client sites and ICDs with entry and exit stamped on the trip record.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "26px 24px 28px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)" }}>
            <span style={{ width: "42px", height: "42px", borderRadius: "13px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.4px", marginTop: "20px" }}>Halt and idle detection</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "10px", textWrap: "pretty" }}>An unplanned stop is flagged the moment it crosses the threshold you set.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "26px 24px 28px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)" }}>
            <span style={{ width: "42px", height: "42px", borderRadius: "13px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2.5" />
                <path d="M8 9h8M8 13h5" />
              </svg>
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.4px", marginTop: "20px" }}>Trip and consignment overlay</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "10px", textWrap: "pretty" }}>Driver, client, consignment and documents open from the pin, not another screen.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "26px 24px 28px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1), border-color 200ms cubic-bezier(.2,0,0,1)" }}>
            <span style={{ width: "42px", height: "42px", borderRadius: "13px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12a8 8 0 1 0 3-6.2" />
                <path d="M4 4.5V9h4.5" />
              </svg>
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.4px", marginTop: "20px" }}>Route replay</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "10px", textWrap: "pretty" }}>Scrub any vehicle's last 90 days minute by minute when a client disputes a delay.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
