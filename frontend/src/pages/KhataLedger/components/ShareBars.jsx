import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '../utils';

/**
 * The summary panels show parts of a known whole, so they get proportion bars
 * rather than a bare label/amount list — the shape of the spend is the point.
 *
 * items: [{ key, label, amount, dotClass? }]
 */
const ShareBars = ({ title, items = [], emptyHint = 'No data for this period', max = 6 }) => {
  const total = items.reduce((sum, i) => sum + (i.amount || 0), 0);
  const shown = items.slice(0, max);

  return (
    <Card className="card-static">
      <CardContent className="p-4">
        <p className="console-eyebrow">{title}</p>
        {shown.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {shown.map((item) => {
              const pct = total > 0 ? Math.round(((item.amount || 0) / total) * 100) : 0;
              return (
                <div key={item.key || item.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
                      {item.dotClass && (
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.dotClass}`} />
                      )}
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="num shrink-0 text-sm font-medium">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: 'var(--primary-color, #4f46e5)',
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <span className="num w-9 shrink-0 text-right text-xs text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
            {items.length > max && (
              <p className="pt-1 text-xs text-muted-foreground">
                +{items.length - max} more not shown
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShareBars;
