import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * One divided card rather than four floating ones with coloured icon chips.
 * The themed accent lands on the lead metric only — everything else stays ink
 * on card, so the row reads as a single instrument panel.
 *
 * The `gap-px` over a border-coloured track draws the dividers, so they stay
 * correct at every breakpoint without nth-child rules.
 *
 * items: [{ label, value, context, accent?, mono? }]
 */
const StatRow = ({ items = [], loading = false }) => (
  <Card className="card-static overflow-hidden p-0">
    <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 bg-card px-5 py-4">
          <p className="console-eyebrow truncate">{item.label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-28" />
          ) : (
            <p
              className={cn(
                'mt-1.5 truncate text-2xl font-semibold leading-tight',
                item.mono !== false && 'num',
              )}
              style={item.accent ? { color: 'var(--primary-color, #4f46e5)' } : undefined}
              title={typeof item.value === 'string' ? item.value : undefined}
            >
              {item.value}
            </p>
          )}
          {loading ? (
            <Skeleton className="mt-2 h-3 w-20" />
          ) : (
            item.context && (
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.context}</p>
            )
          )}
        </div>
      ))}
    </div>
  </Card>
);

export default StatRow;
