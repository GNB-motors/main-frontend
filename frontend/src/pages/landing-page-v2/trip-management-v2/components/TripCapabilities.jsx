const ITEMS = [
  {
    n: "01",
    title: "Booking and consignment",
    desc: "Client, route, load and rate captured once, carried through every downstream document.",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 4v16M4 10h16" />
      </>
    ),
  },
  {
    n: "02",
    title: "Vehicle and driver assignment",
    desc: "Assign from live availability, with expired documents blocked at source.",
    icon: (
      <>
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <path d="M8.5 18h5a4 4 0 0 0 4-4V8.5" />
      </>
    ),
  },
  {
    n: "03",
    title: "Trip costing",
    desc: "Freight, fuel, tolls, advances and detention costed against the booked rate.",
    icon: <path d="M12 3v18M7 7h8a3 3 0 0 1 0 6H7M7 17h10" />,
  },
  {
    n: "04",
    title: "Documents on the trip",
    desc: "LR, e-way bill and invoice generated from the trip, never re-keyed.",
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
  },
  {
    n: "05",
    title: "Market vehicles",
    desc: "Hired vehicles and broker loads costed alongside your own fleet.",
    icon: (
      <>
        <path d="M4 7h13l3 4v6H4z" />
        <circle cx="8" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </>
    ),
  },
  {
    n: "06",
    title: "Route profitability",
    desc: "Margin per trip, route, client and vehicle, refreshed as trips close.",
    icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />,
  },
];

export default function TripCapabilities() {
  return (
    <section data-screen-label="Trip capabilities" style={{ background: "#FFFFFF", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div data-reveal style={{ display: "grid", gridTemplateColumns: "1fr .78fr", gap: "64px", alignItems: "end", marginBottom: "52px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0", textWrap: "pretty" }}>
            What the trip module <span style={{ color: "var(--nova-rage-400)" }}>actually does.</span>
          </h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>Six jobs on one record, in the order a consignment moves through them.</p>
        </div>

        <div data-reveal-group style={{ borderTop: "1px solid rgba(5,8,22,.10)" }}>
          {ITEMS.map((item) => (
            <div
              key={item.n}
              style={{ display: "grid", gridTemplateColumns: "96px 1fr 1.2fr", gap: "32px", alignItems: "start", padding: "32px 20px 34px 8px", borderBottom: "1px solid rgba(5,8,22,.08)", borderRadius: "14px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#C0C0C8" }}>{item.n}</span>
                <span style={{ width: "40px", height: "40px", borderRadius: "999px", background: "rgba(68,105,240,.09)", display: "grid", placeItems: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "23px", lineHeight: "1.22", letterSpacing: "-.6px", paddingTop: "2px", textWrap: "pretty" }}>{item.title}</div>
              <div style={{ fontSize: "16px", lineHeight: "26px", color: "#5D5D5E", paddingTop: "4px", textWrap: "pretty" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
