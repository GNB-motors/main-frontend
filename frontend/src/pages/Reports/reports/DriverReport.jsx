import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, Alert, FormControl, Select, MenuItem
} from '@mui/material';
import { Search as SearchIcon, InfoOutlined, Star } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { ReportsService } from '../ReportsService.jsx'; // Adjusted path

// --- **** DriverReport COMPONENT **** ---
const DriverReport = ({ businessRefId, isLoadingProfile, profileError, handleViewOutliers }) => {
    // State for fetched data, loading, and errors specific to this report
    const [driverReportData, setDriverReportData] = useState([]);
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
    const [driverError, setDriverError] = useState(null);

    // State for filters
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    // Fetch Driver Data Effect
    useEffect(() => {
        const fetchDriverReports = async () => {
            setIsLoadingDrivers(true);
            setDriverError(null);
            try {
                const data = await ReportsService.getDriverReports();
                setDriverReportData(data);
                console.log("Driver Reports Fetched:", data);
            } catch (err) {
                console.error("Failed to fetch driver reports:", err);
                setDriverError(err.detail || "Could not load driver reports.");
                setDriverReportData([]); // Clear data on error
            } finally {
                setIsLoadingDrivers(false);
            }
        };

        fetchDriverReports();
        // Rerun fetch only when component mounts
    }, []);

    // Define columns based on API response
    const driverColumns = useMemo(() => [
        { field: 'driverName', headerName: 'Driver Name', flex: 1.5 },
        { 
            field: 'tripsCompleted', 
            headerName: 'Trips Completed', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right' 
        },
        {
            field: 'totalDistanceDrivenKm', 
            headerName: 'Total Distance (KM)', 
            type: 'number', 
            flex: 1.2, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '-'
        },
        {
            field: 'averageTripDistance', 
            headerName: 'Avg. Trip Distance (KM)', 
            type: 'number', 
            flex: 1.2, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : '-'
        },
        {
            field: 'average_variance', headerName: 'Avg. Variance', type: 'number', flex: 1, align: 'right', headerAlign: 'right',
            description: 'Avg. Mileage Variance (km/l)',
            valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : 'N/A', // Format variance
            renderCell: (params) => { // Color variance
                const value = params.value;
                if (typeof value !== 'number') return 'N/A';
                return (
                    <span style={{ color: value > 0 ? 'green' : (value < 0 ? 'red' : 'inherit') }}>
                        {value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}
                    </span>
                );
            }
        },
        {
            field: 'driver_rating', headerName: 'Rating (1-5)', flex: 1, align: 'right', headerAlign: 'right',
            type: 'number',
            valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : 'N/A', // Format rating
            renderCell: (params) => { // Display rating with star
                const ratingValue = params.value;
                if (typeof ratingValue !== 'number') return 'N/A';

                // Determine star color based on rating value
                const getRatingColor = (rating) => {
                    if (rating >= 4.5) return '#4caf50'; // Darker Green
                    if (rating >= 3.5) return '#8bc34a'; // Light Green
                    if (rating >= 2.5) return '#ffc107'; // Amber
                    if (rating >= 1.5) return '#ff9800'; // Orange
                    return '#f44336'; // Red
                };
                const starColor = getRatingColor(ratingValue);

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                        <Typography sx={{ fontWeight: 500, mr: 0.5 }}>
                            {ratingValue.toFixed(2)}
                        </Typography>
                        <Star sx={{ color: starColor, fontSize: '1rem' }} />
                    </Box>
                );
            }
        },
        {
            field: 'outlier_count', headerName: 'Outliers', type: 'number', flex: 1, align: 'right', headerAlign: 'right',
            description: 'Count of trips with negative variance',
            renderCell: (params) => ( // Link to outliers report if count > 0
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                    <Typography sx={{ mr: 1, color: params.value > 0 ? 'red' : 'inherit' }}>
                        {params.value}
                    </Typography>
                    {params.value > 0 && (
                        <IconButton
                            size="small"
                            className="outlier-info-button"
                            // Use handleViewOutliers from parent scope, passing driver_name
                            onClick={() => handleViewOutliers(params.row.driver_name)}
                        >
                            <InfoOutlined fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            )
        },
        // IMPORTANT: Add handleViewOutliers to the dependency array
    ], [handleViewOutliers]);

    // Client-side filtering based on search text and filters
    const filteredRows = useMemo(() => {
        let rows = driverReportData;

        // Filter by search text - updated to use driverName
        if (searchText) {
            const lowerSearchText = searchText.toLowerCase();
            rows = rows.filter(row =>
                row.driverName?.toLowerCase().includes(lowerSearchText)
            );
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

        // Filter by selected employee (driver name)
        if (selectedEmployee !== '') {
            rows = rows.filter(row => row.driver_name === selectedEmployee);
        }

        return rows;
    }, [driverReportData, searchText, dateRange, selectedEmployee]);

    return (
        <Box>
            {/* Header Section */}
            <div className="report-header-section">
                <div className="report-header-top">
                    <h3 className="report-title">Driver Report</h3>
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
                                {[...new Set(driverReportData.map(driver => driver.driverName))].map((driver) => (
                                    <MenuItem key={driver} value={driver}>
                                        {driver || 'N/A'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </div>
            </div>

            {/* Loading and Error States */}
            {isLoadingDrivers && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading driver data...</Typography>
                </Box>
            )}
            {driverError && !isLoadingDrivers && (
                <Alert severity="error" sx={{ my: 2 }}>{driverError}</Alert>
            )}

            {/* Data Table */}
            {!isLoadingDrivers && !driverError && (
                <div className="report-content">
                    <div className="driver-table-container">
                        <table className="driver-table">
                            <thead>
                                <tr>
                                    <th>Driver Name</th>
                                    <th>Trips Completed</th>
                                    <th>Total Distance (KM)</th>
                                    <th>Avg. Trip Distance (KM)</th>
                                    <th>On-Time Arrival</th>
                                    <th>Documents Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="driver-empty-state">
                                            No driver summary data found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => {
                                        return (
                                            <tr key={row.id || index}>
                                                <td>
                                                    <div className="cell-primary">{row.driverName || '-'}</div>
                                                </td>
                                                <td>
                                                    <div className="cell-primary">{row.tripsCompleted || '-'}</div>
                                                </td>
                                                <td>
                                                    <div className="cell-primary">
                                                        {typeof row.totalDistanceDrivenKm === 'number' 
                                                            ? row.totalDistanceDrivenKm.toLocaleString('en-IN', { maximumFractionDigits: 0 }) 
                                                            : '-'} km
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="cell-primary">
                                                        {typeof row.averageTripDistance === 'number' 
                                                            ? row.averageTripDistance.toLocaleString('en-IN', { maximumFractionDigits: 1 }) 
                                                            : '-'} km
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="cell-primary" style={{ textAlign: 'center' }}>
                                                        {row.onTimeArrivalRate || 'N/A'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div 
                                                        className="cell-primary" 
                                                        style={{ 
                                                            textAlign: 'center',
                                                            color: row.documentsExpired ? 'red' : 'green',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {row.documentsExpired ? 'Expired' : 'Valid'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Box>
    );
};

export default DriverReport;