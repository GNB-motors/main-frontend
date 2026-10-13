import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Wallet } from 'lucide-react';
import { inr } from '../../../utils/formatMoney';
import { formatInrCompact } from '../../../utils/formatters';
import { MONEY_SERIES, C } from '../../../utils/erpChartTheme';

function CashMovementPanel({ periodLabel, summary, cashData }) {
  return (
    <div className="acc-card-panel acc-cash">
      <div className="acc-panel-head">
        <div className="acc-panel-title">
          <span className="acc-panel-ic acc-panel-ic--cash">
            <Wallet size={15} />
          </span>
          <div>
            <h3>Cash movement</h3>
            <p className="acc-panel-sub">
              {periodLabel}
              {' · '}
              Cash movement, not a bank balance — this system has no bank ledger.
            </p>
          </div>
        </div>
        <span className="acc-panel-total erp-numeric">
          {summary ? inr(summary.cashMovement.net) : '—'}
        </span>
      </div>

      <div className="acc-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={cashData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: C.muted }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: C.muted }}
              tickFormatter={formatInrCompact}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip
              cursor={{ fill: 'rgba(79,70,229,0.05)' }}
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #e6e9ef',
                fontSize: 12,
                boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                padding: '8px 12px',
              }}
              formatter={(v, n) => [
                inr(v),
                n === 'in' ? 'Money in' : n === 'out' ? 'Money out' : 'Net',
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={9}
              wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
              formatter={(v) => (v === 'in' ? 'Money in' : v === 'out' ? 'Money out' : 'Net')}
            />
            <Bar
              dataKey="in"
              fill={MONEY_SERIES.receivable}
              radius={[5, 5, 0, 0]}
              maxBarSize={72}
            />
            <Bar dataKey="out" fill={MONEY_SERIES.payable} radius={[5, 5, 0, 0]} maxBarSize={72} />
            <Line type="monotone" dataKey="net" stroke={C.ink} strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="acc-cash-legend">
        <div className="acc-cash-stat">
          <span className="acc-dot acc-dot--in" />
          <span className="acc-cash-stat-label">In</span>
          <strong className="erp-numeric">{summary ? inr(summary.cashMovement.in) : '—'}</strong>
          <span className="acc-cash-stat-meta">{summary?.cashMovement.inCount || 0} receipts</span>
        </div>
        <div className="acc-cash-stat">
          <span className="acc-dot acc-dot--out" />
          <span className="acc-cash-stat-label">Out</span>
          <strong className="erp-numeric">{summary ? inr(summary.cashMovement.out) : '—'}</strong>
          <span className="acc-cash-stat-meta">{summary?.cashMovement.outCount || 0} payments</span>
        </div>
      </div>
    </div>
  );
}

export default CashMovementPanel;
