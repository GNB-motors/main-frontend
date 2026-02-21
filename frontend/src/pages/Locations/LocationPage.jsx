/**
 * Location Management Page
 * Manage all locations (source/destination) with CRUD functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LocationService from './LocationService';
import './LocationPage.css';

const LocationPage = () => {
    // State
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const navigate = useNavigate();
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });

    // Fetch locations
    const fetchLocations = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await LocationService.getLocations({
                page,
                limit: 10,
                search
            });
            // Handle both formats if backend returns just array or pagination object
            if (response && response.results) {
                setLocations(response.results);
                setMeta({
                    total: response.totalResults,
                    page: response.page,
                    limit: response.limit,
                    totalPages: response.totalPages
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

    // Initial fetch
    useEffect(() => {
        fetchLocations(1, '');
    }, [fetchLocations]);

    // Handle search
    const handleSearch = useCallback((e) => {
        const value = e.target.value;
        setSearchTerm(value);
        // Debounce suggested across the app but for now direct call
        fetchLocations(1, value);
    }, [fetchLocations]);

    // Navigate to edit page
    const openEditPage = useCallback((location) => {
        navigate('/locations/add', { state: { editingLocation: location } });
    }, [navigate]);

    // Open delete modal
    const openDeleteModal = useCallback((location) => {
        setSelectedLocation(location);
        setShowDeleteModal(true);
    }, []);

    // Delete location
    const handleDeleteLocation = useCallback(async () => {
        try {
            await LocationService.deleteLocation(selectedLocation._id || selectedLocation.id);
            toast.success('Location deleted successfully');
            setShowDeleteModal(false);
            setSelectedLocation(null);
            fetchLocations(meta.page, searchTerm);
        } catch (error) {
            const errorMsg = error?.message || 'Failed to delete location';
            toast.error(errorMsg);
        }
    }, [selectedLocation, fetchLocations, meta.page, searchTerm]);

    return (
        <div className="location-page">
            {/* Header */}
            <div className="location-header">
                <h1>Locations Management</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/locations/add')}
                >
                    <Plus size={18} />
                    Add Location
                </button>
            </div>

            {/* Search Bar */}
            <div className="location-search">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search locations by name, city..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                />
            </div>

            {/* Locations Container */}
            <div className="location-container">
                {loading ? (
                    <div className="loading-state">Loading locations...</div>
                ) : locations.length === 0 ? (
                    <div className="empty-state">
                        <MapPin size={48} />
                        <p>No locations found</p>
                        <button className="btn btn-primary" onClick={() => navigate('/locations/add')}>
                            Create your first location
                        </button>
                    </div>
                ) : (
                    <>
                        <table className="location-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '20%' }}>Name</th>
                                    <th style={{ width: '10%' }}>Type</th>
                                    <th style={{ width: '10%' }}>Pincode</th>
                                    <th style={{ width: '50%' }}>Address</th>
                                    <th style={{ textAlign: 'right', width: '10%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.map(loc => (
                                    <tr key={loc._id || loc.id}>
                                        <td className="location-name-cell">{loc.name}</td>
                                        <td className="location-type-cell">
                                            <span className={`type-badge ${loc.type ? loc.type.toLowerCase() : ''}`}>
                                                {loc.type}
                                            </span>
                                        </td>
                                        <td className="location-pincode-cell">
                                            {loc.pincode || '-'}
                                        </td>
                                        <td className="location-address-cell">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '14px', color: '#121214' }}>{loc.address}</span>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                    {loc.city}{loc.city && loc.state ? ', ' : ''}{loc.state}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn-icon edit"
                                                onClick={() => openEditPage(loc)}
                                                title="Edit location"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => openDeleteModal(loc)}
                                                title="Delete location"
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
                                    onClick={() => fetchLocations(meta.page - 1, searchTerm)}
                                >
                                    Previous
                                </button>
                                <span>{meta.page} of {meta.totalPages}</span>
                                <button
                                    disabled={meta.page === meta.totalPages}
                                    onClick={() => fetchLocations(meta.page + 1, searchTerm)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && selectedLocation && (
                <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="delete-modal-container" onClick={e => e.stopPropagation()}>
                        <div className="delete-modal-header">
                            <h2>Delete Location</h2>
                        </div>

                        <div className="delete-modal-content">
                            <p>Are you sure you want to delete <strong>{selectedLocation.name}</strong>?</p>
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
                                    setSelectedLocation(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteLocation}>
                                Delete Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPage;
