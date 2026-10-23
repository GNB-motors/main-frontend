import './support.css';

/** Labelled form field for the support forms, with an optional inline error. */
export default function SupportField({
  label,
  required = false,
  htmlFor,
  error,
  children,
  className = '',
}) {
  return (
    <div className={`sp-field ${className}`.trim()}>
      <label className="sp-field-label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="sp-required"> *</span> : null}
      </label>
      {children}
      {error ? <p className="sp-field-error">{error}</p> : null}
    </div>
  );
}
