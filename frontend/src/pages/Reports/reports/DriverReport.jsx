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

// --- **** DriverReport COMPONENT **** ---
const DriverReport = ({ handleViewOutliers }) => {
    // State for fetched data, loading, and errors specific to this report
    const [driverReportData, setDriverReportData] = useState([]);
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
    const [driverError, setDriverError] = useState(null);

    // State for filters
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
    const [selectedEmployee, setSelectedEmployee] = useState('all');

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
        { field: 'mobileNumber', headerName: 'Mobile Number', flex: 1.2 },
        { 
            field: 'journeysCompleted', 
            headerName: 'Journeys Completed', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right' 
        },
        {
            field: 'totalWeightSlipTrips', 
            headerName: 'Weight Slip Trips', 
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
            field: 'totalRevenue', 
            headerName: 'Total Revenue', 
            type: 'number', 
            flex: 1.2, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'
        },
        {
            field: 'totalExpenses', 
            headerName: 'Total Expenses', 
            type: 'number', 
            flex: 1.2, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'
        },
        {
            field: 'totalProfit', 
            headerName: 'Total Profit', 
            type: 'number', 
            flex: 1.2, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'
        },
        {
            field: 'avgRevenuePerTrip', 
            headerName: 'Avg Revenue/Trip', 
            type: 'number', 
            flex: 1.2, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'
        },
        {
            field: 'profitMargin', 
            headerName: 'Profit Margin (%)', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? `${value.toFixed(2)}%` : 'N/A'
        },
        {
            field: 'onTimeArrivalRate', 
            headerName: 'On-Time Arrival', 
            flex: 1.2, 
            align: 'center', 
            headerAlign: 'center',
            valueFormatter: (value) => value || 'N/A'
        },
        {
            field: 'documentsExpired', 
            headerName: 'Docs Status', 
            flex: 1, 
            align: 'center', 
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography sx={{ color: params.value ? 'red' : 'green', fontWeight: 500 }}>
                    {params.value ? 'Expired' : 'Valid'}
                </Typography>
            )
        },
    ], []);

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
        const startDate = dateRange?.from;
        const endDate = dateRange?.to;
        if (startDate || endDate) {
            rows = rows.filter(row => {
                if (!row.first_trip_date) return true;
                const rowDate = new Date(row.first_trip_date);
                const afterStart = startDate ? rowDate >= startDate : true;
                const beforeEnd = endDate ? rowDate <= endDate : true;
                return afterStart && beforeEnd;
            });
        }

        // Filter by selected employee (driver name)
        if (selectedEmployee && selectedEmployee !== 'all') {
            rows = rows.filter(row => row.driverName === selectedEmployee);
        }

        return rows;
    }, [driverReportData, searchText, dateRange, selectedEmployee]);

    // Export to CSV function
    const handleExportCSV = () => {
        const headers = ['Driver Name', 'Mobile Number', 'Journeys Completed', 'Weight Slip Trips', 'Total Distance (KM)', 'Avg. Trip Distance (KM)', 'Total Revenue', 'Total Expenses', 'Total Profit', 'Avg Revenue/Trip', 'Profit Margin (%)', 'On-Time Arrival', 'Docs Status'];
        const csvContent = [
            headers.join(','),
            ...filteredRows.map(row => [
                row.driverName || '-',
                row.mobileNumber || '-',
                row.journeysCompleted || '-',
                row.totalWeightSlipTrips || '-',
                typeof row.totalDistanceDrivenKm === 'number' ? row.totalDistanceDrivenKm.toFixed(0) : '-',
                typeof row.averageTripDistance === 'number' ? row.averageTripDistance.toFixed(1) : '-',
                typeof row.totalRevenue === 'number' ? row.totalRevenue.toFixed(2) : '-',
                typeof row.totalExpenses === 'number' ? row.totalExpenses.toFixed(2) : '-',
                typeof row.totalProfit === 'number' ? row.totalProfit.toFixed(2) : '-',
                typeof row.avgRevenuePerTrip === 'number' ? row.avgRevenuePerTrip.toFixed(2) : '-',
                typeof row.profitMargin === 'number' ? row.profitMargin.toFixed(2) : '-',
                row.onTimeArrivalRate || 'N/A',
                row.documentsExpired ? 'Expired' : 'Valid'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `driver_report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    // Export to Excel function
    const handleExportExcel = () => {
        // For now, we'll use CSV format with .xlsx extension
        // You can integrate a library like xlsx or exceljs for proper Excel format
        const headers = ['Driver Name', 'Mobile Number', 'Journeys Completed', 'Weight Slip Trips', 'Total Distance (KM)', 'Avg. Trip Distance (KM)', 'Total Revenue', 'Total Expenses', 'Total Profit', 'Avg Revenue/Trip', 'Profit Margin (%)', 'On-Time Arrival', 'Docs Status'];
        const csvContent = [
            headers.join(','),
            ...filteredRows.map(row => [
                row.driverName || '-',
                row.mobileNumber || '-',
                row.journeysCompleted || '-',
                row.totalWeightSlipTrips || '-',
                typeof row.totalDistanceDrivenKm === 'number' ? row.totalDistanceDrivenKm.toFixed(0) : '-',
                typeof row.averageTripDistance === 'number' ? row.averageTripDistance.toFixed(1) : '-',
                typeof row.totalRevenue === 'number' ? row.totalRevenue.toFixed(2) : '-',
                typeof row.totalExpenses === 'number' ? row.totalExpenses.toFixed(2) : '-',
                typeof row.totalProfit === 'number' ? row.totalProfit.toFixed(2) : '-',
                typeof row.avgRevenuePerTrip === 'number' ? row.avgRevenuePerTrip.toFixed(2) : '-',
                typeof row.profitMargin === 'number' ? row.profitMargin.toFixed(2) : '-',
                row.onTimeArrivalRate || 'N/A',
                row.documentsExpired ? 'Expired' : 'Valid'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `driver_report_${dayjs().format('YYYY-MM-DD')}.xlsx`;
        link.click();
    };

    return (
        <Box sx={{ padding: '24px' }}>
            {/* Header Section */}
            <div className="report-header-section">
                <div className="report-header-top">
                    <h3 className="report-title">Driver Report</h3>
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
                                {[...new Set(driverReportData.map(driver => driver.driverName))].filter(Boolean).map((driver) => (
                                    <SelectItem key={driver} value={driver}>
                                        {driver}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                    <th>Mobile Number</th>
                                    <th>Journeys Completed</th>
                                    <th>Weight Slip Trips</th>
                                    <th>Total Distance (KM)</th>
                                    <th>Avg. Trip Distance (KM)</th>
                                    <th>Total Revenue</th>
                                    <th>Total Expenses</th>
                                    <th>Total Profit</th>
                                    <th>Avg Revenue/Trip</th>
                                    <th>Profit Margin (%)</th>
                                    <th>On-Time Arrival</th>
                                    <th>Docs Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="driver-empty-state">
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
                                                    <div className="cell-primary">{row.mobileNumber || '-'}</div>
                                                </td>
                                                <td>
                                                    <div className="cell-primary" style={{ textAlign: 'right' }}>{row.journeysCompleted || '-'}</div>
                                                </td>
                                                <td>
                                                    <div className="cell-primary" style={{ textAlign: 'right' }}>{row.totalWeightSlipTrips || '-'}</div>
                                                </td>
                                                <td>
                                                    <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                        {typeof row.totalDistanceDrivenKm === 'number' 
                                                            ? row.totalDistanceDrivenKm.toLocaleString('en-IN', { maximumFractionDigits: 0 }) 
                                                            : '-'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                        {typeof row.averageTripDistance === 'number' 
                                                            ? row.averageTripDistance.toLocaleString('en-IN', { maximumFractionDigits: 1 }) 
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
                                                        {typeof row.avgRevenuePerTrip === 'number' 
                                                            ? `₹${row.avgRevenuePerTrip.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
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