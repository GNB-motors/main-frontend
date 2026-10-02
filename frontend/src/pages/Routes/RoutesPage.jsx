/**
 * Routes Management Page
 * Manage all routes with add, edit, delete, and status toggle functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Activity, Compass } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';
import RouteService from './RouteService';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import RoutesMapPanel from './Component/RoutesMapPanel';
import { useConfirm } from '../../components/ui/confirmContext';
import { getUserRole } from '../../utils/session';
import './RoutesPage.css';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
  .replace(/['"]/g, '')
  .trim();
const GMAPS_LIBS = ['places', 'geometry'];

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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingRouteId, setUpdatingRouteId] = useState(null);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [hoveredRouteId, setHoveredRouteId] = useState(null);

  const userRole = (getUserRole() || '').toUpperCase();
  const canEditStatus = ['OWNER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);

  const { isLoaded: isScriptLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GMAPS_LIBS,
  });
  const isMapLoaded =
    isScriptLoaded || (typeof window !== 'undefined' && Boolean(window.google?.maps));

  const fetchRoutes = useCallback(async (page = 1, search = '', status = 'ALL') => {
    setLoading(true);
    try {
      const response = await RouteService.getRoutes({ page, limit: 10, search, status });
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
    fetchRoutes(1, '', 'ALL');
  }, [fetchRoutes]);

  const handleSearchChange = useCallback(
    (value) => {
      setSearchTerm(value);
      fetchRoutes(1, value, statusFilter);
    },
    [fetchRoutes, statusFilter],
  );

  const handleStatusFilterChange = useCallback(
    (value) => {
      setStatusFilter(value);
      fetchRoutes(1, searchTerm, value);
    },
    [fetchRoutes, searchTerm],
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
        fetchRoutes(meta.page, searchTerm, statusFilter);
      } catch (error) {
        toast.error(error?.message || 'Failed to delete route');
      }
    },
    [confirm, fetchRoutes, meta.page, searchTerm, statusFilter],
  );

  const handleToggleStatus = useCallback(
    async (route) => {
      if (!canEditStatus) {
        toast.error('You do not have permission to modify route status');
        return;
      }
      const newStatus = route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const prevStatus = route.status;
      setUpdatingRouteId(route._id);

      // Optimistically update local component state smoothly
      setRoutes((prev) => prev.map((r) => (r._id === route._id ? { ...r, status: newStatus } : r)));

      try {
        await RouteService.updateRouteStatus(route._id, newStatus);
        toast.success(`Route "${route.name}" marked as ${newStatus}`);
        if (statusFilter !== 'ALL' && statusFilter !== newStatus) {
          fetchRoutes(meta.page, searchTerm, statusFilter);
        }
      } catch (error) {
        // Revert local state on failure
        setRoutes((prev) =>
          prev.map((r) => (r._id === route._id ? { ...r, status: prevStatus } : r)),
        );
        toast.error(error?.message || error?.detail || 'Failed to update route status');
      } finally {
        setUpdatingRouteId(null);
      }
    },
    [canEditStatus, fetchRoutes, meta.page, searchTerm, statusFilter],
  );

  const handleDeriveGeometry = useCallback(
    async (route) => {
      try {
        toast.info(`Deriving geometry for "${route.name}" from fleet telemetry…`);
        const response = await RouteService.deriveGeometry(route._id);
        toast.success(
          `Geometry derived successfully from ${response.data?.geometry?.pointCount || ''} GPS fixes!`,
        );
        fetchRoutes(meta.page, searchTerm, statusFilter);
      } catch (error) {
        toast.error(
          error?.message ||
            error?.detail ||
            'No completed trips with recorded GPS tracks found for this route',
        );
      }
    },
    [fetchRoutes, meta.page, searchTerm, statusFilter],
  );

  const exportRows = routes.map((r) => ({
    name: r.name,
    sourceCity: r.sourceLocation?.city || '',
    destCity: r.destLocation?.city || '',
    distanceKm: r.distanceKm,
    status: r.status,
  }));

  const columns = [
    {
      key: 'name',
      label: 'Route Name',
      render: (route) => (
        <div className="location-info">
          <strong>{route.name}</strong>
          {!route.geometry?.encodedPolyline ? (
            <span className="location-address text-amber-600">Path not captured</span>
          ) : (
            <span className="text-[11px] text-sky-600 font-medium">
              {route.geometry.provider === 'DERIVED_FROM_TRACK'
                ? '✓ Learned from GPS Telemetry'
                : '✓ Directions Polyline'}
            </span>
          )}
        </div>
      ),
    },
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
      render: (route) => {
        const isActive = route.status === 'ACTIVE';
        const isUpdating = updatingRouteId === route._id;

        return (
          <div className="route-status-cell">
            <label
              className={`route-status-switch ${!canEditStatus ? 'disabled' : ''} ${
                isUpdating ? 'loading' : ''
              }`}
              title={
                canEditStatus
                  ? `Toggle status to ${isActive ? 'INACTIVE' : 'ACTIVE'}`
                  : 'Administrative permissions required to change route status'
              }
            >
              <input
                type="checkbox"
                checked={isActive}
                disabled={!canEditStatus || isUpdating}
                onChange={() => handleToggleStatus(route)}
                aria-label={`Toggle status for route ${route.name}`}
              />
              <span className="route-status-slider" />
            </label>
            <span
              className={`status-badge ${route.status.toLowerCase()}`}
              title={canEditStatus ? `Route is ${route.status}` : 'Status (read-only)'}
            >
              <Activity size={12} />
              {route.status}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (route) => (
        <div className="actions-cell">
          {!route.geometry?.encodedPolyline && (
            <button
              type="button"
              className="btn-icon text-sky-600 hover:text-sky-800"
              onClick={() => handleDeriveGeometry(route)}
              title="Derive geometry from completed trips telemetry"
            >
              <Compass size={16} />
            </button>
          )}
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
            right={
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status:
                </span>
                <select
                  className="fbar-select font-medium text-slate-700 cursor-pointer min-w-[130px]"
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  aria-label="Filter routes by status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            }
          />
        }
        footer={
          meta.totalPages > 1
            ? `Page ${meta.page} of ${meta.totalPages} · ${meta.total} routes`
            : null
        }
      >
        <RoutesMapPanel routes={routes} highlightedId={hoveredRouteId} isLoaded={isMapLoaded} />

        <DataTable
          columns={columns}
          rows={routes}
          rowKey={(route) => route._id}
          loading={loading}
          showing={routes.length}
          total={meta.total}
          onRowMouseEnter={(route) => setHoveredRouteId(route._id)}
          onRowMouseLeave={() => setHoveredRouteId(null)}
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
              onClick={() => fetchRoutes(meta.page - 1, searchTerm, statusFilter)}
            >
              Previous
            </button>
            <span>
              {meta.page} of {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={meta.page === meta.totalPages}
              onClick={() => fetchRoutes(meta.page + 1, searchTerm, statusFilter)}
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
