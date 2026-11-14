import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Building,
} from 'lucide-react';
import {
  ReportsApprovalAdminService,
  REPORTS_APPROVAL_CHANGED_EVENT,
} from './ReportsApprovalAdminService';
import { getUserRole } from '../../../../utils/session';
import { formatInIST } from '../../../../utils/dateUtils';
import './ReportsApproval.css';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'GENERAL', label: 'General Fleet' },
  { value: 'FUEL', label: 'Fuel Management' },
  { value: 'DRIVER', label: 'Driver Analytics' },
  { value: 'TRIP', label: 'Trips & Mileage' },
  { value: 'ADBLUE', label: 'AdBlue Telemetry' },
  { value: 'COMPLIANCE', label: 'Vehicle Compliance' },
];

export default function ReportsApprovalPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Verify Super Admin access
  useEffect(() => {
    const role = getUserRole();
    if (role !== 'SUPER_ADMIN') {
      navigate('/profile');
    }
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, summaryRes] = await Promise.all([
        ReportsApprovalAdminService.list({
          page,
          limit: 15,
          status: statusFilter,
          category: categoryFilter,
          search: search.trim() || undefined,
        }),
        ReportsApprovalAdminService.summary(),
      ]);

      setReports(listRes?.items || []);
      setTotalPages(listRes?.pagination?.totalPages || 1);
      setTotalItems(listRes?.pagination?.total || 0);
      setSummary(summaryRes || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      setError(err?.message || 'Failed to load report submissions.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for changes from review actions
  useEffect(() => {
    const handler = () => {
      loadData();
    };
    window.addEventListener(REPORTS_APPROVAL_CHANGED_EVENT, handler);
    return () => window.removeEventListener(REPORTS_APPROVAL_CHANGED_EVENT, handler);
  }, [loadData]);

  const handleReviewClick = (report) => {
    const id = report._id || report.id;
    navigate(`/superadmin/reports-approval/${id}`, { state: { report } });
  };

  return (
    <div className="ra-page">
      {/* Page Title */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Custom Reports Approval</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centrally review, approve, or reject custom reports submitted by fleet users across all organizations.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary-action !text-xs !py-1.5 flex items-center gap-1.5"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="ra-kpis">
        <button
          type="button"
          className={`ra-kpi kpi-pending ${statusFilter === 'PENDING' ? 'is-active' : ''}`}
          onClick={() => {
            setStatusFilter('PENDING');
            setPage(1);
          }}
        >
          <span className="ra-kpi-label">Pending Review</span>
          <span className="ra-kpi-value">{summary.pending ?? 0}</span>
          <span className="ra-kpi-hint">Awaiting Super Admin decision</span>
        </button>

        <button
          type="button"
          className={`ra-kpi kpi-approved ${statusFilter === 'APPROVED' ? 'is-active' : ''}`}
          onClick={() => {
            setStatusFilter('APPROVED');
            setPage(1);
          }}
        >
          <span className="ra-kpi-label">Approved Reports</span>
          <span className="ra-kpi-value">{summary.approved ?? 0}</span>
          <span className="ra-kpi-hint">Active and runnable by users</span>
        </button>

        <button
          type="button"
          className={`ra-kpi kpi-rejected ${statusFilter === 'REJECTED' ? 'is-active' : ''}`}
          onClick={() => {
            setStatusFilter('REJECTED');
            setPage(1);
          }}
        >
          <span className="ra-kpi-label">Rejected Reports</span>
          <span className="ra-kpi-value">{summary.rejected ?? 0}</span>
          <span className="ra-kpi-hint">Changes requested or declined</span>
        </button>

        <button
          type="button"
          className={`ra-kpi ${statusFilter === 'ALL' ? 'is-active' : ''}`}
          onClick={() => {
            setStatusFilter('ALL');
            setPage(1);
          }}
        >
          <span className="ra-kpi-label">All Submissions</span>
          <span className="ra-kpi-value">{summary.total ?? 0}</span>
          <span className="ra-kpi-hint">Total reports configured</span>
        </button>
      </div>

      {/* Card with Filters & Table */}
      <div className="ra-card">
        {/* Toolbar */}
        <div className="ra-toolbar">
          <div className="ra-filters">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="builder-select !text-xs !py-1.5 !w-auto"
              aria-label="Filter by Status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="builder-select !text-xs !py-1.5 !w-auto"
              aria-label="Filter by Category"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ra-search-wrapper">
            <Search size={14} className="ra-search-icon" />
            <input
              type="text"
              className="ra-search-input"
              placeholder="Search reports or submitters..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label="Search reports"
            />
          </div>
        </div>

        {/* Content Table / Empty / Loading */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-slate-400" />
            <span>Loading submitted reports...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">
            <p>{error}</p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-blue-600 underline"
              onClick={loadData}
            >
              Retry
            </button>
          </div>
        ) : !reports.length ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-2">
            <FileText size={36} className="text-slate-300" />
            <h4 className="font-semibold text-slate-700 text-sm">No report submissions found</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {statusFilter !== 'ALL'
                ? `There are currently no reports with status "${statusFilter}".`
                : 'No custom reports have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ra-table">
              <thead>
                <tr>
                  <th>Report Details</th>
                  <th>Organization</th>
                  <th>Submitted By</th>
                  <th>Dataset</th>
                  <th>Fields</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const id = report._id || report.id;
                  const status = report.status || 'PENDING';
                  const orgName = report.orgId?.companyName || '—';
                  const submitterName = report.createdBy
                    ? `${report.createdBy.firstName || ''} ${report.createdBy.lastName || ''}`.trim()
                    : '—';
                  const submitterEmail = report.createdBy?.email || '';

                  return (
                    <tr key={id}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{report.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {report.category || 'GENERAL'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Building size={13} className="text-slate-400 shrink-0" />
                          <span className="font-medium">{orgName}</span>
                        </div>
                      </td>

                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{submitterName}</span>
                          <span className="text-[11px] text-slate-400">{submitterEmail}</span>
                        </div>
                      </td>

                      <td>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-600">
                          {report.dataset}
                        </span>
                      </td>

                      <td>
                        <span className="text-xs text-slate-600">
                          {report.fields?.length || 0} columns
                        </span>
                      </td>

                      <td>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {formatInIST(report.createdAt, 'DD MMM YYYY')}
                        </span>
                      </td>

                      <td>
                        <span className={`status-badge ${status.toLowerCase()}`}>
                          {status === 'PENDING'
                            ? 'Pending Review'
                            : status === 'APPROVED'
                              ? 'Approved'
                              : 'Rejected'}
                        </span>
                      </td>

                      <td className="text-right">
                        <button
                          type="button"
                          className={status === 'PENDING' ? 'ra-btn-review' : 'ra-btn-view'}
                          onClick={() => handleReviewClick(report)}
                          aria-label={status === 'PENDING' ? `Review ${report.name}` : `View details for ${report.name}`}
                        >
                          <Eye size={13} />
                          <span>{status === 'PENDING' ? 'Review' : 'View Details'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && reports.length > 0 && (
          <div className="ra-pagination">
            <span>
              Showing {reports.length} of {totalItems} submissions
            </span>
            <div className="ra-page-btns">
              <button
                type="button"
                className="ra-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-medium text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="ra-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next Page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

