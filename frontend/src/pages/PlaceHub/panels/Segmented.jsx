import { num } from '../../../utils/formatMoney.js';

export default function Segmented({ value, options, onChange, label }) {
  return (
    <div className="ph-seg" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          className={`ph-seg-btn${value === o.id ? ' is-on' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
          {o.count != null && <span className="ph-seg-count">{num(o.count)}</span>}
        </button>
      ))}
    </div>
  );
}
