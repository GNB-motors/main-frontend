import React from 'react';
import { BookOpen, IndianRupee, Route, Fuel } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '../utils';

function TransactionSummaryCards({ summary, meta, includeTripExpenses }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
              Total Manual Expenses
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
              Manual Entries
            </p>
            <p className="mt-0.5 text-xl font-bold">{meta.totalManual}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Route size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Trip Expenses
            </p>
            <p className="mt-0.5 text-xl font-bold">
              {includeTripExpenses ? meta.totalTrip : 'Hidden'}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Fuel size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fuel Logs
            </p>
            <p className="mt-0.5 text-xl font-bold">
              {includeTripExpenses ? meta.totalFuel : 'Hidden'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TransactionSummaryCards;
