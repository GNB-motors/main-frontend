/* Accessible pill toggle that matches the app's indigo brand. */
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
