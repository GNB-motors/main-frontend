export default function Capabilities() {
  return (
    <section id="capabilities" data-darkzone data-screen-label="Capabilities" style={{ position: "relative", background: "transparent", padding: "0 40px 132px", overflow: "hidden" }}>
      <div data-veil style={{ position: "absolute", inset: "0", background: "#0B0F20", opacity: "0", pointerEvents: "none", transition: "opacity 700ms cubic-bezier(.2,0,0,1)" }} />
      <div data-glow style={{ position: "absolute", top: "120px", left: "-8%", width: "56%", height: "520px", borderRadius: "999px", background: "radial-gradient(circle, rgba(68,105,240,.28), transparent 66%)", filter: "blur(20px)", opacity: ".3", transition: "opacity 700ms cubic-bezier(.2,0,0,1), transform 900ms cubic-bezier(.2,0,0,1)", pointerEvents: "none" }} />
      <div data-glow style={{ position: "absolute", top: "420px", right: "-10%", width: "52%", height: "560px", borderRadius: "999px", background: "radial-gradient(circle, rgba(99,102,241,.22), transparent 68%)", filter: "blur(20px)", opacity: ".3", transition: "opacity 700ms cubic-bezier(.2,0,0,1), transform 900ms cubic-bezier(.2,0,0,1)", pointerEvents: "none" }} />
      <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", paddingTop: "210px" }}>
        <div data-reveal style={{ maxWidth: "900px", margin: "0 auto 72px", textAlign: "center" }}>
          <div data-dk-pill style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px", borderRadius: "999px", background: "rgba(68,105,240,.16)", border: "1px solid rgba(129,150,255,.3)", marginBottom: "28px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#8FA6FF", boxShadow: "0 0 10px rgba(143,166,255,.9)", animation: "cap-blink 2.4s ease-in-out infinite" }} />
            <span data-dk-eyebrow style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(255,255,255,.78)" }}>Inside the platform</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "52px", lineHeight: "1.06", letterSpacing: "-1.9px", color: "#FFFFFF", margin: "0", textWrap: "pretty" }} data-dk-h>
            One platform.{' '}
            <span data-dk-accent style={{ color: "#8FA6FF" }}>Every fleet function.</span>
          </h2>
          <p data-dk-p style={{ fontSize: "18px", lineHeight: "30px", color: "rgba(255,255,255,.62)", margin: "26px auto 0", maxWidth: "720px", textWrap: "pretty" }}>From vehicle tracking and dispatch to ERP, finance, compliance and AI-powered intelligence — every fleet operation works from one connected data layer.</p>
        </div>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          <article data-card style={{ display: "flex", flexDirection: "column", height: "566px", borderRadius: "24px", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)", border: "1px solid rgba(129,150,255,.16)", overflow: "hidden", boxShadow: "0 18px 50px rgba(3,6,18,.45)", transition: "transform 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)" }}>
              <div style={{ position: "absolute", inset: "0", background: "radial-gradient(420px 240px at 50% 0%, rgba(68,105,240,.22), transparent 70%)" }} />
              <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "34px 34px", maskImage: "radial-gradient(circle at 50% 40%, #000, transparent 78%)" }} />
              <div style={{ position: "absolute", inset: "0" }}>
                <svg viewBox="0 0 390 290" preserveAspectRatio="none" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" }}>
                  <path d="M18 250 C90 210 120 130 210 120 C290 112 320 70 372 58" fill="none" stroke="rgba(110,139,255,.3)" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M14 120 C80 140 130 196 220 200 C300 204 340 236 380 244" fill="none" stroke="rgba(110,139,255,.22)" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M40 40 C110 60 150 118 208 160 C260 198 320 200 376 176" fill="none" stroke="rgba(110,139,255,.16)" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M18 250 C90 210 120 130 210 120 C290 112 320 70 372 58" fill="none" stroke="#7C97FF" strokeWidth="2" strokeLinecap="round" strokeDasharray="520" style={{ animation: "cap-draw 7s cubic-bezier(.2,0,0,1) infinite" }} />
                  <path d="M14 120 C80 140 130 196 220 200 C300 204 340 236 380 244" fill="none" stroke="#5C7BF5" strokeWidth="2" strokeLinecap="round" strokeDasharray="520" style={{ animation: "cap-draw 7s cubic-bezier(.2,0,0,1) infinite 1.2s" }} />
                  <circle cx="210" cy="120" r="46" fill="rgba(68,105,240,.07)" stroke="rgba(110,139,255,.34)" strokeWidth="1.2" strokeDasharray="4 6" />
                  <circle cx="210" cy="120" r="46" fill="none" stroke="rgba(110,139,255,.5)" strokeWidth="1.2" style={{ animation: "cap-geo 3.6s ease-out infinite", transformOrigin: "210px 120px" }} />
                  <circle cx="210" cy="120" r="5" fill="#7C97FF" />
                </svg>
                <div style={{ position: "absolute", inset: "0" }}>
                  <span style={{ position: "absolute", left: "0", top: "0", width: "9px", height: "9px", margin: "-4.5px 0 0 -4.5px", borderRadius: "999px", background: "#8FA6FF", boxShadow: "0 0 14px #8FA6FF", offsetPath: "path('M18 250 C90 210 120 130 210 120 C290 112 320 70 372 58')", offsetRotate: "0deg", animation: "cap-run 7s linear infinite 0s" }} />
                  <span style={{ position: "absolute", left: "0", top: "0", width: "9px", height: "9px", margin: "-4.5px 0 0 -4.5px", borderRadius: "999px", background: "#6E8BFF", boxShadow: "0 0 14px #6E8BFF", offsetPath: "path('M14 120 C80 140 130 196 220 200 C300 204 340 236 380 244')", offsetRotate: "0deg", animation: "cap-run 8.5s linear infinite 1.1s" }} />
                  <span style={{ position: "absolute", left: "0", top: "0", width: "9px", height: "9px", margin: "-4.5px 0 0 -4.5px", borderRadius: "999px", background: "rgba(255,255,255,.75)", boxShadow: "0 0 14px rgba(255,255,255,.75)", offsetPath: "path('M40 40 C110 60 150 118 208 160 C260 198 320 200 376 176')", offsetRotate: "0deg", animation: "cap-run 9.5s linear infinite 2.2s" }} />
                </div>
                <div style={{ position: "absolute", top: "26px", left: "24px", display: "flex", alignItems: "center", gap: "9px", padding: "9px 13px", borderRadius: "12px", background: "rgba(19,25,50,.82)", border: "1px solid rgba(129,150,255,.24)", backdropFilter: "blur(8px)", animation: "cap-float 5.4s ease-in-out infinite 0s" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#6E8BFF", boxShadow: "0 0 10px rgba(110,139,255,.9)" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.86)", whiteSpace: "nowrap" }}>MH-12-AB-4471</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.42)", whiteSpace: "nowrap" }}>62 km/h</span>
                </div>
                <div style={{ position: "absolute", top: "120px", right: "22px", display: "flex", alignItems: "center", gap: "9px", padding: "9px 13px", borderRadius: "12px", background: "rgba(19,25,50,.82)", border: "1px solid rgba(129,150,255,.24)", backdropFilter: "blur(8px)", animation: "cap-float 5.4s ease-in-out infinite 1.4s" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#6E8BFF", boxShadow: "0 0 10px rgba(110,139,255,.9)" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.86)", whiteSpace: "nowrap" }}>Geofence · Bhiwandi</span>
                </div>
                <div style={{ position: "absolute", bottom: "26px", left: "24px", display: "flex", alignItems: "center", gap: "9px", padding: "9px 13px", borderRadius: "12px", background: "rgba(46,20,26,.72)", border: "1px solid rgba(229,104,107,.34)", backdropFilter: "blur(8px)", animation: "cap-float 5.4s ease-in-out infinite 2.6s" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#E5686B", boxShadow: "0 0 10px rgba(229,104,107,.9)", animation: "cap-blink 1.8s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.86)", whiteSpace: "nowrap" }}>Halt detected · 47 min</span>
                </div>
                <div style={{ position: "absolute", bottom: "26px", right: "24px", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.34)" }}>1,240 vehicles live</div>
              </div>
            </div>
            <div data-card-body style={{ minHeight: "176px", boxSizing: "border-box", padding: "26px 28px 30px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <div data-card-title style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#FFFFFF" }}>Vehicle tracking</div>
              <div data-card-desc style={{ fontSize: "14.5px", lineHeight: "23px", color: "rgba(255,255,255,.6)", marginTop: "10px", textWrap: "pretty" }}>Real-time GPS, geofences, halt detection and live fleet visibility from one intelligent map.</div>
            </div>
          </article>
          <article data-card style={{ display: "flex", flexDirection: "column", height: "566px", borderRadius: "24px", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)", border: "1px solid rgba(129,150,255,.16)", overflow: "hidden", boxShadow: "0 18px 50px rgba(3,6,18,.45)", transition: "transform 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)" }}>
              <div style={{ position: "absolute", inset: "0", background: "radial-gradient(420px 240px at 50% 0%, rgba(68,105,240,.22), transparent 70%)" }} />
              <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "34px 34px", maskImage: "radial-gradient(circle at 50% 40%, #000, transparent 78%)" }} />
              <div style={{ position: "absolute", inset: "0", padding: "30px 26px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "11px" }}>
                <div style={{ position: "absolute", left: "43px", top: "56px", bottom: "56px", width: "1px", background: "linear-gradient(180deg, rgba(129,150,255,.05), rgba(129,150,255,.42), rgba(129,150,255,.05))" }} />
                <div style={{ position: "absolute", left: "40px", top: "56px", width: "7px", height: "7px", borderRadius: "999px", background: "#8FA6FF", boxShadow: "0 0 12px rgba(143,166,255,.9)", animation: "cap-spine 4.6s cubic-bezier(.2,0,0,1) infinite" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ position: "relative", flex: "0 0 auto", width: "34px", height: "34px", borderRadius: "11px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,.5)" }}>1</span>
                  <span style={{ flex: "1", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", padding: "12px 15px", borderRadius: "12px", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,.8)" }}>Trip created</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.4)", whiteSpace: "nowrap" }}>GNB/2026/04817</span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ position: "relative", flex: "0 0 auto", width: "34px", height: "34px", borderRadius: "11px", background: "linear-gradient(150deg,#4469F0,#2B3FA8)", border: "1px solid rgba(146,168,255,.6)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#FFFFFF" }}>
                    2
                    <span style={{ position: "absolute", inset: "-6px", borderRadius: "16px", border: "1px solid rgba(124,151,255,.5)", animation: "cap-ring 2.8s ease-out infinite" }} />
                  </span>
                  <span style={{ flex: "1", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", padding: "12px 15px", borderRadius: "12px", background: "rgba(68,105,240,.16)", border: "1px solid rgba(129,150,255,.34)" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#FFFFFF" }}>AI assignment</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.4)", whiteSpace: "nowrap" }}>scoring 6 vehicles</span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ position: "relative", flex: "0 0 auto", width: "34px", height: "34px", borderRadius: "11px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,.5)" }}>3</span>
                  <span style={{ flex: "1", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", padding: "12px 15px", borderRadius: "12px", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,.8)" }}>Vehicle matched</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.4)", whiteSpace: "nowrap" }}>MH-40-BX-2291</span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ position: "relative", flex: "0 0 auto", width: "34px", height: "34px", borderRadius: "11px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,.5)" }}>4</span>
                  <span style={{ flex: "1", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", padding: "12px 15px", borderRadius: "12px", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,.8)" }}>Driver assigned</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.4)", whiteSpace: "nowrap" }}>R. Kumar · 4.8</span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ position: "relative", flex: "0 0 auto", width: "34px", height: "34px", borderRadius: "11px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,.5)" }}>5</span>
                  <span style={{ flex: "1", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", padding: "12px 15px", borderRadius: "12px", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,.8)" }}>Active trip</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.4)", whiteSpace: "nowrap" }}>Mumbai → Nagpur</span>
                  </span>
                </div>
              </div>
            </div>
            <div data-card-body style={{ minHeight: "176px", boxSizing: "border-box", padding: "26px 28px 30px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <div data-card-title style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#FFFFFF" }}>Trip and dispatch</div>
              <div data-card-desc style={{ fontSize: "14.5px", lineHeight: "23px", color: "rgba(255,255,255,.6)", marginTop: "10px", textWrap: "pretty" }}>Plan, assign, track and close trips with intelligent dispatch and real-time operational visibility.</div>
            </div>
          </article>
          <article data-card style={{ display: "flex", flexDirection: "column", height: "566px", borderRadius: "24px", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)", border: "1px solid rgba(129,150,255,.16)", overflow: "hidden", boxShadow: "0 18px 50px rgba(3,6,18,.45)", transition: "transform 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)" }}>
              <div style={{ position: "absolute", inset: "0", background: "radial-gradient(420px 240px at 50% 0%, rgba(68,105,240,.22), transparent 70%)" }} />
              <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "34px 34px", maskImage: "radial-gradient(circle at 50% 40%, #000, transparent 78%)" }} />
              <div style={{ position: "absolute", inset: "0" }}>
                <div style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)", width: "78%", height: "62%", borderRadius: "999px", background: "radial-gradient(circle, rgba(68,105,240,.26), transparent 68%)", animation: "cap-glow 4.6s ease-in-out infinite" }} />
                <div style={{ position: "absolute", top: "34px", left: "16px", right: "40px", height: "46px", borderRadius: "12px", background: "linear-gradient(120deg, rgba(68,105,240,0.2), rgba(255,255,255,.03))", border: "1px solid rgba(129,150,255,0.3)", transform: "perspective(700px) rotateX(24deg)", transformOrigin: "center top", display: "flex", alignItems: "center", padding: "0 16px", animation: "cap-plane 6.4s ease-in-out infinite 0.0s" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Consignments</span>
                </div>
                <div style={{ position: "absolute", top: "90px", left: "24px", right: "32px", height: "46px", borderRadius: "12px", background: "linear-gradient(120deg, rgba(68,105,240,0.17), rgba(255,255,255,.03))", border: "1px solid rgba(129,150,255,0.25)", transform: "perspective(700px) rotateX(24deg)", transformOrigin: "center top", display: "flex", alignItems: "center", padding: "0 16px", animation: "cap-plane 6.4s ease-in-out infinite 0.4s" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Inventory</span>
                </div>
                <div style={{ position: "absolute", top: "146px", left: "32px", right: "24px", height: "46px", borderRadius: "12px", background: "linear-gradient(120deg, rgba(68,105,240,0.14), rgba(255,255,255,.03))", border: "1px solid rgba(129,150,255,0.19999999999999998)", transform: "perspective(700px) rotateX(24deg)", transformOrigin: "center top", display: "flex", alignItems: "center", padding: "0 16px", animation: "cap-plane 6.4s ease-in-out infinite 0.8s" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Procurement</span>
                </div>
                <div style={{ position: "absolute", top: "202px", left: "40px", right: "16px", height: "46px", borderRadius: "12px", background: "linear-gradient(120deg, rgba(68,105,240,0.11000000000000001), rgba(255,255,255,.03))", border: "1px solid rgba(129,150,255,0.14999999999999997)", transform: "perspective(700px) rotateX(24deg)", transformOrigin: "center top", display: "flex", alignItems: "center", padding: "0 16px", animation: "cap-plane 6.4s ease-in-out infinite 1.2s" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Branch operations</span>
                </div>
                <div style={{ position: "absolute", left: "14px", right: "14px", bottom: "26px", height: "52px", borderRadius: "14px", background: "linear-gradient(150deg, rgba(47,88,238,.4), rgba(27,44,116,.5))", border: "1px solid rgba(146,168,255,.42)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", boxShadow: "0 14px 34px rgba(47,88,238,.28)" }}>
                  <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#FFFFFF" }}>Shared system of record</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.6)" }}>one entry</span>
                </div>
                <div style={{ position: "absolute", left: "50%", top: "34px", width: "3px", height: "34px", marginLeft: "-1.5px", borderRadius: "999px", background: "linear-gradient(180deg, transparent, #9FB4FF)", boxShadow: "0 0 14px rgba(159,180,255,.8)", animation: "cap-drop 3.4s cubic-bezier(.2,0,0,1) infinite" }} />
              </div>
            </div>
            <div data-card-body style={{ minHeight: "176px", boxSizing: "border-box", padding: "26px 28px 30px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <div data-card-title style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#FFFFFF" }}>ERP</div>
              <div data-card-desc style={{ fontSize: "14.5px", lineHeight: "23px", color: "rgba(255,255,255,.6)", marginTop: "10px", textWrap: "pretty" }}>Manage consignments, inventory, procurement and branch operations on one connected system of record.</div>
            </div>
          </article>
          <article data-card style={{ display: "flex", flexDirection: "column", height: "566px", borderRadius: "24px", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)", border: "1px solid rgba(129,150,255,.16)", overflow: "hidden", boxShadow: "0 18px 50px rgba(3,6,18,.45)", transition: "transform 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)" }}>
              <div style={{ position: "absolute", inset: "0", background: "radial-gradient(420px 240px at 50% 0%, rgba(68,105,240,.22), transparent 70%)" }} />
              <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "34px 34px", maskImage: "radial-gradient(circle at 50% 40%, #000, transparent 78%)" }} />
              <div style={{ position: "absolute", inset: "0", padding: "28px 26px", display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: "1", padding: "16px 18px", borderRadius: "14px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                    <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.45)" }}>Revenue</div>
                    <div data-fin="Revenue" style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", color: "#FFFFFF", marginTop: "9px" }}>₹48.2L</div>
                  </div>
                  <div style={{ flex: "1", padding: "16px 18px", borderRadius: "14px", background: "rgba(68,105,240,.14)", border: "1px solid rgba(129,150,255,.28)" }}>
                    <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.55)" }}>Profitability</div>
                    <div data-fin="Profit" style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", letterSpacing: "-.9px", color: "#9FB4FF", marginTop: "9px" }}>12.4%</div>
                  </div>
                </div>
                <div style={{ position: "relative", height: "96px" }}>
                  <svg viewBox="0 0 330 96" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                    <defs>
                      <linearGradient id="capFin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="rgba(110,139,255,.42)" />
                        <stop offset="1" stopColor="rgba(110,139,255,0)" />
                      </linearGradient>
                    </defs>
                    <path d="M0 78 L34 70 L68 74 L102 58 L136 62 L170 44 L204 50 L238 34 L272 30 L306 20 L330 14 L330 96 L0 96 Z" fill="url(#capFin)" style={{ animation: "cap-fade 1.4s cubic-bezier(.2,0,0,1) both .5s" }} />
                    <path d="M0 78 L34 70 L68 74 L102 58 L136 62 L170 44 L204 50 L238 34 L272 30 L306 20 L330 14" fill="none" stroke="#8FA6FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="420" style={{ animation: "cap-draw 7s cubic-bezier(.2,0,0,1) infinite" }} />
                  </svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ flex: "0 0 84px", fontSize: "12px", color: "rgba(255,255,255,.55)" }}>Expenses</span>
                    <span style={{ flex: "1", height: "5px", borderRadius: "999px", background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: "78%", borderRadius: "999px", background: "rgba(255,255,255,.42)", transformOrigin: "left", animation: "cap-bar 1.2s cubic-bezier(.2,0,0,1) both 0.30s" }} />
                    </span>
                    <span data-fin="Expenses" style={{ flex: "0 0 auto", fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "rgba(255,255,255,.8)" }}>₹42.3L</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ flex: "0 0 84px", fontSize: "12px", color: "rgba(255,255,255,.55)" }}>GST</span>
                    <span style={{ flex: "1", height: "5px", borderRadius: "999px", background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: "34%", borderRadius: "999px", background: "rgba(110,139,255,.75)", transformOrigin: "left", animation: "cap-bar 1.2s cubic-bezier(.2,0,0,1) both 0.45s" }} />
                    </span>
                    <span data-fin="GST" style={{ flex: "0 0 auto", fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "rgba(255,255,255,.8)" }}>₹3.1L</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ flex: "0 0 84px", fontSize: "12px", color: "rgba(255,255,255,.55)" }}>Outstanding</span>
                    <span style={{ flex: "1", height: "5px", borderRadius: "999px", background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: "52%", borderRadius: "999px", background: "rgba(229,104,107,.7)", transformOrigin: "left", animation: "cap-bar 1.2s cubic-bezier(.2,0,0,1) both 0.60s" }} />
                    </span>
                    <span data-fin="Outstanding" style={{ flex: "0 0 auto", fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "rgba(255,255,255,.8)" }}>₹8.7L</span>
                  </div>
                </div>
              </div>
            </div>
            <div data-card-body style={{ minHeight: "176px", boxSizing: "border-box", padding: "26px 28px 30px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <div data-card-title style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#FFFFFF" }}>Finance and ledger</div>
              <div data-card-desc style={{ fontSize: "14.5px", lineHeight: "23px", color: "rgba(255,255,255,.6)", marginTop: "10px", textWrap: "pretty" }}>Track fleet finances, expenses, GST and ledger activity with complete operational visibility.</div>
            </div>
          </article>
          <article data-card style={{ display: "flex", flexDirection: "column", height: "566px", borderRadius: "24px", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)", border: "1px solid rgba(129,150,255,.16)", overflow: "hidden", boxShadow: "0 18px 50px rgba(3,6,18,.45)", transition: "transform 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)" }}>
              <div style={{ position: "absolute", inset: "0", background: "radial-gradient(420px 240px at 50% 0%, rgba(68,105,240,.22), transparent 70%)" }} />
              <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "34px 34px", maskImage: "radial-gradient(circle at 50% 40%, #000, transparent 78%)" }} />
              <div style={{ position: "absolute", inset: "0" }}>
                <div style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", width: "70%", height: "58%", borderRadius: "999px", background: "radial-gradient(circle, rgba(68,105,240,.24), transparent 68%)", animation: "cap-glow 5s ease-in-out infinite" }} />
                <div style={{ position: "absolute", left: "50%", top: "36px", transform: "translateX(-50%)", width: "172px", height: "212px", borderRadius: "14px", background: "linear-gradient(180deg, rgba(24,32,66,.92), rgba(16,21,44,.92))", border: "1px solid rgba(129,150,255,.3)", boxShadow: "0 20px 46px rgba(3,6,18,.5)", overflow: "hidden", animation: "cap-float 6.2s ease-in-out infinite" }}>
                  <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "9px" }}>
                    <span style={{ display: "block", height: "8px", width: "52%", borderRadius: "999px", background: "rgba(159,180,255,.75)" }} />
                    <span style={{ display: "block", height: "1px", width: "100%", background: "rgba(255,255,255,.1)", margin: "4px 0" }} />
                    <span style={{ display: "block", height: "6px", width: "92%", borderRadius: "999px", background: "rgba(255,255,255,0.18)" }} />
                    <span style={{ display: "block", height: "6px", width: "78%", borderRadius: "999px", background: "rgba(255,255,255,0.14)" }} />
                    <span style={{ display: "block", height: "6px", width: "88%", borderRadius: "999px", background: "rgba(255,255,255,0.14)" }} />
                    <span style={{ display: "block", height: "6px", width: "64%", borderRadius: "999px", background: "rgba(255,255,255,0.1)" }} />
                    <span style={{ display: "block", height: "6px", width: "84%", borderRadius: "999px", background: "rgba(255,255,255,0.12)" }} />
                    <span style={{ display: "block", height: "6px", width: "48%", borderRadius: "999px", background: "rgba(255,255,255,0.1)" }} />
                  </div>
                  <div style={{ position: "absolute", left: "0", right: "0", height: "56px", background: "linear-gradient(180deg, transparent, rgba(110,139,255,.3), transparent)", animation: "cap-scan 4.4s cubic-bezier(.2,0,0,1) infinite" }} />
                  <div style={{ position: "absolute", right: "14px", bottom: "14px", width: "44px", height: "44px", borderRadius: "999px", background: "rgba(24,122,50,.22)", border: "1px solid rgba(96,196,128,.55)", display: "grid", placeItems: "center", animation: "cap-stamp 4.4s cubic-bezier(.2,0,0,1) infinite" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6FCF97" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                </div>
                <div style={{ position: "absolute", left: "24px", right: "24px", bottom: "26px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 12px", borderRadius: "999px", background: "rgba(24,122,50,.2)", border: "1px solid rgba(96,196,128,.45)", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6FCF97", whiteSpace: "nowrap", animation: "cap-insight 7.8s cubic-bezier(.2,0,0,1) infinite 0s" }}>GST return · filed</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 12px", borderRadius: "999px", background: "rgba(24,122,50,.2)", border: "1px solid rgba(96,196,128,.45)", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6FCF97", whiteSpace: "nowrap", animation: "cap-insight 7.8s cubic-bezier(.2,0,0,1) infinite 2.6s" }}>E-way bill · verified</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 12px", borderRadius: "999px", background: "rgba(229,104,107,.16)", border: "1px solid rgba(229,104,107,.4)", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#E5868A", whiteSpace: "nowrap", animation: "cap-insight 7.8s cubic-bezier(.2,0,0,1) infinite 5.2s" }}>Permit · expires in 9 days</span>
                </div>
              </div>
            </div>
            <div data-card-body style={{ minHeight: "176px", boxSizing: "border-box", padding: "26px 28px 30px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <div data-card-title style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#FFFFFF" }}>Compliance and documents</div>
              <div data-card-desc style={{ fontSize: "14.5px", lineHeight: "23px", color: "rgba(255,255,255,.6)", marginTop: "10px", textWrap: "pretty" }}>Keep fleet documents and compliance requirements organised and proactively monitored.</div>
            </div>
          </article>
          <article data-card style={{ display: "flex", flexDirection: "column", height: "566px", borderRadius: "24px", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)", border: "1px solid rgba(129,150,255,.16)", overflow: "hidden", boxShadow: "0 18px 50px rgba(3,6,18,.45)", transition: "transform 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "linear-gradient(180deg, #182042 0%, #10152C 100%)" }}>
              <div style={{ position: "absolute", inset: "0", background: "radial-gradient(420px 240px at 50% 0%, rgba(68,105,240,.22), transparent 70%)" }} />
              <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "34px 34px", maskImage: "radial-gradient(circle at 50% 40%, #000, transparent 78%)" }} />
              <div style={{ position: "absolute", inset: "0" }}>
                <svg viewBox="0 0 390 290" preserveAspectRatio="none" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" }}>
                  <path d="M70 40 C130 70 150 88 186 104" fill="none" stroke="rgba(129,150,255,.2)" strokeWidth="1.2" />
                  <path d="M70 40 C130 70 150 88 186 104" fill="none" stroke="#8FA6FF" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 165" style={{ animation: "cap-flow 2.8s linear infinite 0.00s" }} />
                  <path d="M70 112 C130 118 150 116 186 114" fill="none" stroke="rgba(129,150,255,.2)" strokeWidth="1.2" />
                  <path d="M70 112 C130 118 150 116 186 114" fill="none" stroke="#8FA6FF" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 165" style={{ animation: "cap-flow 2.8s linear infinite 0.34s" }} />
                  <path d="M70 184 C130 160 150 140 186 126" fill="none" stroke="rgba(129,150,255,.2)" strokeWidth="1.2" />
                  <path d="M70 184 C130 160 150 140 186 126" fill="none" stroke="#8FA6FF" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 165" style={{ animation: "cap-flow 2.8s linear infinite 0.68s" }} />
                  <path d="M320 40 C260 70 240 88 204 104" fill="none" stroke="rgba(129,150,255,.2)" strokeWidth="1.2" />
                  <path d="M320 40 C260 70 240 88 204 104" fill="none" stroke="#8FA6FF" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 165" style={{ animation: "cap-flow 2.8s linear infinite 1.02s" }} />
                  <path d="M320 112 C260 118 240 116 204 114" fill="none" stroke="rgba(129,150,255,.2)" strokeWidth="1.2" />
                  <path d="M320 112 C260 118 240 116 204 114" fill="none" stroke="#8FA6FF" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 165" style={{ animation: "cap-flow 2.8s linear infinite 1.36s" }} />
                  <path d="M320 184 C260 160 240 140 204 126" fill="none" stroke="rgba(129,150,255,.2)" strokeWidth="1.2" />
                  <path d="M320 184 C260 160 240 140 204 126" fill="none" stroke="#8FA6FF" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 165" style={{ animation: "cap-flow 2.8s linear infinite 1.70s" }} />
                </svg>
                <div style={{ position: "absolute", left: "50%", top: "112px", transform: "translate(-50%,-50%)", width: "104px", height: "104px", display: "grid", placeItems: "center" }}>
                  <span style={{ position: "absolute", inset: "-18px", borderRadius: "999px", background: "radial-gradient(circle, rgba(68,105,240,.42), transparent 68%)", animation: "cap-glow 3.8s ease-in-out infinite" }} />
                  <span style={{ position: "absolute", inset: "0", borderRadius: "999px", border: "1px solid rgba(143,166,255,.42)", animation: "cap-ring 3.2s ease-out infinite" }} />
                  <span style={{ position: "absolute", inset: "0", borderRadius: "999px", border: "1px solid rgba(143,166,255,.3)", animation: "cap-ring 3.2s ease-out infinite 1.6s" }} />
                  <span style={{ position: "relative", width: "62px", height: "62px", borderRadius: "20px", background: "linear-gradient(150deg,#4469F0,#1B2C74)", border: "1px solid rgba(158,178,255,.55)", display: "grid", placeItems: "center", boxShadow: "0 12px 34px rgba(68,105,240,.5)" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                      <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
                    </svg>
                  </span>
                </div>
                <div style={{ position: "absolute", top: "30px", left: "22px", padding: "7px 12px", borderRadius: "999px", background: "rgba(19,25,50,.85)", border: "1px solid rgba(129,150,255,.22)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.72)", whiteSpace: "nowrap", animation: "cap-float 6.4s ease-in-out infinite 0s" }}>Vehicles</div>
                <div style={{ position: "absolute", top: "102px", left: "22px", padding: "7px 12px", borderRadius: "999px", background: "rgba(19,25,50,.85)", border: "1px solid rgba(129,150,255,.22)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.72)", whiteSpace: "nowrap", animation: "cap-float 6.4s ease-in-out infinite 0.8s" }}>Trips</div>
                <div style={{ position: "absolute", top: "174px", left: "22px", padding: "7px 12px", borderRadius: "999px", background: "rgba(19,25,50,.85)", border: "1px solid rgba(129,150,255,.22)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.72)", whiteSpace: "nowrap", animation: "cap-float 6.4s ease-in-out infinite 1.6s" }}>Drivers</div>
                <div style={{ position: "absolute", top: "30px", right: "22px", padding: "7px 12px", borderRadius: "999px", background: "rgba(19,25,50,.85)", border: "1px solid rgba(129,150,255,.22)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.72)", whiteSpace: "nowrap", animation: "cap-float 6.4s ease-in-out infinite 0.4s" }}>Fuel</div>
                <div style={{ position: "absolute", top: "102px", right: "22px", padding: "7px 12px", borderRadius: "999px", background: "rgba(19,25,50,.85)", border: "1px solid rgba(129,150,255,.22)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.72)", whiteSpace: "nowrap", animation: "cap-float 6.4s ease-in-out infinite 1.2s" }}>Finance</div>
                <div style={{ position: "absolute", top: "174px", right: "22px", padding: "7px 12px", borderRadius: "999px", background: "rgba(19,25,50,.85)", border: "1px solid rgba(129,150,255,.22)", fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "rgba(255,255,255,.72)", whiteSpace: "nowrap", animation: "cap-float 6.4s ease-in-out infinite 2s" }}>ERP</div>
                <div style={{ position: "absolute", left: "24px", right: "24px", bottom: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 14px", borderRadius: "11px", background: "rgba(68,105,240,.14)", border: "1px solid rgba(129,150,255,.26)", animation: "cap-insight 7.8s cubic-bezier(.2,0,0,1) infinite 0s" }}>
                    <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,.9)" }}>Underutilised vehicles detected</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#9FB4FF" }}>3 depots</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 14px", borderRadius: "11px", background: "rgba(68,105,240,.14)", border: "1px solid rgba(129,150,255,.26)", animation: "cap-insight 7.8s cubic-bezier(.2,0,0,1) infinite 2.6s" }}>
                    <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,.9)" }}>Fuel cost per km rising</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#9FB4FF" }}>+4.6%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 14px", borderRadius: "11px", background: "rgba(68,105,240,.14)", border: "1px solid rgba(129,150,255,.26)", animation: "cap-insight 7.8s cubic-bezier(.2,0,0,1) infinite 5.2s" }}>
                    <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,.9)" }}>Revenue opportunity identified</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#9FB4FF" }}>₹2.4Cr</span>
                  </div>
                </div>
              </div>
            </div>
            <div data-card-body style={{ minHeight: "176px", boxSizing: "border-box", padding: "26px 28px 30px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <div data-card-title style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#FFFFFF" }}>AI fleet intelligence</div>
              <div data-card-desc style={{ fontSize: "14.5px", lineHeight: "23px", color: "rgba(255,255,255,.6)", marginTop: "10px", textWrap: "pretty" }}>Turn fleet data into actionable insights, recommendations and opportunities to improve your business.</div>
            </div>
          </article>
        </div>
        <div data-reveal style={{ marginTop: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
          <div data-dk-mono style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "rgba(255,255,255,.4)" }}>Vehicles → operations → ERP → finance → compliance → shared data → AI intelligence</div>
          <a href="#demo" data-dk-link style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#9FB4FF" }}>Browse the full module catalogue →</a>
        </div>
      </div>
    </section>
  );
}
