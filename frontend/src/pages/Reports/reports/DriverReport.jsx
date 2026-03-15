import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Alert
} from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Pagination, PaginationContent, PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import TableShimmer from '@/components/ui/TableShimmer';
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
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch employee list from employees API
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await ReportsService.getEmployees();
                const names = [...new Set(data.map(d => `${d.firstName} ${d.lastName}`.trim()).filter(Boolean))];
                setEmployeeOptions(names);
            } catch (err) {
                console.error("Failed to fetch employee list:", err);
            }
        };
        fetchEmployees();
    }, []);

    // Fetch Driver Data Effect
    useEffect(() => {
        const fetchDriverReports = async () => {
            setIsLoadingDrivers(true);
            setDriverError(null);
            try {
                const data = await ReportsService.getDriverReports();
                setDriverReportData(data);
            } catch (err) {
                console.error("Failed to fetch driver reports:", err);
                setDriverError(err.detail || "Could not load driver reports.");
                setDriverReportData([]);
            } finally {
                setIsLoadingDrivers(false);
            }
        };

        fetchDriverReports();
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

        // Filter by selected employee (driver name)
        if (selectedEmployee && selectedEmployee !== 'all') {
            rows = rows.filter(row => row.driverName === selectedEmployee);
        }

        return rows;
    }, [driverReportData, searchText, selectedEmployee]);

    // Pagination
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRows.slice(start, start + itemsPerPage);
    }, [filteredRows, currentPage, itemsPerPage]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [searchText, selectedEmployee]);

    const renderPageItems = () => {
        const items = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                items.push(i);
            } else if (items[items.length - 1] !== '...') {
                items.push('...');
            }
        }
        return items;
    };

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
                        <label>Employee Name</label>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                            <SelectTrigger className="h-10 w-[180px] text-sm">
                                <SelectValue>
                                    {selectedEmployee === 'all' ? 'All Employees' : selectedEmployee}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectItem value="all">All Employees</SelectItem>
                                {employeeOptions.map((name) => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Loading and Error States */}
            {isLoadingDrivers && (
                <div className="report-content">
                    <TableShimmer columns={13} rows={10} />
                </div>
            )}
            {driverError && !isLoadingDrivers && (
                <Alert severity="error" sx={{ my: 2 }}>{driverError}</Alert>
            )}

            {/* Data Table */}
            {!isLoadingDrivers && !driverError && (
                <div className="report-content">
                    <div className="table-wrapper">
                        <table className="driver-table">
                            <thead>
                                <tr className="table-header-row">
                                    <th>Driver Name</th>
                                    <th>Mobile Number</th>
                                    <th>Journeys</th>
                                    <th>WS Trips</th>
                                    <th>Total Distance</th>
                                    <th>Avg Distance</th>
                                    <th>Revenue</th>
                                    <th>Expenses</th>
                                    <th>Profit</th>
                                    <th>Avg Rev/Trip</th>
                                    <th>Margin</th>
                                    <th>On-Time</th>
                                    <th>Docs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="driver-empty-state">
                                            No driver summary data found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRows.map((row, index) => (
                                        <tr key={row.id || index} className="trip-table-row">
                                            <td>
                                                <div className="cell-primary">{row.driverName || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.mobileNumber || '-'}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{row.journeysCompleted || '-'}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{row.totalWeightSlipTrips || '-'}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalDistanceDrivenKm === 'number'
                                                        ? row.totalDistanceDrivenKm.toLocaleString('en-IN', { maximumFractionDigits: 0 })
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.averageTripDistance === 'number'
                                                        ? row.averageTripDistance.toLocaleString('en-IN', { maximumFractionDigits: 1 })
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalRevenue === 'number'
                                                        ? `₹${row.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalExpenses === 'number'
                                                        ? `₹${row.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalProfit === 'number'
                                                        ? `₹${row.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.avgRevenuePerTrip === 'number'
                                                        ? `₹${row.avgRevenuePerTrip.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.profitMargin === 'number'
                                                        ? `${row.profitMargin.toFixed(1)}%`
                                                        : 'N/A'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="cell-primary">
                                                    {row.onTimeArrivalRate || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="last-col" style={{ textAlign: 'center' }}>
                                                <span className="date-text" style={{ color: row.documentsExpired ? 'red' : 'green', fontWeight: 500 }}>
                                                    {row.documentsExpired ? 'Expired' : 'Valid'}
                                                </span>
                                                <button className="view-details-btn">
                                                    View details
                                                    <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredRows.length > 0 && totalPages > 1 && (
                        <div className="pagination-wrapper">
                            <Pagination className="justify-end">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
                                            className={currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}
                                        />
                                    </PaginationItem>
                                    {renderPageItems().map((item, idx) =>
                                        item === '...' ? (
                                            <PaginationItem key={`e-${idx}`}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        ) : (
                                            <PaginationItem key={item}>
                                                <PaginationLink
                                                    isActive={currentPage === item}
                                                    onClick={() => setCurrentPage(item)}
                                                >
                                                    {item}
                                                </PaginationLink>
                                            </PaginationItem>
                                        )
                                    )}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
                                            className={currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            )}
        </Box>
    );
};

export default DriverReport;