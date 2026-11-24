import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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

export default function UpcomingServiceTab({ search = '', refreshKey = 0 }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('ALL');
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
  const overdue = records
    .filter((row) => row.risk === 'OVERDUE' && row.kmUntilDue < 0)
    .slice(0, 10)
    .map((row) => ({ truck: row.registrationNumber, km: Math.abs(row.kmUntilDue) }));
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
            className="si-filter-pill"
          >
            {label} <span>{count(key)}</span>
          </button>
        ))}
        <NewButton text="Refresh" onClick={load} disabled={loading} />
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
            <section aria-label="Top overdue trucks in kilometres">
              <h3>Top {overdue.length} overdue trucks · km</h3>
              <div style={{ width: '100%', height: Math.max(180, overdue.length * 32) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overdue} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <XAxis type="number" unit=" km" />
                    <YAxis type="category" dataKey="truck" width={110} />
                    <Tooltip
                      formatter={(value) => [`${value.toLocaleString('en-IN')} km`, 'Overdue']}
                    />
                    <Bar dataKey="km" fill="#ea580c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="ov-table">
              <caption>Active fleet · sorted by service urgency, then km remaining</caption>
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
                {filtered.map((row) => (
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
          <p>
            Showing {filtered.length} of {records.length} active vehicles.
          </p>
        </>
      )}
    </div>
  );
}
