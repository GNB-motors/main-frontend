import { useState, useEffect, useCallback, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import PageShell from '../../../components/ui/PageShell';
import FilterBar from '../../../components/ui/FilterBar';
import DataTable from '../../../components/ui/DataTable';
import apiClient from '../../../utils/axiosConfig';
import useApi from '../../../hooks/useApi';
import { RefuelLogEditModal, RefuelLogDeleteModal } from './refuelLogsReportModals.jsx';
import { useRefuelLogsReportColumns } from './useRefuelLogsReportColumns.jsx';
import {
  PAGE_SIZE,
  TAB_TO_FUEL_TYPE,
  FILTER_CHIPS,
  toDatetimeLocal,
  fromDatetimeLocal,
  mapRawLog,
} from './refuelLogsReportUtils.js';
import '../../Trip/RefuelLogsPage.css';
import '../../../components/JourneySetupModal/modal.css';

const fetchRefuelLogs = async ({ page = 1, limit = PAGE_SIZE, fuelType, search, signal } = {}) => {
  const params = { page, limit };
  if (fuelType) params.fuelType = fuelType;
  if (search) params.search = search;
  const response = await apiClient.get('api/fuel-logs', { params, signal });
  if (response.data.status === 'success') {
    const mapped = (response.data.data || []).map(mapRawLog);
    const total = response.data.meta?.total ?? mapped.length;
    return { logs: mapped, total };
  }
  return { logs: [], total: 0 };
};

const updateFuelLog = async (id, data) => {
  const response = await apiClient.put(`api/mileage/fuel-log/${id}`, data);
  return response.data;
};

const deleteFuelLog = async (id) => {
  const response = await apiClient.delete(`api/mileage/fuel-log/${id}`);
  return response.data;
};

const RefuelLogsReport = () => {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });

  const [editingLog, setEditingLog] = useState(null);
  const [editForm, setEditForm] = useState({
    fuelType: 'DIESEL',
    fillingType: 'PARTIAL',
    litres: '',
    rate: '',
    odometerReading: '',
    location: '',
    refuelTime: '',
  });
  const [deletingLog, setDeletingLog] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchTerm.trim());
        setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }));
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: logsResponse,
    loading,
    error: logsError,
    refetch: refetchLogs,
  } = useApi(
    (signal) =>
      fetchRefuelLogs({
        page: pagination.page,
        limit: pagination.limit,
        fuelType: TAB_TO_FUEL_TYPE[activeTab],
        search: debouncedSearch,
        signal,
      }),
    [
      JSON.stringify({
        page: pagination.page,
        limit: pagination.limit,
        activeTab,
        debouncedSearch,
      }),
    ],
  );

  useEffect(() => {
    if (logsResponse) {
      setError(null);
      setLogs(logsResponse.logs);
      setPagination((p) => ({ ...p, total: logsResponse.total }));
    }
  }, [logsResponse]);

  useEffect(() => {
    if (logsError) {
      setError('Failed to load refuel logs');
    }
  }, [logsError]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPagination((p) => ({ ...p, page }));
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleEditClick = useCallback((log) => {
    setEditingLog(log);
    setEditForm({
      fuelType: log.rawFuelType || 'DIESEL',
      fillingType: log.rawFillingType || 'PARTIAL',
      litres: log.rawLitres ?? '',
      rate: log.rawRate ?? '',
      odometerReading: log.rawOdometer ?? '',
      location: log.rawLocation || '',
      refuelTime: toDatetimeLocal(log.refuelTime),
    });
  }, []);

  const handleEditClose = () => {
    setEditingLog(null);
    setSubmitting(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    const payload = {
      fuelType: editForm.fuelType,
      fillingType: editForm.fillingType,
      litres: editForm.litres !== '' ? Number(editForm.litres) : undefined,
      rate: editForm.rate !== '' ? Number(editForm.rate) : undefined,
      odometerReading:
        editForm.odometerReading !== '' ? Number(editForm.odometerReading) : undefined,
      location: editForm.location || undefined,
      refuelTime: fromDatetimeLocal(editForm.refuelTime) || undefined,
    };
    setSubmitting(true);
    try {
      await updateFuelLog(editingLog.id, payload);
      toast.success('Fuel log updated successfully');
      handleEditClose();
      refetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update fuel log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = useCallback((log) => {
    setDeletingLog(log);
  }, []);

  const handleDeleteClose = () => {
    setDeletingLog(null);
    setSubmitting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLog) return;
    setSubmitting(true);
    try {
      await deleteFuelLog(deletingLog.id);
      toast.success('Fuel log deleted successfully');
      handleDeleteClose();
      refetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete fuel log');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useRefuelLogsReportColumns({
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
  });

  const renderPageItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - pagination.page) <= 1) {
        items.push(i);
      } else if (items[items.length - 1] !== '...') {
        items.push('...');
      }
    }
    return items;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setActiveTab('all');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + (activeTab !== 'all' ? 1 : 0);

  return (
    <PageShell
      className="p-6"
      title="Refuel Logs"
      subtitle="Complete refuel log history across vehicles, drivers, and fuel types"
      count={pagination.total}
      actions={
        <button
          type="button"
          className="pshell-btn pshell-btn--primary flex items-center gap-1.5"
          onClick={() => navigate('/mileage-tracking/new')}
        >
          <PlusCircle size={15} /> Add Refuel Log
        </button>
      }
      filters={
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search vehicle, driver, or location…"
          chips={FILTER_CHIPS}
          selectedKeys={[activeTab]}
          onToggleChip={handleTabChange}
          activeCount={activeFiltersCount}
          onClear={clearFilters}
        />
      }
      footer={
        totalPages > 1 ? (
          <div className="flex w-full items-center justify-between">
            <span className="text-dim text-xs">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => pagination.page > 1 && handlePageChange(pagination.page - 1)}
                    className={
                      pagination.page <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                {renderPageItems().map((item, idx) =>
                  item === '...' ? (
                    <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={pagination.page === item}
                        onClick={() => handlePageChange(item)}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      pagination.page < totalPages && handlePageChange(pagination.page + 1)
                    }
                    className={
                      pagination.page >= totalPages
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        <DataTable
          columns={columns}
          rows={logs}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={refetchLogs}
          showing={logs.length}
          total={pagination.total}
          emptyTitle="No refuel logs found"
          emptyHint={
            searchTerm || activeTab !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add your first refuel log to begin tracking.'
          }
          emptyAction={
            !searchTerm && activeTab === 'all' ? (
              <button
                type="button"
                className="pshell-btn pshell-btn--primary flex items-center gap-1"
                onClick={() => navigate('/mileage-tracking/new')}
              >
                <PlusCircle size={14} /> Add Refuel Log
              </button>
            ) : null
          }
        />

        <RefuelLogEditModal
          editingLog={editingLog}
          editForm={editForm}
          setEditForm={setEditForm}
          onClose={handleEditClose}
          onSubmit={handleEditSubmit}
          submitting={submitting}
        />

        <RefuelLogDeleteModal
          deletingLog={deletingLog}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          submitting={submitting}
        />
      </div>
    </PageShell>
  );
};

export default RefuelLogsReport;
