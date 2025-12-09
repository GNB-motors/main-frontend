import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, Alert, FormControl, Select, MenuItem
} from '@mui/material';
import { Search as SearchIcon, InfoOutlined } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { ReportsService } from '../ReportsService.jsx'; // Adjusted path

// --- VehicleReport COMPONENT (Uses fetched data) ---
const VehicleReport = ({ businessRefId, isLoadingProfile, profileError, handleViewOutliers }) => {
    const [vehicleReportData, setVehicleReportData] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehicleError, setVehicleError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    useEffect(() => {
        if (isLoadingProfile || profileError || !businessRefId) {
            if (!isLoadingProfile) {
                setIsLoadingVehicles(false);
                if (profileError) setVehicleError(`Profile Error: ${profileError}`);
                else if (!businessRefId) setVehicleError("Business ID not found.");
            } else {
                setIsLoadingVehicles(true);
            }
            return;
        }

        const fetchVehicleReports = async () => {
            setIsLoadingVehicles(true);
            setVehicleError(null);
            try {
                const data = await ReportsService.getVehicleReports(businessRefId);
                setVehicleReportData(data);
                console.log("Vehicle Reports Fetched:", data);
            } catch (err) {
                console.error("Failed to fetch vehicle reports:", err);
                setVehicleError(err.detail || "Could not load vehicle reports.");
                setVehicleReportData([]);
            } finally {
                setIsLoadingVehicles(false);
            }
        };

        fetchVehicleReports();
    }, [businessRefId, isLoadingProfile, profileError]);

    const vehicleReportColumns = useMemo(() => [
        { field: 'vehicle_registration_no', headerName: 'Vehicle Number', flex: 1 },
        { field: 'total_kms_driven', headerName: 'Total KMs Driven', type: 'number', flex: 1, align: 'right', headerAlign: 'right', valueFormatter: (value) => typeof value === 'number' ? value.toFixed(1) : '-' },
        { field: 'instances_driven', headerName: 'Instances Driven', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
        { field: 'average_variance', headerName: 'Avg. Variance (km/l)', type: 'number', flex: 1, align: 'right', headerAlign: 'right', valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : 'N/A', renderCell: (params) => { const value = params.value; if (typeof value !== 'number') return 'N/A'; return <span style={{ color: value > 0 ? 'green' : (value < 0 ? 'red' : 'inherit') }}>{value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}</span>; } },
        { field: 'negative_variance_outliers', headerName: 'Neg. Variance Instances', type: 'number', flex: 1, align: 'right', headerAlign: 'right', renderCell: (params) => (<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}><Typography sx={{ mr: 1, color: params.value > 0 ? 'red' : 'inherit' }}>{params.value}</Typography>{params.value > 0 && <IconButton size="small" className="outlier-info-button" onClick={() => handleViewOutliers(params.row.vehicle_registration_no)}><InfoOutlined fontSize="small" /></IconButton>}</Box>) },
        // IMPORTANT: Add handleViewOutliers to the dependency array
    ], [handleViewOutliers]);

    const filteredRows = useMemo(() => {
        let rows = vehicleReportData;

        // Filter by search text
        if (searchText) {
            const lowerSearchText = searchText.toLowerCase();
            rows = rows.filter((row) => row.vehicle_registration_no?.toLowerCase().includes(lowerSearchText));
        }

        // Filter by date range (using first_trip_date if available)
        const startDate = dateRange[0];
        const endDate = dateRange[1];
        if (startDate || endDate) {
            rows = rows.filter(row => {
                if (!row.first_trip_date) return true; // Include if no date available
                const rowDate = dayjs(row.first_trip_date);
                const afterStart = startDate ? rowDate.isAfter(startDate.subtract(1, 'day')) : true;
                const beforeEnd = endDate ? rowDate.isBefore(endDate.add(1, 'day')) : true;
                return afterStart && beforeEnd;
            });
        }

        // Filter by employee name if selected
        if (selectedEmployee !== '') {
            rows = rows.filter(row => row.primary_driver_name === selectedEmployee);
        }

        return rows;
    }, [vehicleReportData, searchText, dateRange, selectedEmployee]);

    return (
        <Box>
            {/* Header Section */}
            <div className="report-header-section">
                <div className="report-header-top">
                    <h3 className="report-title">Vehicle Report</h3>
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
                                {[...new Set(vehicleReportData.map(vehicle => vehicle.primary_driver_name))].map((driver) => (
                                    <MenuItem key={driver} value={driver}>
                                        {driver || 'N/A'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </div>
            </div>

            {isLoadingVehicles && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading vehicle data...</Typography>
                </Box>
            )}

            {vehicleError && !isLoadingVehicles && <Alert severity="error" sx={{ my: 2 }}>{vehicleError}</Alert>}

            {!isLoadingVehicles && !vehicleError && (
                <div className="report-content">
                    <div className="vehicle-table-container">
                        <table className="vehicle-table">
                            <thead>
                                <tr>
                                    <th>Vehicle Number</th>
                                    <th>Total KMs Driven</th>
                                    <th>Instances Driven</th>
                                    <th>Avg. Variance (km/l)</th>
                                    <th>Neg. Variance Instances</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="vehicle-empty-state">
                                            No vehicle summary data found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="cell-primary">{row.vehicle_registration_no || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{typeof row.total_kms_driven === 'number' ? row.total_kms_driven.toFixed(1) : '-'} km</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.instances_driven || '-'}</div>
                                            </td>
                                            <td>
                                                {typeof row.average_variance === 'number' ? (
                                                    <span style={{ color: row.average_variance > 0 ? 'green' : (row.average_variance < 0 ? 'red' : 'inherit'), fontWeight: Math.abs(row.average_variance) >= 1.5 ? 'bold' : 'normal' }}>
                                                        {row.average_variance > 0 ? `+${row.average_variance.toFixed(2)}` : row.average_variance.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: row.negative_variance_outliers > 0 ? 'red' : 'inherit' }}>
                                                    <span>{row.negative_variance_outliers || '-'}</span>
                                                    {row.negative_variance_outliers > 0 && (
                                                        <IconButton
                                                            size="small"
                                                            className="outlier-info-button"
                                                            onClick={() => handleViewOutliers(row.vehicle_registration_no)}
                                                        >
                                                            <InfoOutlined fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </div>
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

export default VehicleReport;