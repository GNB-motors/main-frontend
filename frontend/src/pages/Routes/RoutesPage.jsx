/**
 * Routes Management Page
 * Manage all routes with add, edit, delete, and status toggle functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Activity } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import RouteService from './RouteService';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { useConfirm } from '../../components/ui/confirmContext';
import './RoutesPage.css';

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Route Name' },
  { key: 'sourceCity', label: 'Source' },
  { key: 'destCity', label: 'Destination' },
  { key: 'distanceKm', label: 'Distance (km)', type: 'number' },
  { key: 'status', label: 'Status' },
];

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });

  const fetchRoutes = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await RouteService.getRoutes({ page, limit: 10, search });
      setRoutes(response.data || []);
      setMeta(response.meta || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (error) {
      const errorMsg = error?.message || error?.detail || 'Failed to fetch routes';
      toast.error(errorMsg);
      console.error('Fetch routes error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes(1, '');
  }, [fetchRoutes]);

  const handleSearchChange = useCallback(
    (value) => {
      setSearchTerm(value);
      fetchRoutes(1, value);
    },
    [fetchRoutes],
  );

  const openEditPage = useCallback(
    (route) => {
      navigate('/routes/add', { state: { editingRoute: route } });
    },
    [navigate],
  );

  const handleDeleteRoute = useCallback(
    async (route) => {
      const ok = await confirm({
        title: 'Delete this route?',
        body: `"${route.name}" will be permanently removed. This action cannot be undone.`,
        confirmLabel: 'Delete route',
        danger: true,
      });
      if (!ok) return;
      try {
        await RouteService.deleteRoute(route._id);
        toast.success('Route deleted successfully');
        fetchRoutes(meta.page, searchTerm);
      } catch (error) {
        toast.error(error?.message || 'Failed to delete route');
      }
    },
    [confirm, fetchRoutes, meta.page, searchTerm],
  );

  const handleToggleStatus = useCallback(
    async (route) => {
      try {
        const newStatus = route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await RouteService.updateRouteStatus(route._id, newStatus);
        toast.success(`Route ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
        fetchRoutes(meta.page, searchTerm);
      } catch (error) {
        toast.error(error?.message || 'Failed to update route status');
      }
    },
    [fetchRoutes, meta.page, searchTerm],
  );

  const exportRows = routes.map((route) => ({
    name: route.name,
    sourceCity: `${route.sourceLocation.city}, ${route.sourceLocation.state}`,
    destCity: `${route.destLocation.city}, ${route.destLocation.state}`,
    distanceKm: route.distanceKm,
    status: route.status,
  }));

  const columns = [
    { key: 'name', label: 'Route Name', render: (route) => route.name },
    {
      key: 'source',
      label: 'Source',
      render: (route) => (
        <div className="location-info">
          <strong>
            {route.sourceLocation.city}, {route.sourceLocation.state}
          </strong>
          <span className="location-address">{route.sourceLocation.address}</span>
        </div>
      ),
    },
    {
      key: 'destination',
      label: 'Destination',
      render: (route) => (
        <div className="location-info">
          <strong>
            {route.destLocation.city}, {route.destLocation.state}
          </strong>
          <span className="location-address">{route.destLocation.address}</span>
        </div>
      ),
    },
    {
      key: 'distanceKm',
      label: 'Distance (KM)',
      align: 'right',
      render: (route) => `${route.distanceKm} km`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (route) => (
        <button
          type="button"
          className={`status-badge ${route.status.toLowerCase()}`}
          onClick={() => handleToggleStatus(route)}
          title={`Click to ${route.status === 'ACTIVE' ? 'deactivate' : 'activate'}`}
        >
          <Activity size={14} />
          {route.status}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (route) => (
        <div className="actions-cell">
          <button
            type="button"
            className="btn-icon edit"
            onClick={() => openEditPage(route)}
            title="Edit route"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="btn-icon delete"
            onClick={() => handleDeleteRoute(route)}
            title="Delete route"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="routes-page">
      <PageShell
        title="Routes Management"
        count={meta.total}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              rows={exportRows}
              columns={EXPORT_COLUMNS}
              filename="routes"
              disabled={!routes.length}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate('/routes/add')}
            >
              <Plus size={18} />
              Add Route
            </button>
          </div>
        }
        filters={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search routes by name, source, or destination…"
          />
        }
        footer={
          meta.totalPages > 1
            ? `Page ${meta.page} of ${meta.totalPages} · ${meta.total} routes`
            : null
        }
      >
        <DataTable
          columns={columns}
          rows={routes}
          rowKey={(route) => route._id}
          loading={loading}
          showing={routes.length}
          total={meta.total}
          emptyTitle="No routes found"
          emptyAction={
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate('/routes/add')}
            >
              Create your first route
            </button>
          }
        />

        {meta.totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              disabled={meta.page === 1}
              onClick={() => fetchRoutes(meta.page - 1, searchTerm)}
            >
              Previous
            </button>
            <span>
              {meta.page} of {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={meta.page === meta.totalPages}
              onClick={() => fetchRoutes(meta.page + 1, searchTerm)}
            >
              Next
            </button>
          </div>
        )}
      </PageShell>
    </div>
  );
};

export default RoutesPage;
