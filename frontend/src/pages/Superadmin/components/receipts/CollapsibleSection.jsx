import { useId, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * A drawer section that folds away.
 *
 * The header is a button, so a person can reach it with the keyboard alone.
 * It says whether it is open, and it carries a one-line summary, so a person
 * knows what is inside without opening it.
 *
 * Every section starts closed. Opening and closing never throws away what a
 * person typed: the section only folds its own body away.
 */
const CollapsibleSection = ({ title, summary = '', children }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const label = summary ? `${title} · ${summary}` : title;

  return (
    <section className={`ra-section-card ra-collapse ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="ra-collapse__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <ChevronDown size={15} aria-hidden="true" className="ra-collapse__chevron" />
        ) : (
          <ChevronRight size={15} aria-hidden="true" className="ra-collapse__chevron" />
        )}
        <span className="ra-collapse__label">{label}</span>
      </button>
      {open ? (
        <div className="ra-collapse__panel" id={panelId}>
          {children}
        </div>
      ) : null}
    </section>
  );
};

export default CollapsibleSection;
