import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, Alert, FormControl, Select, MenuItem
} from '@mui/material';
import { Search as SearchIcon, InfoOutlined } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { ReportsService } from '../ReportsService.jsx'; // Adjusted path
import { CsvIcon, ExcelIcon } from '../../../components/Icons';

// --- VehicleReport COMPONENT (Uses fetched data) ---
const VehicleReport = ({ handleViewOutliers }) => {
    const [vehicleReportData, setVehicleReportData] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehicleError, setVehicleError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    useEffect(() => {
        const fetchVehicleReports = async () => {
            setIsLoadingVehicles(true);
            setVehicleError(null);
            try {
                const data = await ReportsService.getVehicleReports();
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
    }, []);

    const vehicleReportColumns = useMemo(() => [
        { field: 'id', headerName: 'Vehicle Number', flex: 1.2 },
        { 
            field: 'vehicleType', 
            headerName: 'Vehicle Type', 
            flex: 1, 
            align: 'center', 
            headerAlign: 'center' 
        },
        { 
            field: 'totalTrips', 
            headerName: 'Total Trips', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right' 
        },
        { 
            field: 'totalDistanceKm', 
            headerName: 'Total Distance (KM)', 
            type: 'number', 
            flex: 1.2, 
            align: 'right', 
            headerAlign: 'right', 
            valueFormatter: (value) => typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '-' 
        },
        { 
            field: 'totalDieselLiters', 
            headerName: 'Diesel (L)', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? value.toFixed(1) : '-'
        },
        { 
            field: 'totalDieselCost', 
            headerName: 'Diesel Cost (₹)', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : '-'
        },
        { 
            field: 'averageEfficiencyKmpl', 
            headerName: 'Avg. Efficiency (km/l)', 
            type: 'number', 
            flex: 1.2, 
            align: 'right', 
            headerAlign: 'right', 
            valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : 'N/A'
        },
        { 
            field: 'costPerKm', 
            headerName: 'Cost per KM (₹)', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? `₹${value.toFixed(2)}` : '-'
        },
    ], [handleViewOutliers]);

    const filteredRows = useMemo(() => {
        let rows = vehicleReportData;

        // Filter by search text - updated to use 'id' field
        if (searchText) {
            const lowerSearchText = searchText.toLowerCase();
            rows = rows.filter((row) => row.id?.toLowerCase().includes(lowerSearchText));
        }

        return rows;
    }, [vehicleReportData, searchText]);

    // Export to CSV function
    const handleExportCSV = () => {
        const headers = ['Vehicle Number', 'Vehicle Type', 'Total Trips', 'Total Distance (KM)', 'Diesel (L)', 'Diesel Cost (₹)', 'Avg. Efficiency (km/l)', 'Cost per KM (₹)'];
        const csvContent = [
            headers.join(','),
            ...filteredRows.map(row => [
                row.id || '-',
                row.vehicleType || '-',
                row.totalTrips || '-',
                typeof row.totalDistanceKm === 'number' ? row.totalDistanceKm.toFixed(0) : '-',
                typeof row.totalDieselLiters === 'number' ? row.totalDieselLiters.toFixed(1) : '-',
                typeof row.totalDieselCost === 'number' ? row.totalDieselCost.toFixed(2) : '-',
                typeof row.averageEfficiencyKmpl === 'number' ? row.averageEfficiencyKmpl.toFixed(2) : 'N/A',
                typeof row.costPerKm === 'number' ? row.costPerKm.toFixed(2) : '-'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vehicle_report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    // Export to Excel function
    const handleExportExcel = () => {
        const headers = ['Vehicle Number', 'Vehicle Type', 'Total Trips', 'Total Distance (KM)', 'Diesel (L)', 'Diesel Cost (₹)', 'Avg. Efficiency (km/l)', 'Cost per KM (₹)'];
        const csvContent = [
            headers.join(','),
            ...filteredRows.map(row => [
                row.id || '-',
                row.vehicleType || '-',
                row.totalTrips || '-',
                typeof row.totalDistanceKm === 'number' ? row.totalDistanceKm.toFixed(0) : '-',
                typeof row.totalDieselLiters === 'number' ? row.totalDieselLiters.toFixed(1) : '-',
                typeof row.totalDieselCost === 'number' ? row.totalDieselCost.toFixed(2) : '-',
                typeof row.averageEfficiencyKmpl === 'number' ? row.averageEfficiencyKmpl.toFixed(2) : 'N/A',
                typeof row.costPerKm === 'number' ? row.costPerKm.toFixed(2) : '-'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vehicle_report_${dayjs().format('YYYY-MM-DD')}.xlsx`;
        link.click();
    };

    return (
        <Box sx={{ padding: '24px' }}>
            {/* Header Section */}
            <div className="report-header-section">
                <div className="report-header-top">
                    <h3 className="report-title">Vehicle Report</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={handleExportCSV}
                            style={{
                                width: '44px',
                                height: '44px',
                                padding: '6px 8px',
                                background: '#F8F8FB',
                                borderRadius: '8px',
                                border: '1px solid #ECECEE',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#ECECEE'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#F8F8FB'}
                            title="Export to CSV"
                        >
                            <CsvIcon width={24} height={24} />
                        </button>
                        <button 
                            onClick={handleExportExcel}
                            style={{
                                width: '44px',
                                height: '44px',
                                padding: '6px 8px',
                                background: '#F8F8FB',
                                borderRadius: '8px',
                                border: '1px solid #ECECEE',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#ECECEE'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#F8F8FB'}
                            title="Export to Excel"
                        >
                            <ExcelIcon width={22} height={22} />
                        </button>
                    </div>
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
                                    <th>Vehicle Type</th>
                                    <th>Total Trips</th>
                                    <th>Total Distance (KM)</th>
                                    <th>Diesel (L)</th>
                                    <th>Diesel Cost (₹)</th>
                                    <th>Avg. Efficiency (km/l)</th>
                                    <th>Cost per KM (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="vehicle-empty-state">
                                            No vehicle summary data found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => (
                                        <tr key={row.id || index}>
                                            <td>
                                                <div className="cell-primary">{row.id || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'center' }}>
                                                    {row.vehicleType || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {row.totalTrips || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalDistanceKm === 'number' 
                                                        ? row.totalDistanceKm.toLocaleString('en-IN', { maximumFractionDigits: 0 }) 
                                                        : '-'} km
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalDieselLiters === 'number' 
                                                        ? row.totalDieselLiters.toFixed(1) 
                                                        : '-'} L
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalDieselCost === 'number' 
                                                        ? `₹${row.totalDieselCost.toLocaleString('en-IN')}` 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.averageEfficiencyKmpl === 'number' 
                                                        ? row.averageEfficiencyKmpl.toFixed(2) 
                                                        : 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.costPerKm === 'number' 
                                                        ? `₹${row.costPerKm.toFixed(2)}` 
                                                        : '-'}
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