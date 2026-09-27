import * as React from 'react';
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

function SheetPortal({ children, ...props }) {
  return <SheetPrimitive.Portal {...props}>{children}</SheetPrimitive.Portal>;
}

function SheetOverlay({ className, ...props }) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-backdrop"
      className={cn(
        // Same scrim recipe as the dialog: z clears the legacy side-panel/map
        // overlays (9999-10001), glass ink at 32% over a 3px blur.
        'fixed inset-0 z-[10050] bg-[color-mix(in_srgb,var(--ds-ink)_32%,transparent)] backdrop-blur-[3px] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-150',
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({ className, children, ...props }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          'fixed inset-y-0 right-0 z-[10051] flex h-full w-full max-w-sm flex-col border-l border-[var(--ds-line2)] bg-card text-card-foreground shadow-[var(--ds-shadow-lg)]',
          // Slide in from the right edge; Base UI toggles the starting/ending
          // data attributes around the transition.
          'transition-transform duration-200 ease-out',
          'data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
          className,
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        'flex items-center justify-between border-b border-[var(--ds-line)] px-5 py-4',
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-base font-semibold leading-none', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
