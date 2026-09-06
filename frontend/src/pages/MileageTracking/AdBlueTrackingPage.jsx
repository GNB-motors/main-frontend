import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import '../PageStyles.css';
import '../Trip/RefuelLogsPage.css';
import './AdBlueTrackingPage.css';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import DocumentService from '../Trip/services/DocumentService';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ChevronIcon from '../Trip/assets/ChevronIcon.jsx';
import { mapAdBlueLogResponse, generateAdBluePageNumbers } from './adBlueTrackingLogic';
import { buildAdBlueTrackingColumns } from './adBlueTrackingColumns';
import AdBlueTrackingModals from './AdBlueTrackingModals';

const PAGE_SIZE = 10;

const fetchAdBlueLogs = async ({ page = 1, limit = PAGE_SIZE, search, signal } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  const response = await apiClient.get('/api/adblue-logs', { params, signal });
  if (response.data.status === 'success') {
    const mapped = mapAdBlueLogResponse(response.data.data);
    return { logs: mapped, total: response.data.meta?.total ?? mapped.length };
  }
  return { logs: [], total: 0 };
};

const AdBlueTrackingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [logs, setLogs] = useState([]);
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
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const {
    data: logsResult,
    loading,
    error: logsLoadError,
    refetch: refetchLogs,
  } = useApi(
    (signal) =>
      fetchAdBlueLogs({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        signal,
      }),
    [JSON.stringify({ page: pagination.page, search: debouncedSearch })],
  );

  useEffect(() => {
    if (logsResult) {
      setLogs(logsResult.logs);
      setPagination((p) => ({ ...p, total: logsResult.total }));
      setError(null);
    }
  }, [logsResult]);

  useEffect(() => {
    if (logsLoadError) {
      setError(logsLoadError.response?.data?.message || 'Failed to load AdBlue logs');
      setLogs([]);
    }
  }, [logsLoadError]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setPagination((p) => ({ ...p, page }));
  };

  const handleEditClick = (log) => {
    setEditingLog(log);
    setEditForm({
      litres: log.litres ?? '',
      amount: log.amount ?? '',
      place: log.place === '-' ? '' : log.place || '',
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
      refetchLogs();
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
      refetchLogs();
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

  const columns = buildAdBlueTrackingColumns({
    viewImageLoading,
    onView: handleViewDocument,
    onEdit: handleEditClick,
    onDelete: setDeletingLog,
  });

  return (
    <div className="refuel-logs-page adblue-tracking-page">
      <PageShell
        title="AdBlue"
        filters={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search vehicle, driver, or place"
          />
        }
      >
        <DataTable
          columns={columns}
          rows={logs}
          rowKey={(log) => log.id}
          loading={loading}
          error={!loading && error ? error : null}
          onRetry={refetchLogs}
          emptyTitle="No AdBlue entries found"
          emptyHint={searchTerm ? 'Try adjusting your search' : null}
          emptyAction={
            !searchTerm ? (
              <button
                type="button"
                className="refuel-empty-action-btn"
                onClick={() => navigate('/adblue-tracking/new')}
              >
                <PlusCircle size={18} /> Log AdBlue
              </button>
            ) : null
          }
        />

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
            {generateAdBluePageNumbers(totalPages, pagination.page).map((page, index) =>
              page === '...' ? (
                <div key={`overflow-${index}`} className="refuel-page-overflow">
                  <span>...</span>
                </div>
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
              ),
            )}
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

        <AdBlueTrackingModals
          editingLog={editingLog}
          editForm={editForm}
          setEditForm={setEditForm}
          submitting={submitting}
          onEditClose={() => setEditingLog(null)}
          onEditSubmit={handleEditSubmit}
          deletingLog={deletingLog}
          onDeleteClose={() => setDeletingLog(null)}
          onDeleteConfirm={handleDeleteConfirm}
          viewImageUrl={viewImageUrl}
          onViewImageClose={() => setViewImageUrl(null)}
        />
      </PageShell>
    </div>
  );
};

export default AdBlueTrackingPage;
