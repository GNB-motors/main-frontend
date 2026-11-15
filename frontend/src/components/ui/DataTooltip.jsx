import './DataTooltip.css';

/** Shared light tooltip content. Position it inside a hover/focus trigger or an overlay. */
export default function DataTooltip({ label, value, details = [], className = '', ...props }) {
  return (
    <span className={`data-tooltip ${className}`.trim()} {...props}>
      <span className="data-tooltip-label">
        <i aria-hidden="true" />
        {label}
      </span>
      {value != null ? <strong>{value}</strong> : null}
      {details.filter(Boolean).map((detail, index) => (
        <span className="data-tooltip-detail" key={index}>
          {detail}
        </span>
      ))}
    </span>
  );
}
