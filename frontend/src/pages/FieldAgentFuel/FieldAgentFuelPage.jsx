import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, IndianRupee, Search, RefreshCw, FileText, Plus } from 'lucide-react';
import { getThemeCSS } from '../../utils/colorTheme';
import { formatDateTimeIST } from '../../utils/dateUtils';
import LottieLoader from '../../components/LottieLoader';
import { FieldAgentFuelService } from './FieldAgentFuelService';
import { humanise } from '../../lib/vocabulary';
import { footerSummary } from '../../lib/tableState';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import ExportButton from '../../components/ui/ExportButton';
import './FieldAgentFuel.css';

const PAGE_SIZE = 20;

const pad = (n) => String(n).padStart(2, '0');
const toInputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const fmtNum = (v, digits = 2) =>
  v == null ? '-' : Number(v).toLocaleString('en-IN', { maximumFractionDigits: digits });
const fmtMoney = (v) =>
  v == null ? '₹0' : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const KpiCard = ({ icon, label, value }) => (
  <div className="fa-fuel-kpi">
    <div className="fa-fuel-kpi-icon">{icon}</div>
    <div className="fa-fuel-kpi-body">
      <div className="fa-fuel-kpi-value">{value}</div>
      <div className="fa-fuel-kpi-label">{label}</div>
    </div>
  </div>
);

const agentName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || '-' : '-');

const LOG_EXPORT_COLUMNS = [
  { key: 'refuelTime', label: 'Date' },
  { key: 'organization', label: 'Organization' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'uploadedBy', label: 'Uploaded by' },
  { key: 'fuelType', label: 'Fuel' },
  { key: 'fillingType', label: 'Type' },
  { key: 'litres', label: 'Litres', type: 'number' },
  { key: 'rate', label: 'Rate (₹)', type: 'currency' },
  { key: 'totalAmount', label: 'Amount (₹)', type: 'currency' },
  { key: 'odometerReading', label: 'Odometer', type: 'number' },
  { key: 'location', label: 'Location' },
  { key: 'reviewStatus', label: 'Review' },
];
const logExportRows = (records) =>
  records.map((log) => ({
    refuelTime: log.refuelTime ? formatDateTimeIST(log.refuelTime) : '—',
    organization: log.orgId?.companyName || 'Unknown',
    vehicle: log.vehicleId?.registrationNumber || '—',
    uploadedBy: agentName(log.loggedBy),
    fuelType: log.fuelType || '—',
    fillingType: log.fillingType ? humanise(log.fillingType) : '—',
    litres: log.litres,
    rate: log.rate,
    totalAmount: log.totalAmount,
    odometerReading: log.odometerReading,
    location: log.location || '—',
    reviewStatus: humanise(log.reviewStatus),
  }));

const DEFAULT_FILTERS = () => ({
  vehicleId: '',
  from: toInputDate(daysAgo(30)),
  to: toInputDate(new Date()),
});

const FieldAgentFuelPage = () => {
  const navigate = useNavigate();
  const [themeColors] = useState(getThemeCSS());
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalUploads: 0, totalLitres: 0, totalSpend: 0 });
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_FILTERS); // committed (drives the query)
  const [draft, setDraft] = useState(filters); // editable inputs
  const [logQuery, setLogQuery] = useState(''); // client-side search over the loaded page

  useEffect(() => {
    FieldAgentFuelService.getVehicles()
      .then(setVehicles)
      .catch(() => setVehicles([]));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fromISO = filters.from ? new Date(`${filters.from}T00:00:00`).toISOString() : undefined;
      const toISO = filters.to ? new Date(`${filters.to}T23:59:59.999`).toISOString() : undefined;
      const res = await FieldAgentFuelService.getLogs({
        vehicleId: filters.vehicleId || undefined,
        from: fromISO,
        to: toISO,
        page,
        limit: PAGE_SIZE,
      });
      setLogs(res.data || []);
      setStats(res.stats || { totalUploads: 0, totalLitres: 0, totalSpend: 0 });
      setMeta(res.meta || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      setError(err?.response?.data?.message || err?.userMessage || 'Failed to load fuel uploads.');
      setLogs([]);
      setStats({ totalUploads: 0, totalLitres: 0, totalSpend: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const applyFilters = () => {
    setPage(1);
    setFilters(draft);
  };
  const clearFilters = () => {
    const reset = DEFAULT_FILTERS();
    setDraft(reset);
    setPage(1);
    setFilters(reset);
  };

  // Client-side search — the logs endpoint accepts no q param, so this
  // narrows the records already on screen (the current page).
  const logNeedle = logQuery.trim().toLowerCase();
  const filteredLogs = logNeedle
    ? logs.filter((log) =>
        [
          log.vehicleId?.registrationNumber,
          log.orgId?.companyName,
          agentName(log.loggedBy),
          log.fuelType,
          log.fillingType,
          log.location,
          log.reviewStatus,
        ].some((f) => String(f ?? '').toLowerCase().includes(logNeedle)))
    : logs;
  const logFilterCount = (filters.vehicleId ? 1 : 0) + (logNeedle ? 1 : 0);
  const selectedVehicle = vehicles.find((v) => v._id === filters.vehicleId) || null;

  return (
    <div className="fa-fuel-page" style={themeColors}>
      <PageShell
        title="Field Agent Fuel Uploads"
        subtitle="Standalone fuel logs uploaded from the field — filter by vehicle and date."
        count={meta.total}
        actions={(
          <>
            <button className="fa-fuel-btn" onClick={fetchLogs} disabled={loading}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="fa-fuel-btn fa-fuel-btn-primary" onClick={() => navigate('/field-agent-fuel/new')}>
              <Plus size={16} /> Log Fuel
            </button>
          </>
        )}
        filters={(
          <FilterBar
            searchValue={logQuery}
            onSearchChange={setLogQuery}
            searchPlaceholder="Search vehicle, agent or location…"
            activeCount={logFilterCount}
            onClear={() => { setLogQuery(''); clearFilters(); }}
            right={(
              <ExportButton
                rows={logExportRows(filteredLogs)}
                columns={LOG_EXPORT_COLUMNS}
                filename="field-agent-fuel"
                disabled={loading || !!error}
                meta={{
                  generatedAt: new Date(),
                  filters: [
                    ...(logNeedle ? [{ label: 'Search (this page)', value: logQuery.trim() }] : []),
                    { label: 'Vehicle', value: selectedVehicle?.registrationNumber || 'All vehicles' },
                    { label: 'From', value: filters.from || '—' },
                    { label: 'To', value: filters.to || '—' },
                  ],
                }}
              />
            )}
          />
        )}
        footer={footerSummary({ showing: filteredLogs.length, total: meta.total, activeFilters: logFilterCount }) + ' on this page'}
      >
      <div className="fa-fuel-kpis">
        <KpiCard icon={<FileText size={20} />} label="Uploads" value={fmtNum(stats.totalUploads, 0)} />
        <KpiCard icon={<Droplet size={20} />} label="Total Litres" value={`${fmtNum(stats.totalLitres)} L`} />
        <KpiCard icon={<IndianRupee size={20} />} label="Total Spend" value={fmtMoney(stats.totalSpend)} />
      </div>

      <div className="fa-fuel-filters">
        <div className="fa-fuel-field">
          <label>Vehicle</label>
          <select
            value={draft.vehicleId}
            onChange={(e) => setDraft({ ...draft, vehicleId: e.target.value })}
          >
            <option value="">All Vehicles</option>
            {Object.entries(
              vehicles.reduce((acc, v) => {
                const orgName = v.orgId?.companyName || 'Unknown Org';
                if (!acc[orgName]) acc[orgName] = [];
                acc[orgName].push(v);
                return acc;
              }, {})
            ).map(([orgName, orgVehicles]) => (
              <optgroup key={orgName} label={orgName}>
                {orgVehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber || v._id}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="fa-fuel-field">
          <label>From</label>
          <input
            type="date"
            value={draft.from}
            max={draft.to || undefined}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </div>
        <div className="fa-fuel-field">
          <label>To</label>
          <input
            type="date"
            value={draft.to}
            min={draft.from || undefined}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </div>
        <div className="fa-fuel-filter-actions">
          <button className="fa-fuel-btn fa-fuel-btn-primary" onClick={applyFilters} disabled={loading}>
            <Search size={15} /> Apply
          </button>
          <button className="fa-fuel-btn" onClick={clearFilters} disabled={loading}>
            Clear
          </button>
        </div>
      </div>

      <div className="fa-fuel-table-wrap">
        {loading ? (
          <div className="fa-fuel-state">
            <LottieLoader isLoading size="medium" message="Loading uploads..." overlay={false} />
          </div>
        ) : error ? (
          <div className="fa-fuel-state fa-fuel-error">{error}</div>
        ) : logs.length === 0 ? (
          <div className="fa-fuel-state">No fuel uploads found for the selected filters.</div>
        ) : filteredLogs.length === 0 ? (
          <div className="fa-fuel-state">No uploads on this page match “{logQuery.trim()}”. Try another term or clear the search.</div>
        ) : (
          <table className="fa-fuel-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Organization</th>
                <th>Vehicle</th>
                <th>Uploaded by</th>
                <th>Fuel</th>
                <th>Type</th>
                <th>Litres</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Odometer</th>
                <th>Location</th>
                <th>Review</th>
                <th>Photos</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{formatDateTimeIST(log.refuelTime)}</td>
                  <td style={{ fontWeight: 500 }}>{log.orgId?.companyName || 'Unknown'}</td>
                  <td style={{ fontWeight: 500 }}>{log.vehicleId?.registrationNumber || '-'}</td>
                  <td>
                    <span className="fa-fuel-agent">{agentName(log.loggedBy)}</span>
                    {log.loggedBy?.role && <span className="fa-fuel-role">{log.loggedBy.role}</span>}
                  </td>
                  <td>{log.fuelType || '-'}</td>
                  <td>{log.fillingType || '-'}</td>
                  <td>{fmtNum(log.litres)}</td>
                  <td>{log.rate != null ? `₹${fmtNum(log.rate)}` : '-'}</td>
                  <td>{log.totalAmount != null ? fmtMoney(log.totalAmount) : '-'}</td>
                  <td>
                    {log.odometerReading != null ? fmtNum(log.odometerReading, 0) : '-'}
                    {log.odometerSource && log.odometerSource !== 'NONE' && (
                      <span className="fa-fuel-src">{log.odometerSource}</span>
                    )}
                  </td>
                  <td>{log.location || '-'}</td>
                  <td>
                    <span
                      className={`fa-fuel-badge ${
                        log.reviewStatus === 'NEEDS_REVIEW' ? 'fa-fuel-badge-warn' : 'fa-fuel-badge-ok'
                      }`}
                      title={(log.reviewReasons || []).join(', ')}
                    >
                      {log.reviewStatus === 'NEEDS_REVIEW' ? 'Needs review' : 'OK'}
                    </span>
                  </td>
                  <td className="fa-fuel-photos">
                    {log.fuelSlipUrl ? (
                      <a href={log.fuelSlipUrl} target="_blank" rel="noreferrer">
                        Slip
                      </a>
                    ) : (
                      <span className="fa-fuel-muted">-</span>
                    )}
                    {log.odometerUrl && (
                      <a href={log.odometerUrl} target="_blank" rel="noreferrer">
                        Odo
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && meta.totalPages > 1 && (
        <div className="fa-fuel-pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
      </PageShell>
    </div>
  );
};

export default FieldAgentFuelPage;
