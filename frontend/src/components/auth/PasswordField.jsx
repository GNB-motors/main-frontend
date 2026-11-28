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
  id: inputId,
  className = '',
  inputClassName = '',
  labelClassName = '',
  required = false,
  disabled = false,
  placeholder,
  'aria-label': ariaLabel,
}) {
  const generatedId = useId();
  const id = inputId || generatedId;
  const [shown, setShown] = useState(false);
  return (
    <div className={`pwf ${className}`}>
      <label id={`${id}-label`} htmlFor={id} className={`pwf-label ${labelClassName}`}>
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
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : `${id}-label`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`pwf-input ${inputClassName}`}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="pwf-eye"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          disabled={disabled}
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
