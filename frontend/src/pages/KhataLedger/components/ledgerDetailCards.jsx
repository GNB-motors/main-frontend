import { IndianRupee, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SOURCE_LABELS,
  SOURCE_COLORS,
  formatCurrency,
} from '../utils';
import { getLedgerSplitItems, resolveLedgerSplitLabel } from './ledgerDetailLogic';

const TOP_N = 6;

export const LedgerSummaryCards = ({ summary, isDriver, vehicles, drivers }) => {
  const categoryEntries = Object.entries(summary.byCategory || {});
  const topCategory = categoryEntries[0];
  const splitItems = getLedgerSplitItems(summary, isDriver);
  const topSplit = splitItems[0];
  const topSplitLabel = topSplit
    ? resolveLedgerSplitLabel({ isDriver, item: topSplit, vehicles, drivers })
    : '-';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'var(--primary-light, #eef2ff)',
              color: 'var(--primary-color, #4f46e5)',
            }}
          >
            <IndianRupee size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="mt-0.5 text-xl font-bold">{formatCurrency(summary.totalAmount)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Entries
            </p>
            <p className="mt-0.5 text-xl font-bold">{summary.count ?? 0}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Top Category
          </p>
          <p className="mt-0.5 text-lg font-semibold">
            {topCategory ? CATEGORY_LABELS[topCategory[0]] || topCategory[0] : '-'}
          </p>
          <p className="text-xs text-muted-foreground">
            {topCategory ? formatCurrency(topCategory[1]) : ''}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isDriver ? 'Top Vehicle' : 'Top Driver'}
          </p>
          <p className="mt-0.5 text-lg font-semibold">{topSplitLabel}</p>
          <p className="text-xs text-muted-foreground">
            {topSplit ? formatCurrency(topSplit.amount) : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const LedgerBreakdownCards = ({ summary, isDriver, vehicles, drivers }) => {
  const categoryEntries = Object.entries(summary.byCategory || {});
  const sourceEntries = Object.entries(summary.bySource || {});
  const splitItems = getLedgerSplitItems(summary, isDriver);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">By Category</p>
          <div className="space-y-2">
            {categoryEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              categoryEntries.slice(0, TOP_N).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <Badge
                    className={`text-xs ${CATEGORY_COLORS[key] || CATEGORY_COLORS.MISCELLANEOUS}`}
                  >
                    {CATEGORY_LABELS[key] || key}
                  </Badge>
                  <span className="font-medium">{formatCurrency(value)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">By Source</p>
          <div className="space-y-2">
            {sourceEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              sourceEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <Badge
                    variant="outline"
                    className={`text-xs ${SOURCE_COLORS[key] || SOURCE_COLORS.MANUAL}`}
                  >
                    {SOURCE_LABELS[key] || key}
                  </Badge>
                  <span className="font-medium">{formatCurrency(value)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">{isDriver ? 'By Vehicle' : 'By Driver'}</p>
          <div className="space-y-2">
            {splitItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              splitItems.slice(0, TOP_N).map((item) => (
                <div
                  key={item.vehicleId || item.driverId || item._id || item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {resolveLedgerSplitLabel({
                      isDriver,
                      item,
                      vehicles,
                      drivers,
                      fallback: 'Unknown',
                    })}
                  </span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
