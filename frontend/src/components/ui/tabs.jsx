import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[9px] border border-[var(--ds-line)] bg-[var(--ds-sunk)] p-[3px] text-[var(--ds-ink2)]',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'relative flex cursor-pointer items-center justify-center rounded-[6px] px-3.5 py-1.5 text-[13px] font-medium transition-colors outline-hidden select-none',
        'hover:bg-card/60 hover:text-[var(--ds-ink)] focus-visible:ring-2 focus-visible:ring-ring/60',
        'data-[selected]:bg-card data-[selected]:font-semibold data-[selected]:text-[var(--ds-ink)] data-[selected]:shadow-[0_1px_2px_rgba(28,20,14,0.10)]',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('mt-4 focus-visible:outline-hidden', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
