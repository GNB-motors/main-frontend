import React from 'react';

/**
 * An empty table is a dead end unless it says what to do next — every khata
 * surface passes a headline plus one sentence of guidance, and an action where
 * one exists.
 */
const EmptyState = ({ icon: Icon, title, hint, action }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
    {Icon && (
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon size={22} />
      </div>
    )}
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export default EmptyState;
