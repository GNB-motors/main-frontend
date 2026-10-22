/**
 * Tolls — monthly toll spend, per-vehicle breakdown, and who is actually
 * using the return rule.
 *
 * Reads only; the plaza master lives in the Plazas tab. The page deliberately
 * shows the two "something may be wrong" signals rather than hiding them:
 *  - Missed returns: a crossing billed onward although the plaza's window made
 *    it a return. Money on the table, usually a GPS gap that hid the exit.
 *  - Possible overpay: a truck crossing the same plaza again and again but never
 *    once inside the window. A REVIEW signal, not a verdict — it may equally be
 *    a correctly-paid second trip.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { IndianRupee, Route, PiggyBank, AlertTriangle, Download, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import TollsService from './TollsService';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import KpiCard from '../../components/ui/KpiCard';
import TollPlazasTab from './TollPlazasTab';
import { getUserRole } from '../../utils/session.js';
import {
  summaryTiles,
  vehicleRows,
  filterVehicles,
  formatInr,
  formatPct,
  formatGap,
  currentMonth,
  downloadBlob,
} from './tollsUtils';
import './TollsPage.css';

const TONE = { slate: '#0f172a', green: '#059669', amber: '#b45309' };
const PAGE_SIZE = 25;

const TABS = [
  { id: 'report', label: 'Report' },
  { id: 'plazas', label: 'Plazas' },
];

/** Mirrors the API's `authorize('OWNER','MANAGER')` on every plaza write. */
const PLAZA_EDITOR_ROLES = ['OWNER', 'MANAGER'];

export default function TollsPage() {
  const canEdit = PLAZA_EDITOR_ROLES.includes(getUserRole());
  const [tab, setTab] = useState('report');
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [flag, setFlag] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState([]);

  const load = useCallback(async (m) => {
    setLoading(true);
    setError(null);
    try {
      setData(await TollsService.getReport(m));
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'report') load(month);
  }, [tab, month, load]);

  const onExport = async () => {
    try {
      const blob = await TollsService.exportCsv(month);
      downloadBlob(blob, `tolls-${month}.csv`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const rows = data ? filterVehicles(vehicleRows(data.vehicles), { search, flag }) : [];
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // A filter change must not leave the reader stranded on an empty later page.
  const safePage = Math.min(page, totalPages);

  const columns = [
    {
      key: 'vehicleLabel',
      label: 'Vehicle',
      render: (r) => (
        <span className="tolls-veh">
          <strong>{r.vehicleLabel}</strong>
          <button
            type="button"
            className="tolls-expand"
            onClick={() =>
              setExpanded((p) => (p.includes(r.vehicleId) ? p.filter((x) => x !== r.vehicleId) : [...p, r.vehicleId]))
            }
          >
            {expanded.includes(r.vehicleId) ? 'Hide plazas' : `${r.plazaBreakdown.length} plazas`}
          </button>
        </span>
      ),
    },
    { key: 'crossings', label: 'Crossings', align: 'right' },
    { key: 'onward', label: 'Onward', align: 'right' },
    { key: 'returnCrossings', label: 'Return', align: 'right' },
    {
      key: 'returnRatio',
      label: 'Return share',
      align: 'right',
      render: (r) => formatPct(r.returnRatio),
    },
    {
      key: 'spendInr',
      label: 'Spend',
      align: 'right',
      render: (r) => `₹${formatInr(r.spendInr)}`,
    },
    {
      key: 'savingsInr',
      label: 'Saved',
      align: 'right',
      render: (r) =>
        r.savingsInr > 0 ? (
          <span className="tolls-saved">₹{formatInr(r.savingsInr)}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'possibleOverpay',
      label: 'Review',
      render: (r) =>
        r.possibleOverpay ? (
          <span className="tolls-flag" title="Crosses this plaza repeatedly but never inside the return window">
            possible overpay
          </span>
        ) : r.noFareCrossings > 0 ? (
          <span className="tolls-flag tolls-flag--muted" title="Crossings the plaza has no fare for this class">
            {r.noFareCrossings} unpriced
          </span>
        ) : null,
    },
  ];

  const tiles = data ? summaryTiles(data.summary) : [];

  return (
    <div className="tolls">
      <PageShell
        title="Tolls"
        subtitle="Which plazas a truck crossed, what it cost, and how much the return rule saved."
        actions={
          tab === 'report' ? (
            <button
              type="button"
              className="pshell-btn pshell-btn--primary"
              onClick={onExport}
              disabled={loading}
            >
              <Download size={14} /> Export CSV
            </button>
          ) : null
        }
        filters={
          <div className="tolls-controls">
            <div className="tolls-tabs" role="tablist" aria-label="Tolls sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`tolls-tab${tab === t.id ? ' tolls-tab--active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'report' && (
              <>
                <label className="tolls-month">
                  Month
                  <input
                    type="month"
                    aria-label="Month"
                    value={month}
                    onChange={(e) => {
                      setMonth(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                <label className="tolls-search">
                  <Search size={14} />
                  <input
                    aria-label="Search vehicle"
                    placeholder="Search vehicle"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                <select
                  aria-label="Filter"
                  className="tolls-filter"
                  value={flag}
                  onChange={(e) => {
                    setFlag(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All vehicles</option>
                  <option value="savers">Saved by the return rule</option>
                  <option value="overpay">Possible overpay</option>
                </select>
              </>
            )}
          </div>
        }
        footer={
          tab === 'report' && data
            ? `${rows.length} of ${data.vehicles.length} vehicles · ${data.month}`
            : null
        }
      >
        {tab === 'plazas' ? (
          <TollPlazasTab canEdit={canEdit} />
        ) : (
          <>
            <div className="tolls-tiles">
              {tiles.map((t) => (
                <KpiCard
                  key={t.key}
                  title={t.label}
                  value={`${t.suffix === '₹' ? '₹' : ''}${t.value}`}
                  accent={TONE[t.tone]}
                  icon={
                    t.key === 'spend' ? (
                      <IndianRupee size={18} />
                    ) : t.key === 'crossings' ? (
                      <Route size={18} />
                    ) : t.key === 'savings' ? (
                      <PiggyBank size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )
                  }
                />
              ))}
            </div>

            {data?.summary?.missedReturnInr > 0 && (
              <div className="tolls-notice">
                <strong>₹{formatInr(data.summary.missedReturnInr)}</strong> of returns may have been
                missed &mdash; {data.summary.anomalyCount} crossing(s) were billed onward although a
                return was inside that plaza&apos;s window.
              </div>
            )}

            {data && data.anomalies.length > 0 && (
              <section className="tolls-anomalies">
                <h2>Missed returns</h2>
                <p className="tolls-sub">
                  Each row was charged the onward fare although the same truck crossed that plaza
                  inside its return window.
                </p>
                <DataTable
                  columns={[
                    { key: 'registrationNumber', label: 'Vehicle' },
                    { key: 'gapHours', label: 'Gap', render: (r) => formatGap(r.gapHours) },
                    { key: 'returnWindowHours', label: 'Window', render: (r) => `${r.returnWindowHours}h` },
                    {
                      key: 'appliedCharge',
                      label: 'Charged',
                      align: 'right',
                      render: (r) => `₹${formatInr(r.appliedCharge)}`,
                    },
                    {
                      key: 'expectedCharge',
                      label: 'Should be',
                      align: 'right',
                      render: (r) => `₹${formatInr(r.expectedCharge)}`,
                    },
                    {
                      key: 'missedReturnInr',
                      label: 'Missed',
                      align: 'right',
                      render: (r) => <span className="tolls-saved">₹{formatInr(r.missedReturnInr)}</span>,
                    },
                  ]}
                  rows={data.anomalies.slice(0, 10)}
                  rowKey={(r) => `${r.vehicleId}-${r.plazaId}-${r.crossedAt}`}
                  loading={loading}
                  error={error}
                  onRetry={() => load(month)}
                  emptyTitle="No missed returns"
                />
              </section>
            )}

            <DataTable
              columns={columns}
              rows={paged}
              rowKey={(r) => r.vehicleId}
              loading={loading}
              error={error}
              onRetry={() => load(month)}
              showing={paged.length}
              total={rows.length}
              emptyTitle={loading ? 'Loading tolls…' : 'No toll crossings in this month'}
              emptyHint="Crossings appear once the toll-plaza master is loaded and the sweep has run."
              expandedKeys={expanded}
              renderExpanded={(r) => (
                <table className="tolls-plaza-table">
                  <thead>
                    <tr>
                      <th>Plaza</th>
                      <th>Highway</th>
                      <th className="right">Crossings</th>
                      <th className="right">Return</th>
                      <th className="right">Spend</th>
                      <th className="right">Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.plazaBreakdown.map((p) => (
                      <tr key={p.plazaId}>
                        <td>{p.name || p.plazaId}</td>
                        <td>{p.highway || '—'}</td>
                        <td className="right">{p.crossings}</td>
                        <td className="right">{p.ret}</td>
                        <td className="right">₹{formatInr(p.spend)}</td>
                        <td className="right">
                          {p.savings > 0 ? `₹${formatInr(p.savings)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              pagination={
                totalPages > 1 ? (
                  <div className="tolls-pager">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                    >
                      Previous
                    </button>
                    <span>
                      Page {safePage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                    >
                      Next
                    </button>
                  </div>
                ) : null
              }
            />
          </>
        )}
      </PageShell>
    </div>
  );
}