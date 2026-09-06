export default function CustomerProof() {
  return (
    <section data-screen-label="Customer proof" style={{ background: "#F4F5FA", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 data-reveal style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 56px", maxWidth: "760px", textWrap: "pretty" }}>
          What changes{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>in the first week.</span>
        </h2>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z" />
                <path d="M8 3v18" opacity=".55" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>No more paper register</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Trips, advances and expenses live on the phone instead of a notebook in the cabin.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <path d="M9 8h6M9 12h6M9 16h3" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Compliance handled</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>E-way bills and GST-ready invoices generate from the trip, so nothing is filed late.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Paid faster</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>PODs reach the client the moment the load is delivered, and the invoice follows the same day.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
