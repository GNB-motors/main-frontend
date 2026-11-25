import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../ui/forms.css';

/**
 * A password input with a show/hide toggle.
 */
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'new-password',
  error = null,
  name,
  maxLength = 72,
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div className="pwf">
      <label id={`${id}-label`} htmlFor={id} className="pwf-label">
        {label}
      </label>
      <div className="pwf-row">
        <input
          id={id}
          name={name}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-labelledby={`${id}-label`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
          className="pwf-input"
          maxLength={maxLength}
        />
        <button
          type="button"
          className="pwf-eye"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-err`} className="pwf-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
