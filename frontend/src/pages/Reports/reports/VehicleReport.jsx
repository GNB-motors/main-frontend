import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, CircularProgress, Alert
} from '@mui/material';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportsService } from '../ReportsService.jsx';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';

// --- VehicleReport COMPONENT (Uses fetched data) ---
const VehicleReport = ({ handleViewOutliers }) => {
    const [vehicleReportData, setVehicleReportData] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehicleError, setVehicleError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
    const [selectedEmployee, setSelectedEmployee] = useState('all');

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
        const headers = ['Registration Number', 'Vehicle Type', 'Model', 'Total Journeys', 'Weight Slip Trips', 'Total Distance (KM)', 'Diesel (L)', 'Diesel Cost (₹)', 'AdBlue (L)', 'AdBlue Cost (₹)', 'Total Revenue (₹)', 'Total Expenses (₹)', 'Total Profit (₹)', 'Avg. Efficiency (km/l)', 'Cost per KM (₹)', 'Revenue per KM (₹)', 'Profit Margin (%)'];
        const csvContent = [
            headers.join(','),
            ...filteredRows.map(row => [
                row.registrationNumber || '-',
                row.vehicleType || '-',
                row.model || '-',
                row.totalJourneys || '-',
                row.totalWeightSlipTrips || '-',
                typeof row.totalDistanceKm === 'number' ? row.totalDistanceKm.toFixed(0) : '-',
                typeof row.totalDieselLiters === 'number' ? row.totalDieselLiters.toFixed(1) : '-',
                typeof row.totalDieselCost === 'number' ? row.totalDieselCost.toFixed(2) : '-',
                typeof row.totalAdBlueLiters === 'number' ? row.totalAdBlueLiters.toFixed(1) : '-',
                typeof row.totalAdBlueCost === 'number' ? row.totalAdBlueCost.toFixed(2) : '-',
                typeof row.totalRevenue === 'number' ? row.totalRevenue.toFixed(2) : '-',
                typeof row.totalExpenses === 'number' ? row.totalExpenses.toFixed(2) : '-',
                typeof row.totalProfit === 'number' ? row.totalProfit.toFixed(2) : '-',
                typeof row.averageEfficiencyKmpl === 'number' ? row.averageEfficiencyKmpl.toFixed(2) : 'N/A',
                typeof row.costPerKm === 'number' ? row.costPerKm.toFixed(2) : '-',
                typeof row.revenuePerKm === 'number' ? row.revenuePerKm.toFixed(2) : '-',
                typeof row.profitMargin === 'number' ? row.profitMargin.toFixed(2) : '-'
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
        const headers = ['Registration Number', 'Vehicle Type', 'Model', 'Total Journeys', 'Weight Slip Trips', 'Total Distance (KM)', 'Diesel (L)', 'Diesel Cost (₹)', 'AdBlue (L)', 'AdBlue Cost (₹)', 'Total Revenue (₹)', 'Total Expenses (₹)', 'Total Profit (₹)', 'Avg. Efficiency (km/l)', 'Cost per KM (₹)', 'Revenue per KM (₹)', 'Profit Margin (%)'];
        const csvContent = [
            headers.join(','),
            ...filteredRows.map(row => [
                row.registrationNumber || '-',
                row.vehicleType || '-',
                row.model || '-',
                row.totalJourneys || '-',
                row.totalWeightSlipTrips || '-',
                typeof row.totalDistanceKm === 'number' ? row.totalDistanceKm.toFixed(0) : '-',
                typeof row.totalDieselLiters === 'number' ? row.totalDieselLiters.toFixed(1) : '-',
                typeof row.totalDieselCost === 'number' ? row.totalDieselCost.toFixed(2) : '-',
                typeof row.totalAdBlueLiters === 'number' ? row.totalAdBlueLiters.toFixed(1) : '-',
                typeof row.totalAdBlueCost === 'number' ? row.totalAdBlueCost.toFixed(2) : '-',
                typeof row.totalRevenue === 'number' ? row.totalRevenue.toFixed(2) : '-',
                typeof row.totalExpenses === 'number' ? row.totalExpenses.toFixed(2) : '-',
                typeof row.totalProfit === 'number' ? row.totalProfit.toFixed(2) : '-',
                typeof row.averageEfficiencyKmpl === 'number' ? row.averageEfficiencyKmpl.toFixed(2) : 'N/A',
                typeof row.costPerKm === 'number' ? row.costPerKm.toFixed(2) : '-',
                typeof row.revenuePerKm === 'number' ? row.revenuePerKm.toFixed(2) : '-',
                typeof row.profitMargin === 'number' ? row.profitMargin.toFixed(2) : '-'
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
                    <div className="date-input-group">
                        <label>Date Range</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 w-[280px] justify-start gap-2 pl-2 pr-3 text-sm font-normal"
                                >
                                    <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <span>
                                                {format(dateRange.from, 'dd MMM yyyy')} — {format(dateRange.to, 'dd MMM yyyy')}
                                            </span>
                                        ) : (
                                            <span>{format(dateRange.from, 'dd MMM yyyy')}</span>
                                        )
                                    ) : (
                                        <span className="text-muted-foreground">Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="date-input-group">
                        <label>Employee Name</label>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                            <SelectTrigger className="h-10 w-[180px] text-sm">
                                <SelectValue>
                                    {selectedEmployee === 'all' ? 'All Employees' : selectedEmployee}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectItem value="all">All Employees</SelectItem>
                                {[...new Set(vehicleReportData.map(vehicle => vehicle.primary_driver_name))].filter(Boolean).map((driver) => (
                                    <SelectItem key={driver} value={driver}>
                                        {driver}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                    <th>Registration Number</th>
                                    <th>Vehicle Type</th>
                                    <th>Model</th>
                                    <th>Total Journeys</th>
                                    <th>Weight Slip Trips</th>
                                    <th>Total Distance (KM)</th>
                                    <th>Diesel (L)</th>
                                    <th>Diesel Cost (₹)</th>
                                    <th>AdBlue (L)</th>
                                    <th>AdBlue Cost (₹)</th>
                                    <th>Total Revenue (₹)</th>
                                    <th>Total Expenses (₹)</th>
                                    <th>Total Profit (₹)</th>
                                    <th>Avg. Efficiency (km/l)</th>
                                    <th>Cost per KM (₹)</th>
                                    <th>Revenue per KM (₹)</th>
                                    <th>Profit Margin (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={17} className="vehicle-empty-state">
                                            No vehicle summary data found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => (
                                        <tr key={row.id || index}>
                                            <td>
                                                <div className="cell-primary">{row.registrationNumber || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'center' }}>
                                                    {row.vehicleType || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.model || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {row.totalJourneys || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {row.totalWeightSlipTrips || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalDistanceKm === 'number' 
                                                        ? row.totalDistanceKm.toLocaleString('en-IN', { maximumFractionDigits: 0 }) 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalDieselLiters === 'number' 
                                                        ? row.totalDieselLiters.toFixed(1) 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalDieselCost === 'number' 
                                                        ? `₹${row.totalDieselCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalAdBlueLiters === 'number' 
                                                        ? row.totalAdBlueLiters.toFixed(1) 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalAdBlueCost === 'number' 
                                                        ? `₹${row.totalAdBlueCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalRevenue === 'number' 
                                                        ? `₹${row.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalExpenses === 'number' 
                                                        ? `₹${row.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.totalProfit === 'number' 
                                                        ? `₹${row.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
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
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.revenuePerKm === 'number' 
                                                        ? `₹${row.revenuePerKm.toFixed(2)}` 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.profitMargin === 'number' 
                                                        ? `${row.profitMargin.toFixed(2)}%` 
                                                        : 'N/A'}
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