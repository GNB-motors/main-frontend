export default function CustomerProof() {
  return (
    <section data-screen-label="Customer proof" style={{ background: "#F4F5FA", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 data-reveal style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 56px", maxWidth: "760px", textWrap: "pretty" }}>
          What your programme team{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>will ask about first.</span>
        </h2>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.2l5.4-.8z" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Personalized to your operation</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Fields, roles, approval rules, rate logic and reports configured with your team, per entity.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h3M8 11h3M13 7h3M13 11h3M9 21v-5h6v5" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Phased rollout</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>One module or one region at a time, running in parallel with the system it replaces.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <path d="M9 8h6M9 12h6M9 16h3" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Multi-entity and multi-GSTIN</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>Separate books and filings per entity, consolidated reporting across the group.</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)", borderRadius: "var(--radius-xl)", padding: "30px 28px 32px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", marginBottom: "22px" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4.5" y="10" width="15" height="10" rx="2" />
                <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px" }}>Security and residency</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", marginTop: "12px" }}>SSO, role-based access, full audit trail and data residency, reviewed before signature.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
