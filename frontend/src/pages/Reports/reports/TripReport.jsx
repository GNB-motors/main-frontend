import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment,
    Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { ReportsService } from '../ReportsService.jsx'; // Adjusted path
import { months } from '../../../utils/mockdata.jsx'; // Adjusted path

// --- TripReport COMPONENT (Uses fetched data) ---
const TripReport = ({ businessRefId, isLoadingProfile, profileError }) => {
    const [tripData, setTripData] = useState([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);
    const [tripError, setTripError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    
    useEffect(() => {
        if (isLoadingProfile || profileError || !businessRefId) {
            if (!isLoadingProfile) {
                setIsLoadingTrips(false);
                if (profileError) setTripError(`Profile Error: ${profileError}`);
                else if (!businessRefId) setTripError("Business ID not found.");
            } else {
                setIsLoadingTrips(true);
            }
            return;
        }

        const fetchTrips = async () => {
            setIsLoadingTrips(true);
            setTripError(null);
            try {
                const data = await ReportsService.getTripReports(businessRefId);
                setTripData(data);
                console.log("Trip Reports Fetched:", data);
            } catch (err) {
                console.error("Failed to fetch trip reports:", err);
                setTripError(err.detail || "Could not load trip reports.");
                setTripData([]);
            } finally {
                setIsLoadingTrips(false);
            }
        };

        fetchTrips();
    }, [businessRefId, isLoadingProfile, profileError]);
    const tripColumns = useMemo(() => [
        { field: 'start_date', headerName: 'Start Date', flex: 1, type: 'date', valueGetter: (value) => value ? dayjs(value).toDate() : null },
        { field: 'end_date', headerName: 'End Date', flex: 1, type: 'date', valueGetter: (value) => value ? dayjs(value).toDate() : null },
        { field: 'driver_name', headerName: 'Driver', flex: 1.5, valueGetter: (value) => value || 'N/A' },
        { field: 'vehicle_registration_no', headerName: 'Vehicle', flex: 1 },
        { field: 'kms_driven', headerName: 'KMs Driven', type: 'number', flex: 1, align: 'right', headerAlign: 'right', valueFormatter: (value) => typeof value === 'number' ? value.toFixed(1) : '-' },
        { field: 'fleetedge_mileage_kml', headerName: 'FleetEdge (km/l)', type: 'number', flex: 1, align: 'right', headerAlign: 'right', valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : '-' },
        { field: 'bill_mileage_kml', headerName: 'Bill (km/l)', type: 'number', flex: 1, align: 'right', headerAlign: 'right', valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : '-' },
        { field: 'variance', headerName: 'Variance', type: 'number', flex: 1, align: 'right', headerAlign: 'right', renderCell: (params) => { const value = params.value; if (typeof value !== 'number') return '-'; return <span style={{ color: value > 0 ? 'green' : 'red', fontWeight: Math.abs(value) >= 1.5 ? 'bold' : 'normal' }}>{value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}</span>; } },
    ], []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };
    const filteredRows = useMemo(() => {
        let rows = tripData;

        // Filter by search text
        if (searchText) {
            const lowerSearchText = searchText.toLowerCase();
            rows = rows.filter(row =>
                row.driver_name?.toLowerCase().includes(lowerSearchText) ||
                row.vehicle_registration_no?.toLowerCase().includes(lowerSearchText)
            );
        }

        // Filter by date range
        const startDate = dateRange[0];
        const endDate = dateRange[1];
        if (startDate || endDate) {
            rows = rows.filter(row => {
                if (!row.start_date) return false;
                const rowStartDate = dayjs(row.start_date);
                const afterStart = startDate ? rowStartDate.isAfter(startDate.subtract(1, 'day')) : true;
                const beforeEnd = endDate ? rowStartDate.isBefore(endDate.add(1, 'day')) : true;
                return afterStart && beforeEnd;
            });
        }

        // Filter by employee name
        if (selectedEmployee !== '') {
            rows = rows.filter(row => row.driver_name === selectedEmployee);
        }

        return rows;
    }, [tripData, searchText, dateRange, selectedEmployee]);
    return (
        <Box>
            {/* Header Section */}
            <div className="report-header-section">
                <div className="report-header-top">
                    <h3 className="report-title">Trip Report</h3>
                    {/* <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Search Driver/Vehicle..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 250 }}
                    /> */}
                </div>

                {/* Filter Controls */}
                <div className="report-filters">
                    <div className="date-range-container">
                        <div className="date-input-group">
                            <label>From</label>
                            <DatePicker
                                value={dateRange[0]}
                                onChange={(newValue) => {
                                    setDateRange([newValue, dateRange[1]]);
                                }}
                                slotProps={{ textField: { size: 'small' } }}
                            />
                        </div>

                        <div className="date-input-group">
                            <label>To</label>
                            <DatePicker
                                value={dateRange[1]}
                                onChange={(newValue) => {
                                    setDateRange([dateRange[0], newValue]);
                                }}
                                slotProps={{ textField: { size: 'small' } }}
                            />
                        </div>
                    </div>

                    <div className="date-input-group">
                        <label>Employee Name</label>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                displayEmpty
                                renderValue={(value) => {
                                    if (value === '') {
                                        return 'All';
                                    }
                                    return value;
                                }}
                            >
                                <MenuItem value="">All</MenuItem>
                                {[...new Set(tripData.map(trip => trip.driver_name))].map((driver) => (
                                    <MenuItem key={driver} value={driver}>
                                        {driver || 'N/A'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </div>
            </div>

            {isLoadingTrips && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading trip data...</Typography>
                </Box>
            )}

            {tripError && !isLoadingTrips && <Alert severity="error" sx={{ my: 2 }}>{tripError}</Alert>}

            {!isLoadingTrips && !tripError && (
                <div className="report-content">
                    <div className="trip-table-container">
                        <table className="trip-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Vehicle</th>
                                    <th>Driver</th>
                                    <th>KMs Driven</th>
                                    <th>FleetEdge (km/l)</th>
                                    <th>Bill (km/l)</th>
                                    <th>Variance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="trip-empty-state">
                                            No trips found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="cell-primary">{formatDate(row.start_date)}</div>
                                                <div className="cell-secondary">{row.start_date ? dayjs(row.start_date).format('HH:mm') : '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.vehicle_registration_no || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.driver_name || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{typeof row.kms_driven === 'number' ? row.kms_driven.toFixed(1) : '-'} km</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{typeof row.fleetedge_mileage_kml === 'number' ? row.fleetedge_mileage_kml.toFixed(2) : '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{typeof row.bill_mileage_kml === 'number' ? row.bill_mileage_kml.toFixed(2) : '-'}</div>
                                            </td>
                                            <td>
                                                {typeof row.variance === 'number' ? (
                                                    <span style={{ color: row.variance > 0 ? 'green' : 'red', fontWeight: Math.abs(row.variance) >= 1.5 ? 'bold' : 'normal' }}>
                                                        {row.variance > 0 ? `+${row.variance.toFixed(1)}` : row.variance.toFixed(1)}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Box>
    );
};

export default TripReport;