/* Binary pill toggle (reuses the FeatureFlags switch styling). */
const Toggle = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className="ff-switch"
    onClick={onChange}
  >
    <span className="ff-switch__thumb" />
  </button>
);

export default Toggle;
