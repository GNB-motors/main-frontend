export default function FuelVerification() {
  return (
    <section id="verification" data-screen-label="Fuel verification" style={{ background: "#F4F5FA", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "1fr .88fr", gap: "72px", alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>Fuel monitoring and theft detection</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1.08", letterSpacing: "-1.5px", margin: "0", textWrap: "pretty" }}>
              Theft shows up as a gap{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>between two independent records.</span>
            </h2>
          </div>
          <div>
            <p style={{ fontSize: "16.5px", lineHeight: "27px", color: "#5D5D5E", margin: "0 0 14px", textWrap: "pretty" }}>We enable complete fuel monitoring and theft detection through the app, web platform, and WhatsApp bot. For every trip, users can upload an odometer photo and fuel bill photo.</p>
            <p style={{ fontSize: "16.5px", lineHeight: "27px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>The system calculates each vehicle's actual mileage using the full-tank-to-full-tank method, then compares it against fuel consumption from vehicle hardware and telematics to flag unusual usage or potential theft.</p>
          </div>
        </div>

        <div data-reveal style={{ marginTop: "56px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", borderRadius: "24px", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", padding: "20px 34px", borderBottom: "1px solid rgba(5,8,22,.08)", background: "#FAFAFC" }}>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#050816" }}>One trip, measured twice</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>MH-46-C-8890 · Mumbai → Nagpur · 792 km · 12–18 Sep</span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#C4494C" }}>Fuel audit FA-2291</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr" }}>
            <div style={{ padding: "32px 34px 30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "20px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)" }}>01</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.4px" }}>What the paperwork says</span>
              </div>
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "22px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 11px", borderRadius: "999px", background: "rgba(68,105,240,.09)", color: "var(--nova-rage-600)" }}>driver app</span>
                <span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 11px", borderRadius: "999px", background: "rgba(68,105,240,.09)", color: "var(--nova-rage-600)" }}>web platform</span>
                <span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 11px", borderRadius: "999px", background: "rgba(68,105,240,.09)", color: "var(--nova-rage-600)" }}>WhatsApp bot</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ border: "1px solid rgba(5,8,22,.09)", borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ background: "#0F1428", padding: "15px 14px 13px" }}>
                    <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>Odometer photo</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "19px", letterSpacing: "1px", color: "#8FA6F5", marginTop: "9px" }}>184206</div>
                  </div>
                  <div style={{ padding: "11px 14px", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A" }}>18 Sep · 06:14 · verified</div>
                </div>
                <div style={{ border: "1px solid rgba(5,8,22,.09)", borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ background: "#F4F5FA", padding: "15px 14px 13px" }}>
                    <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>Fuel bill photo</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "19px", letterSpacing: ".5px", color: "#050816", marginTop: "9px" }}>198.0 L</div>
                  </div>
                  <div style={{ padding: "11px 14px", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A" }}>₹18,216 · 2 fills</div>
                </div>
              </div>
              <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid rgba(5,8,22,.09)", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Full tank → full tank</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px" }}>4.0 <span style={{ fontSize: "14px", fontWeight: "400", color: "#93939A", letterSpacing: "0" }}>km/l</span></span>
              </div>
            </div>

            <div style={{ background: "rgba(5,8,22,.08)" }} />

            <div style={{ padding: "32px 34px 30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "20px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)" }}>02</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "20px", letterSpacing: "-.4px" }}>What the vehicle reports</span>
              </div>
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "22px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 11px", borderRadius: "999px", background: "rgba(68,105,240,.09)", color: "var(--nova-rage-600)" }}>tank sensor</span>
                <span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 11px", borderRadius: "999px", background: "rgba(68,105,240,.09)", color: "var(--nova-rage-600)" }}>telematics</span>
                <span style={{ fontSize: "11.5px", fontWeight: "500", padding: "5px 11px", borderRadius: "999px", background: "rgba(68,105,240,.09)", color: "var(--nova-rage-600)" }}>GPS distance</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ border: "1px solid rgba(5,8,22,.09)", borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ background: "#F4F5FA", padding: "15px 14px 13px" }}>
                    <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>Fuel drawn</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "19px", letterSpacing: ".5px", color: "#050816", marginTop: "9px" }}>172.4 L</div>
                  </div>
                  <div style={{ padding: "11px 14px", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A" }}>30 s samples · ±2 %</div>
                </div>
                <div style={{ border: "1px solid rgba(5,8,22,.09)", borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ background: "#F4F5FA", padding: "15px 14px 13px" }}>
                    <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>GPS distance</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "19px", letterSpacing: ".5px", color: "#050816", marginTop: "9px" }}>792 km</div>
                  </div>
                  <div style={{ padding: "11px 14px", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A" }}>same trip window</div>
                </div>
              </div>
              <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid rgba(5,8,22,.09)", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px" }}>
                <span style={{ fontSize: "13.5px", color: "#5D5D5E" }}>Implied by hardware</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px" }}>4.6 <span style={{ fontSize: "14px", fontWeight: "400", color: "#93939A", letterSpacing: "0" }}>km/l</span></span>
              </div>
            </div>
          </div>

          <div style={{ padding: "30px 34px 34px", borderTop: "1px solid rgba(5,8,22,.08)", background: "#FCFCFD" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#050816" }}>Litres billed against litres burned</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>scale 0 – 198 L</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
              <span style={{ flex: "0 0 168px", fontSize: "13px", color: "#5D5D5E" }}>Billed on fuel slips</span>
              <span style={{ flex: "1", height: "38px", borderRadius: "10px", background: "rgba(68,105,240,.42)", display: "flex", alignItems: "center", padding: "0 14px", transformOrigin: "left", animation: "ai-bar 900ms cubic-bezier(.2,0,0,1) both .1s" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#FFFFFF" }}>198.0 L</span>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ flex: "0 0 168px", fontSize: "13px", color: "#5D5D5E" }}>Burned per tank sensor</span>
              <span style={{ flex: "1", display: "flex", gap: "5px", height: "38px" }}>
                <span style={{ flex: "0 0 87%", borderRadius: "10px", background: "rgba(68,105,240,.20)", display: "flex", alignItems: "center", padding: "0 14px", transformOrigin: "left", animation: "ai-bar 900ms cubic-bezier(.2,0,0,1) both .35s" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#213EA7" }}>172.4 L</span>
                </span>
                <span style={{ flex: "1", borderRadius: "10px", border: "1px solid rgba(229,104,107,.45)", background: "repeating-linear-gradient(135deg, rgba(229,104,107,.30) 0 5px, rgba(229,104,107,.10) 5px 10px)", animation: "ai-blip 2.6s ease-in-out infinite 1.4s" }} />
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginTop: "9px" }}>
              <span style={{ flex: "0 0 168px" }} />
              <span style={{ flex: "1", display: "flex" }}>
                <span style={{ flex: "0 0 87%" }} />
                <span style={{ flex: "1", paddingTop: "2px", borderTop: "1px solid rgba(229,104,107,.45)", textAlign: "center" }}>
                  <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#C4494C", marginTop: "5px" }}>the gap</span>
                </span>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap", marginTop: "24px", padding: "18px 22px", borderRadius: "16px", background: "rgba(229,104,107,.07)", border: "1px solid rgba(229,104,107,.24)" }}>
              <span style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", letterSpacing: "-1.1px", color: "#C4494C" }}>25.6 L</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#5D5D5E" }}>13 % · ₹2,340</span>
              </span>
              <span style={{ flex: "1", minWidth: "260px", fontSize: "15px", lineHeight: "24px", color: "#050816", textWrap: "pretty" }}>Bought and billed, never burned. Two records captured on separate rails, so neither one can be edited to agree with the other.</span>
              <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", borderRadius: "8px", padding: "10px 18px", whiteSpace: "nowrap" }}>Fuel audit raised</span>
            </div>
          </div>
        </div>

        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "28px", marginTop: "44px" }}>
          <div style={{ paddingTop: "18px", borderTop: "1px solid rgba(5,8,22,.12)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "9px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>01</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "18px", letterSpacing: "-.35px" }}>Capture</span>
            </div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>An odometer photo and a fuel bill photo are uploaded against the trip, from whichever surface the driver or owner is on.</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginTop: "12px" }}>app · web · WhatsApp bot</div>
          </div>
          <div style={{ paddingTop: "18px", borderTop: "1px solid rgba(5,8,22,.12)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "9px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>02</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "18px", letterSpacing: "-.35px" }}>Calculate</span>
            </div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>Actual mileage per vehicle is computed on the full-tank-to-full-tank method, not on a claimed figure.</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginTop: "12px" }}>full tank → full tank · 4.0 km/l</div>
          </div>
          <div style={{ paddingTop: "18px", borderTop: "1px solid rgba(5,8,22,.12)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "9px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>03</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "18px", letterSpacing: "-.35px" }}>Compare</span>
            </div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>That number is checked against fuel consumption from vehicle hardware and telematics, and other available data points.</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", marginTop: "12px" }}>telematics · 4.6 km/l</div>
          </div>
          <div style={{ paddingTop: "18px", borderTop: "2px solid var(--nova-blaze-400, #E5686B)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "9px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#C4494C" }}>04</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "18px", letterSpacing: "-.35px" }}>Flag</span>
            </div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>Unusual usage or potential theft is raised as a fuel audit against the trip, the vehicle and the driver.</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#C4494C", marginTop: "12px" }}>13 % gap · 25.6 L unaccounted</div>
          </div>
        </div>
      </div>
    </section>
  );
}
