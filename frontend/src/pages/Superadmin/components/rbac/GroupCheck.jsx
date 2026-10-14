import { useEffect, useRef } from 'react';

/* Group-level tri-state checkbox: all / none / mixed. */
const GroupCheck = ({ state, onToggle, disabled }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'mixed';
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="rbac-group__check"
      checked={state === 'all'}
      disabled={disabled}
      onChange={onToggle}
      onClick={(e) => e.stopPropagation()}
      aria-label="Toggle all permissions in this group"
    />
  );
};

export default GroupCheck;
