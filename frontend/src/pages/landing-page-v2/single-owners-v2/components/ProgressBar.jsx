export default function ProgressBar() {
  return (
    <div style={{ position: "fixed", top: "0", left: "0", right: "0", height: "3px", zIndex: "95", background: "transparent", pointerEvents: "none" }}>
      <div data-progress style={{ height: "100%", width: "0%", background: "linear-gradient(90deg, #4469F0, #213EA7)", transition: "width 120ms linear" }} />
    </div>
  );
}
