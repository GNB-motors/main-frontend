import { formatDateIST, toISTDateString, toISTTimeString } from '../../utils/dateUtils';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, PlusCircle, Pencil, Trash2, X, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import '../PageStyles.css';
import '../Trip/RefuelLogsPage.css';
import './AdBlueTrackingPage.css';
import apiClient from '../../utils/axiosConfig';
import ChevronIcon from '../Trip/assets/ChevronIcon.jsx';
import DocumentService from '../Trip/services/DocumentService';

const PAGE_SIZE = 10;

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const fetchAdBlueLogs = async ({ page = 1, limit = PAGE_SIZE, search } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  const response = await apiClient.get('/api/adblue-logs', { params });
  if (response.data.status === 'success') {
    const mapped = (response.data.data || []).map((log) => ({
      id: log._id,
      date: log.filledAt ? toISTDateString(log.filledAt) : null,
      time: log.filledAt ? toISTTimeString(log.filledAt) : null,
      filledAt: log.filledAt,
      vehicleNo: log.vehicleId?.registrationNumber || '-',
      vehicleModel: log.vehicleId?.vehicleType || '-',
      driverName: log.driverId
        ? `${log.driverId.firstName || ''} ${log.driverId.lastName || ''}`.trim() || '-'
        : '-',
      place: log.place || '-',
      litres: log.litres,
      amount: log.amount,
      documentId: log.documentId?._id || log.documentId || null,
    }));
    return { logs: mapped, total: response.data.meta?.total ?? mapped.length };
  }
  return { logs: [], total: 0 };
};

const AdBlueTrackingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [editingLog, setEditingLog] = useState(null);
  const [editForm, setEditForm] = useState({ litres: '', amount: '', place: '' });
  const [deletingLog, setDeletingLog] = useState(null);
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const [viewImageLoading, setViewImageLoading] = useState(false);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { logs: rows, total } = await fetchAdBlueLogs({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
      });
      setLogs(rows);
      setPagination((p) => ({ ...p, total }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load AdBlue logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [pagination.page, debouncedSearch]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setPagination((p) => ({ ...p, page }));
  };

  const generatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pagination.page > 3) pages.push('...');
      for (let i = Math.max(2, pagination.page - 1); i <= Math.min(totalPages - 1, pagination.page + 1); i++) {
        if (i !== 1 && i !== totalPages) pages.push(i);
      }
      if (pagination.page < totalPages - 2) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  const handleEditClick = (log) => {
    setEditingLog(log);
    setEditForm({
      litres: log.litres ?? '',
      amount: log.amount ?? '',
      place: log.place === '-' ? '' : (log.place || ''),
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/api/adblue-logs/${editingLog.id}`, {
        litres: parseFloat(editForm.litres),
        amount: parseFloat(editForm.amount),
        place: editForm.place?.trim() || null,
      });
      toast.success('AdBlue entry updated');
      setEditingLog(null);
      await loadLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update AdBlue entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLog) return;
    setSubmitting(true);
    try {
      await apiClient.delete(`/api/adblue-logs/${deletingLog.id}`);
      toast.success('AdBlue entry deleted');
      setDeletingLog(null);
      await loadLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete AdBlue entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = async (log) => {
    if (!log.documentId) return;
    setViewImageLoading(true);
    try {
      const doc = await DocumentService.getDocument(log.documentId);
      const url = doc?.data?.publicUrl || doc?.publicUrl || doc?.data?.fileKey || doc?.fileKey;
      if (url) setViewImageUrl(url);
      else toast.error('Image URL not found for this document');
    } catch {
      toast.error('Failed to load document');
    } finally {
      setViewImageLoading(false);
    }
  };

  return (
    <div className="refuel-logs-page adblue-tracking-page">
      <div className="refuel-logs-header">
        <h3 className="refuel-report-title">AdBlue</h3>
        <div className="refuel-header-actions">
          <div className="refuel-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search vehicle, driver, or place"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="refuel-table-container">
        <table className="refuel-table adblue-table">
          <colgroup>
            <col className="adblue-col-date" />
            <col className="adblue-col-vehicle" />
            <col className="adblue-col-driver" />
            <col className="adblue-col-place" />
            <col className="adblue-col-litres" />
            <col className="adblue-col-amount" />
            <col className="adblue-col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Place</th>
              <th>Litres</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="refuel-empty-state">Loading AdBlue logs...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="refuel-empty-state">{error}</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="refuel-empty-state">
                  <div className="refuel-empty-state-inner">
                    <FileText size={48} color="#9ca3af" />
                    <p>No AdBlue entries found</p>
                    {searchTerm ? (
                      <p className="refuel-empty-subtext">Try adjusting your search</p>
                    ) : (
                      <button
                        type="button"
                        className="refuel-empty-action-btn"
                        onClick={() => navigate('/adblue-tracking/new')}
                      >
                        <PlusCircle size={18} /> Log AdBlue
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const timestamp = log.date ? `${log.date}${log.time ? `T${log.time}` : ''}` : null;
                const formattedDate = timestamp ? formatDateIST(timestamp) : formatDateIST(log.date);
                return (
                  <tr key={log.id}>
                    <td>
                      <div className="cell-primary">{formattedDate || '-'}</div>
                      <div className="cell-secondary">{log.time || '-'}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.vehicleNo}</div>
                      <div className="cell-secondary">{log.vehicleModel}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.driverName}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.place}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.litres ?? '-'}</div>
                      <div className="cell-secondary">Litres</div>
                    </td>
                    <td>{formatCurrency(log.amount)}</td>
                    <td>
                      <div className="refuel-actions">
                        {log.documentId && (
                          <button
                            type="button"
                            className="refuel-action-btn"
                            title="View Proof"
                            style={{ color: '#2563eb' }}
                            onClick={() => handleViewDocument(log)}
                            disabled={viewImageLoading}
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="refuel-action-btn edit"
                          title="Edit"
                          onClick={() => handleEditClick(log)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="refuel-action-btn delete"
                          title="Delete"
                          onClick={() => setDeletingLog(log)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && pagination.total > 0 && (
        <div className="refuel-pagination-controls">
          <button
            type="button"
            className="refuel-pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || totalPages <= 1}
          >
            <ChevronIcon size={12} style={{ transform: 'rotate(90deg)' }} />
          </button>
          {generatePageNumbers().map((page, index) => (
            page === '...' ? (
              <div key={`overflow-${index}`} className="refuel-page-overflow"><span>...</span></div>
            ) : (
              <button
                key={page}
                type="button"
                className={`refuel-page-number ${pagination.page === page ? 'refuel-page-number-current' : ''}`}
                onClick={() => handlePageChange(page)}
                disabled={totalPages <= 1}
              >
                <span>{page}</span>
              </button>
            )
          ))}
          <button
            type="button"
            className="refuel-pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages || totalPages <= 1}
          >
            <ChevronIcon size={12} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      )}

      {editingLog && createPortal(
        <div className="refuel-modal-overlay" onClick={() => setEditingLog(null)}>
          <div className="refuel-modal refuel-edit-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="refuel-modal-header">
              <h2>Edit AdBlue Entry</h2>
              <button type="button" className="refuel-modal-close" onClick={() => setEditingLog(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="refuel-modal-body">
                <div className="refuel-form-row">
                  <div className="form-group">
                    <label>Litres *</label>
                    <input type="number" step="any" value={editForm.litres} onChange={(e) => setEditForm({ ...editForm, litres: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Amount *</label>
                    <input type="number" step="any" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Place</label>
                  <input type="text" value={editForm.place} onChange={(e) => setEditForm({ ...editForm, place: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div className="refuel-modal-footer">
                <button type="button" className="refuel-btn-secondary" onClick={() => setEditingLog(null)}>Cancel</button>
                <button type="submit" className="refuel-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {deletingLog && createPortal(
        <div className="refuel-modal-overlay" onClick={() => setDeletingLog(null)}>
          <div className="refuel-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="refuel-modal-header">
              <h2>Delete AdBlue Entry</h2>
              <button type="button" className="refuel-modal-close" onClick={() => setDeletingLog(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="refuel-modal-body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertTriangle size={22} color="#dc2626" />
                <p style={{ margin: 0, color: '#475569' }}>
                  Delete AdBlue entry for <strong>{deletingLog.vehicleNo}</strong>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="refuel-modal-footer">
              <button type="button" className="refuel-btn-secondary" onClick={() => setDeletingLog(null)}>Cancel</button>
              <button type="button" className="refuel-btn-danger" onClick={handleDeleteConfirm} disabled={submitting}>
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {viewImageUrl && createPortal(
        <div className="refuel-modal-overlay" onClick={() => setViewImageUrl(null)}>
          <div className="refuel-modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="refuel-modal-header">
              <h2>AdBlue Proof</h2>
              <button type="button" className="refuel-modal-close" onClick={() => setViewImageUrl(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="refuel-modal-body" style={{ textAlign: 'center' }}>
              <img src={viewImageUrl} alt="AdBlue receipt" style={{ maxWidth: '100%', borderRadius: 8 }} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default AdBlueTrackingPage;
