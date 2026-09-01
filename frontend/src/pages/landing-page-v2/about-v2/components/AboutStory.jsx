import oneRecord from '../assets/gnb-about-one-record.png';

export default function AboutStory() {
  return (
    <section data-screen-label="About story" style={{ background: "#FFFFFF", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: "80px", alignItems: "center" }}>
        <div data-reveal-group>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>Why we built it</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0", textWrap: "pretty" }}>
            The data was always there.{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>Nobody could reach it.</span>
          </h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "26px 0 0", textWrap: "pretty" }}>Every fleet we sat with had the same shape of problem. GPS in one portal, trips in a spreadsheet, e-way bills in a second login, ledgers with the accountant, PODs in a drawer. Month end was three people reconstructing a month from memory.</p>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "20px 0 0", textWrap: "pretty" }}>GNB Edge puts all of it on one record. A trip carries its vehicle, driver, expenses, compliance and invoice from the moment it is booked. That record is what makes the rest possible: nothing is re-typed, nothing is reconciled twice, and AI has something honest to learn from.</p>
          <div style={{ marginTop: "34px", paddingLeft: "22px", borderLeft: "2px solid var(--nova-rage-400)" }}>
            <div style={{ fontSize: "17px", lineHeight: "28px", color: "#050816", textWrap: "pretty" }}>We do not sell a dashboard. We replace the six systems underneath it.</div>
          </div>
        </div>
        <div data-reveal style={{ borderRadius: "var(--radius-xtra-soft)", overflow: "hidden", boxShadow: "var(--shadow-lg)", aspectRatio: "4/3" }}>
          <img src={oneRecord} alt="Six disconnected systems, replaced by one GNB Edge trip record" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      </div>
    </section>
  );
}
