import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import NewButton from '../../../components/ui/NewButton';
import KpiCard from '../../../components/ui/KpiCard';
import { formatKm } from '../../../utils/formatters';
import { formatIstDate } from '../../../utils/redesign/format';
import { loadServiceForecasts, serviceDaysText } from '../serviceForecasts';

const LABELS = {
  OVERDUE: 'Overdue',
  DUE_SOON: 'Due soon',
  OK: 'On track',
  UNKNOWN: 'Not assessed',
};
const TABS = [['ALL', 'All'], ...Object.entries(LABELS)];
const PAGE_SIZE = 10;

export default function UpcomingServiceTab({ search = '', refreshKey = 0 }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await loadServiceForecasts();
      if (id === requestId.current) setRecords(rows);
    } catch (err) {
      if (id === requestId.current) setError(err.message || 'Could not load service forecasts.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load, refreshKey]);
  useEffect(() => {
    setPage(1);
  }, [search, subTab]);
  const counts = useMemo(() => {
    const result = { ALL: records.length };
    for (const row of records) result[row.risk] = (result[row.risk] || 0) + 1;
    return result;
  }, [records]);
  const filtered = records.filter(
    (row) =>
      (subTab === 'ALL' || row.risk === subTab) &&
      row.registrationNumber.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstVisible = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastVisible = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const overdue = filtered
    .filter((row) => row.risk === 'OVERDUE' && row.kmUntilDue < 0)
    .slice(0, 10)
    .map((row) => ({
      registrationNumber: row.registrationNumber,
      km: Math.abs(row.kmUntilDue),
      days: serviceDaysText(row.daysUntilDue),
    }));
  const largestOverdueKm = overdue[0]?.km || 1;
  const count = (key) => (error || loading ? '—' : counts[key] || 0);
  return (
    <div className="si-alerts-wrapper">
      <div className="si-kpis-strip">
        <KpiCard
          title="Tracked vehicles"
          value={count('ALL')}
          accent="#3b82f6"
          icon={<CalendarClock size={18} />}
        />
        <KpiCard
          title="Overdue"
          value={count('OVERDUE')}
          accent="#dc2626"
          icon={<AlertTriangle size={18} />}
        />
        <KpiCard
          title="Due soon"
          value={count('DUE_SOON')}
          accent="#ea580c"
          icon={<Clock size={18} />}
        />
        <KpiCard
          title="On track"
          value={count('OK')}
          accent="#16a34a"
          icon={<CheckCircle2 size={18} />}
        />
      </div>
      <div className="si-filter-pills-row">
        {TABS.map(([key, label]) => (
          <button
            type="button"
            key={key}
            aria-pressed={subTab === key}
            onClick={() => setSubTab(key)}
            className={`si-filter-pill${subTab === key ? ' si-filter-pill--active' : ''}`}
          >
            {label} <span>{count(key)}</span>
          </button>
        ))}
        <NewButton text="Refresh" size="sm" onClick={load} disabled={loading} />
      </div>
      {error ? (
        <p role="alert">
          {error}{' '}
          <button type="button" onClick={load}>
            Retry
          </button>
        </p>
      ) : loading ? (
        <p role="status">Loading service forecasts…</p>
      ) : (
        <>
          {overdue.length > 0 && (
            <section className="si-overdue-panel" aria-label="Top overdue trucks in kilometres">
              <header className="si-overdue-panel__header">
                <div>
                  <p className="si-overdue-panel__eyebrow">Needs attention</p>
                  <h3>Most overdue vehicles</h3>
                  <p>Ranked by distance past the planned service interval.</p>
                </div>
                <span className="si-overdue-panel__count">Top {overdue.length}</span>
              </header>
              <ol className="si-overdue-list">
                {overdue.map((truck, index) => (
                  <li key={truck.registrationNumber} className="si-overdue-row">
                    <span className="si-overdue-row__rank">{index + 1}</span>
                    <div className="si-overdue-row__vehicle">
                      <Link to={`/vehicles/${encodeURIComponent(truck.registrationNumber)}`}>
                        {truck.registrationNumber}
                      </Link>
                      <span>{truck.days}</span>
                    </div>
                    <div className="si-overdue-row__distance">
                      <strong>{formatKm(truck.km)} overdue</strong>
                      <span className="si-overdue-row__track" aria-hidden="true">
                        <span
                          style={{ width: `${Math.max(8, (truck.km / largestOverdueKm) * 100)}%` }}
                        />
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="ov-table">
              <thead>
                <tr>
                  <th>Truck</th>
                  <th>Status</th>
                  <th>Distance to service</th>
                  <th>Expected date</th>
                  <th>Last recorded service</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.registrationNumber}>
                    <td>
                      <Link to={`/vehicles/${encodeURIComponent(row.registrationNumber)}`}>
                        {row.registrationNumber}
                      </Link>
                    </td>
                    <td>
                      {LABELS[row.risk] || 'Not assessed'}
                      <small style={{ display: 'block' }}>
                        {serviceDaysText(row.daysUntilDue)}
                      </small>
                    </td>
                    <td>
                      {row.kmUntilDue == null
                        ? '—'
                        : row.kmUntilDue < 0
                          ? `${formatKm(Math.abs(row.kmUntilDue))} overdue`
                          : `${formatKm(row.kmUntilDue)} remaining`}
                    </td>
                    <td>
                      {row.projectedServiceDueDate
                        ? formatIstDate(row.projectedServiceDueDate)
                        : 'Not projected'}
                    </td>
                    <td>{row.lastServiceAt ? formatIstDate(row.lastServiceAt) : 'Not recorded'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <p>{records.length ? 'No vehicles match this filter.' : 'No active vehicles found.'}</p>
          )}
          <div className="si-upcoming-pagination">
            <span aria-live="polite">
              Showing {firstVisible}–{lastVisible} of {filtered.length} vehicles
            </span>
            {totalPages > 1 ? (
              <nav className="si-upcoming-pagination__controls" aria-label="Upcoming service pages">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span aria-current="page">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </nav>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
