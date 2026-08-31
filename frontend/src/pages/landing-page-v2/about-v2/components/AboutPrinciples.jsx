export default function AboutPrinciples() {
  return (
    <section data-screen-label="About principles" style={{ background: "#FFFFFF", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 data-reveal style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 56px", maxWidth: "760px", textWrap: "pretty" }}>
          Three things we will not{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>compromise on.</span>
        </h2>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h11v9H3z" />
                <path d="M14 10h4l3 3v3h-7z" />
                <circle cx="7" cy="18" r="1.6" />
                <circle cx="17" cy="18" r="1.6" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Built for the road, not the demo</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Patchy network, a driver with one hand free, a clerk with fifty consignments to close. If it does not work there, it does not ship.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>AI that shows its working</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Every insight names the trips, litres or hours behind it. No score you cannot open, no recommendation you cannot argue with.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
                <path d="M9.5 12l1.8 1.8 3.4-3.4" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Your data stays yours</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Residency, role-based access and a full audit trail are part of the product, not a paid add-on discovered during procurement.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
