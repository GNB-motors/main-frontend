/**
 * Routes Management Page
 * Manage all routes with add, edit, delete, and status toggle functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Activity, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import RouteService from './RouteService';
import { useNavigate } from 'react-router-dom';
import './RoutesPage.css';

const RoutesPage = () => {
  // State
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });

  // Form state - matches backend API structure
  const [formData, setFormData] = useState({
    name: '',
    sourceLocation: { address: '', city: '', state: '', lat: null, lng: null },
    destLocation: { address: '', city: '', state: '', lat: null, lng: null },
    distanceKm: ''
  });

  // Fetch routes
  const fetchRoutes = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await RouteService.getRoutes({
        page,
        limit: 10,
        search
      });
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

  // Initial fetch
  useEffect(() => {
    fetchRoutes(1, '');
  }, [fetchRoutes]);

  // Handle search
  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchRoutes(1, value);
  }, [fetchRoutes]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      sourceLocation: { address: '', city: '', state: '', lat: null, lng: null },
      destLocation: { address: '', city: '', state: '', lat: null, lng: null },
      distanceKm: ''
    });
  }, []);

  // Handle form input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle location input change
  const handleLocationChange = useCallback((locationType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [locationType]: {
        ...prev[locationType],
        [field]: value
      }
    }));
  }, []);


  // Navigate to edit page
  const openEditPage = useCallback((route) => {
    navigate('/routes/add', { state: { editingRoute: route } });
  }, [navigate]);

  // Open delete modal
  const openDeleteModal = useCallback((route) => {
    setSelectedRoute(route);
    setShowDeleteModal(true);
  }, []);





  // Delete route
  const handleDeleteRoute = useCallback(async () => {
    try {
      await RouteService.deleteRoute(selectedRoute._id);
      toast.success('Route deleted successfully');
      setShowDeleteModal(false);
      setSelectedRoute(null);
      fetchRoutes(meta.page, searchTerm);
    } catch (error) {
      const errorMsg = error?.message || 'Failed to delete route';
      toast.error(errorMsg);
    }
  }, [selectedRoute, fetchRoutes, meta.page, searchTerm]);

  // Toggle status
  const handleToggleStatus = useCallback(async (route) => {
    try {
      const newStatus = route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await RouteService.updateRouteStatus(route._id, newStatus);
      toast.success(`Route ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      fetchRoutes(meta.page, searchTerm);
    } catch (error) {
      const errorMsg = error?.message || 'Failed to update route status';
      toast.error(errorMsg);
    }
  }, [fetchRoutes, meta.page, searchTerm]);

  return (
    <div className="routes-page">
      {/* Header */}
      <div className="routes-header">
        <h1>Routes Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/routes/add')}
        >
          <Plus size={18} />
          Add Route
        </button>
      </div>

      {/* Search Bar */}
      <div className="routes-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search routes by name, source, or destination..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Routes Table */}
      <div className="routes-container">
        {loading ? (
          <div className="loading-state">Loading routes...</div>
        ) : routes.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} />
            <p>No routes found</p>
            <button className="btn btn-primary" onClick={() => navigate('/routes/add')}>
              Create your first route
            </button>
          </div>
        ) : (
          <>
            <table className="routes-table">
              <thead>
                <tr>
                  <th>Route Name</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Distance (KM)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map(route => (
                  <tr key={route._id}>
                    <td className="route-name">{route.name}</td>
                    <td className="location-cell">
                      <div className="location-info">
                        <strong>{route.sourceLocation.city}, {route.sourceLocation.state}</strong>
                        <span className="location-address">{route.sourceLocation.address}</span>
                      </div>
                    </td>
                    <td className="location-cell">
                      <div className="location-info">
                        <strong>{route.destLocation.city}, {route.destLocation.state}</strong>
                        <span className="location-address">{route.destLocation.address}</span>
                      </div>
                    </td>
                    <td className="distance-cell">{route.distanceKm} km</td>
                    <td className="status-cell">
                      <button
                        className={`status-badge ${route.status.toLowerCase()}`}
                        onClick={() => handleToggleStatus(route)}
                        title={`Click to ${route.status === 'ACTIVE' ? 'deactivate' : 'activate'}`}
                      >
                        <Activity size={14} />
                        {route.status}
                      </button>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon edit"
                        onClick={() => openEditPage(route)}
                        title="Edit route"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => openDeleteModal(route)}
                        title="Delete route"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={meta.page === 1}
                  onClick={() => fetchRoutes(meta.page - 1, searchTerm)}
                >
                  Previous
                </button>
                <span>{meta.page} of {meta.totalPages}</span>
                <button
                  disabled={meta.page === meta.totalPages}
                  onClick={() => fetchRoutes(meta.page + 1, searchTerm)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>



      {/* Delete Route Modal */}
      {showDeleteModal && selectedRoute && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal-container" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h2>Delete Route</h2>
            </div>

            <div className="delete-modal-content">
              <p>Are you sure you want to delete the route <strong>{selectedRoute.name}</strong>?</p>
              <p className="delete-modal-warning">
                <AlertTriangle size={16} />
                This action cannot be undone.
              </p>
            </div>

            <div className="delete-modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRoute(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteRoute}>
                Delete Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesPage;
