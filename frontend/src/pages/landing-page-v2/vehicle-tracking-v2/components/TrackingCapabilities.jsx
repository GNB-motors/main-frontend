export default function TrackingCapabilities() {
  return (
    <section data-screen-label="Tracking capabilities" style={{ background: "#F4F5FA", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 data-reveal style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 56px", maxWidth: "760px", textWrap: "pretty" }}>
          What the tracking module{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>actually does.</span>
        </h2>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
                <path d="M9 3v15M15 6v15" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Live fleet map</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Every vehicle on one canvas, filtered by depot, route, client or status.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8.5" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Geofences</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Draw a depot, warehouse or client site once and get entry and exit events forever.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Halt detection</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Unplanned stops flagged with duration and location, before the client calls.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 18L9 8l5 6 6-10" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Planned vs actual</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Compare the route you costed against the route the truck drove, per trip.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 11V7a3 3 0 0 1 3-3h1M19 13v4a3 3 0 0 1-3 3h-1" />
                <rect x="3" y="10" width="8" height="6" rx="1.5" />
                <rect x="13" y="8" width="8" height="6" rx="1.5" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Fuel and mileage</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Sensor readings against distance travelled, so variance surfaces on its own.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6z" />
                <path d="M10.5 19a2 2 0 0 0 3 0" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Alerts and escalation</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Overspeed, route deviation and long-halt alerts routed to the right person.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
