import { cn } from '@/lib/utils';

function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return (
    <thead
      className={cn('[&_tr]:border-b [&_tr]:border-[var(--ds-line2)]', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

function TableFooter({ className, ...props }) {
  return (
    <tfoot
      className={cn(
        'border-t border-[var(--ds-line)] bg-[var(--ds-sunk)] font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        'border-b border-[var(--ds-line)] transition-colors hover:bg-[var(--ds-sunk)] data-[state=selected]:bg-[var(--orange-tint)] data-[state=selected]:shadow-[inset_3px_0_0_0_var(--orange)]',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        'h-10 bg-[var(--ds-sunk)] px-3 text-left align-middle text-xs font-semibold text-[var(--ds-ink2)] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }) {
  return <caption className={cn('mt-4 text-sm text-[var(--ds-ink3)]', className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
