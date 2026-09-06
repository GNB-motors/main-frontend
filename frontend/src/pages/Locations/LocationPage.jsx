/**
 * Location Management Page
 * Manage all locations (source/destination) with CRUD functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LocationService from './LocationService';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { useConfirm } from '../../components/ui/confirmContext';
import './LocationPage.css';

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'address', label: 'Address' },
  { key: 'cityState', label: 'City / State' },
];

const LocationPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });

  const fetchLocations = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await LocationService.getLocations({ page, limit: 10, search });
      if (response && response.results) {
        setLocations(response.results);
        setMeta({
          total: response.totalResults,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
        });
      } else if (Array.isArray(response)) {
        setLocations(response);
        setMeta({ total: response.length, page: 1, limit: response.length, totalPages: 1 });
      } else {
        setLocations(response.data || []);
        setMeta(response.meta || { total: 0, page: 1, limit: 10, totalPages: 0 });
      }
    } catch (error) {
      const errorMsg = error?.message || 'Failed to fetch locations';
      toast.error(errorMsg);
      console.error('Fetch locations error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations(1, '');
  }, [fetchLocations]);

  const handleSearchChange = useCallback(
    (value) => {
      setSearchTerm(value);
      fetchLocations(1, value);
    },
    [fetchLocations],
  );

  const openEditPage = useCallback(
    (location) => {
      navigate('/locations/add', { state: { editingLocation: location } });
    },
    [navigate],
  );

  const handleDeleteLocation = useCallback(
    async (location) => {
      const ok = await confirm({
        title: 'Delete this pump location?',
        body: `"${location.name}" will be permanently removed. This action cannot be undone.`,
        confirmLabel: 'Delete location',
        danger: true,
      });
      if (!ok) return;
      try {
        await LocationService.deleteLocation(location._id || location.id);
        toast.success('Location deleted successfully');
        fetchLocations(meta.page, searchTerm);
      } catch (error) {
        toast.error(error?.message || 'Failed to delete location');
      }
    },
    [confirm, fetchLocations, meta.page, searchTerm],
  );

  const exportRows = locations.map((loc) => ({
    name: loc.name,
    pincode: loc.pincode || '',
    address: loc.address,
    cityState: [loc.city, loc.state].filter(Boolean).join(', '),
  }));

  const columns = [
    { key: 'name', label: 'Name', render: (loc) => loc.name },
    { key: 'pincode', label: 'Pincode', render: (loc) => loc.pincode || '-' },
    {
      key: 'address',
      label: 'Address',
      render: (loc) => (
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: 14, color: '#121214' }}>{loc.address}</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {loc.city}
            {loc.city && loc.state ? ', ' : ''}
            {loc.state}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (loc) => (
        <div className="actions-cell">
          <button
            type="button"
            className="btn-icon edit"
            onClick={() => openEditPage(loc)}
            title="Edit pump location"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="btn-icon delete"
            onClick={() => handleDeleteLocation(loc)}
            title="Delete pump location"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="location-page">
      <PageShell
        title="Pump Location Management"
        count={meta.total}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              rows={exportRows}
              columns={EXPORT_COLUMNS}
              filename="pump-locations"
              disabled={!locations.length}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate('/locations/add')}
            >
              <Plus size={18} />
              Add Pump Location
            </button>
          </div>
        }
        filters={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search pump locations by name, city…"
          />
        }
        footer={
          meta.totalPages > 1
            ? `Page ${meta.page} of ${meta.totalPages} · ${meta.total} locations`
            : null
        }
      >
        <DataTable
          columns={columns}
          rows={locations}
          rowKey={(loc) => loc._id || loc.id}
          loading={loading}
          showing={locations.length}
          total={meta.total}
          emptyTitle="No pump locations found"
          emptyAction={
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate('/locations/add')}
            >
              Create your first pump location
            </button>
          }
        />

        {meta.totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              disabled={meta.page === 1}
              onClick={() => fetchLocations(meta.page - 1, searchTerm)}
            >
              Previous
            </button>
            <span>
              {meta.page} of {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={meta.page === meta.totalPages}
              onClick={() => fetchLocations(meta.page + 1, searchTerm)}
            >
              Next
            </button>
          </div>
        )}
      </PageShell>
    </div>
  );
};

export default LocationPage;
