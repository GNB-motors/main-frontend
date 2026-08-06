import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shared page head for every khata surface: eyebrow, title, one line of purpose,
 * and a right-hand slot for the date range + primary action.
 */
const LedgerPageHeader = ({
  eyebrow = 'Khata Ledger',
  title,
  description,
  icon: Icon,
  backTo,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-3">
        {backTo && (
          <Button
            variant="outline"
            size="icon-lg"
            onClick={() => navigate(backTo)}
            aria-label="Back"
            className="mt-1 shrink-0"
          >
            <ArrowLeft size={17} />
          </Button>
        )}
        <div className="min-w-0">
          <p className="console-eyebrow">{eyebrow}</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            {Icon && <Icon size={22} style={{ color: 'var(--primary-color, #4f46e5)' }} />}
            <span className="truncate">{title}</span>
          </h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
};

export default LedgerPageHeader;
