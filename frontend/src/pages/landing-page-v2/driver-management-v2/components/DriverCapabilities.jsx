export default function DriverCapabilities() {
  return (
    <section data-screen-label="Driver capabilities" style={{ background: "#F4F5FA", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 data-reveal style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 56px", maxWidth: "760px", textWrap: "pretty" }}>
          What the driver module{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>actually does.</span>
        </h2>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.4" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Driver master</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>One record per driver with contact, bank, address and emergency details.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="11" r="2" />
                <path d="M13 10h5M13 14h5M5.5 16a3.4 3.4 0 0 1 6 0" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Licence and documents</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Licence, badge, medical and police verification with expiry alerts 30 days out.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Duty hours</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Hours counted against the trip, so rest violations surface before dispatch.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z" />
                <path d="M8 3v18" opacity=".55" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Advances and settlements</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Trip advances, expenses and balances in one running ledger per driver.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                <path d="M11 18.5h2" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Driver app</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>PODs, expenses and trip updates captured from the road, not re-typed later.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 18L9 8l5 6 6-10" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Performance</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Trips completed, on-time rate, fuel efficiency and incidents per driver.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
