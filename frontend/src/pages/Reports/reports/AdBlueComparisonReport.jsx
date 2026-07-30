import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Droplets,
  Gauge,
  Info,
  Search,
} from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import './AdBlueComparisonReport.css';

const PAGE_SIZE = 20;

const number = (value, digits = 1) => (
  typeof value === 'number'
    ? value.toLocaleString('en-IN', { maximumFractionDigits: digits })
    : '—'
);

const currency = (value) => (
  typeof value === 'number'
    ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : '—'
);

const StatusBadge = ({ status, reason }) => {
  const config = {
    OK: { icon: CheckCircle2, label: 'OK', className: 'ok' },
    REVIEW: { icon: AlertTriangle, label: 'Review', className: 'review' },
    STALE: { icon: Clock3, label: 'Stale feed', className: 'stale' },
    NO_DATA: { icon: Info, label: 'No data', className: 'no-data' },
  }[status] || { icon: Info, label: status, className: 'no-data' };
  const Icon = config.icon;
  return (
    <span className={`adblue-status ${config.className}`} title={reason}>
      <Icon size={13} /> {config.label}
    </span>
  );
};

const AdBlueComparisonReport = () => {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [methodology, setMethodology] = useState({});
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, debouncedSearch]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/api/adblue-logs/comparison', {
          params: {
            page,
            limit: PAGE_SIZE,
            startDate: dayjs(startDate).startOf('day').toISOString(),
            endDate: dayjs(endDate).endOf('day').toISOString(),
            ...(debouncedSearch && { search: debouncedSearch }),
          },
        });
        setRows(response.data?.data || []);
        setSummary(response.data?.summary || {});
        setMeta(response.data?.meta || { page: 1, total: 0, totalPages: 1 });
        setMethodology(response.data?.methodology || {});
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load AdBlue telemetry comparison');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, startDate, endDate, debouncedSearch]);

  return (
    <div className="adblue-comparison-report">
      <div className="adblue-report-header">
        <div>
          <h2>AdBlue Telemetry Comparison</h2>
          <p>Recorded top-ups compared with FleetEdge DEF consumption and current level.</p>
        </div>
        <div className="adblue-report-filters">
          <label>
            From
            <input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <div className="adblue-report-search">
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vehicle"
            />
          </div>
        </div>
      </div>

      <div className="adblue-kpi-grid">
        <div className="adblue-kpi-card">
          <Droplets size={19} />
          <div><span>Recorded additions</span><strong>{number(summary.totalRecordedLitres)} L</strong></div>
        </div>
        <div className="adblue-kpi-card">
          <Gauge size={19} />
          <div><span>FleetEdge consumed</span><strong>{number(summary.totalTelemetryConsumedLitres)} L</strong></div>
        </div>
        <div className="adblue-kpi-card">
          <Droplets size={19} />
          <div><span>Average current DEF</span><strong>{number(summary.averageCurrentDefLevel)}%</strong></div>
        </div>
        <div className="adblue-kpi-card review">
          <AlertTriangle size={19} />
          <div><span>Vehicles to review</span><strong>{summary.reviewCount ?? 0}</strong></div>
        </div>
      </div>

      <div className="adblue-comparison-table-wrap">
        <table className="adblue-comparison-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Recorded Added</th>
              <th>Amount</th>
              <th>FleetEdge Consumed</th>
              <th>Unreconciled</th>
              <th>Current DEF</th>
              <th>Last Live Sync</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="adblue-report-empty">Loading telemetry comparison…</td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="adblue-report-empty error">{error}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="adblue-report-empty">No AdBlue or FleetEdge DEF data for this period.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.vehicleId}>
                <td>
                  <strong>{row.registrationNumber}</strong>
                  <span>{row.vehicleType}{row.model !== '-' ? ` · ${row.model}` : ''}</span>
                </td>
                <td>
                  <strong>{number(row.recordedLitres)} L</strong>
                  <span>{row.additionCount} top-up{row.additionCount === 1 ? '' : 's'}</span>
                </td>
                <td>{currency(row.recordedAmount)}</td>
                <td>
                  {row.telemetryConsumedLitres == null ? '—' : `${number(row.telemetryConsumedLitres)} L`}
                  <span>{row.telemetryIntervals ? `${row.telemetryIntervals} interval${row.telemetryIntervals === 1 ? '' : 's'}` : 'No interval data'}</span>
                </td>
                <td className={row.varianceLitres != null && row.varianceLitres > 0 ? 'variance-positive' : ''}>
                  {row.varianceLitres == null ? '—' : `${number(row.varianceLitres)} L`}
                </td>
                <td>
                  <strong>{row.currentDefLevel == null ? '—' : `${number(row.currentDefLevel)}%`}</strong>
                  <span>{row.isFresh ? 'Fresh' : 'Not fresh'}</span>
                </td>
                <td>{row.lastSyncedAt ? dayjs(row.lastSyncedAt).format('DD MMM YYYY, hh:mm A') : '—'}</td>
                <td><StatusBadge status={row.status} reason={row.statusReason} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adblue-report-footer">
        <span>
          {meta.total || 0} vehicles · Live feed fresh for {summary.freshLiveVehicleCount || 0}
          {methodology.freshnessHours ? ` (≤ ${methodology.freshnessHours}h)` : ''}
        </span>
        <div>
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span>Page {meta.page || 1} of {meta.totalPages || 1}</span>
          <button type="button" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdBlueComparisonReport;
