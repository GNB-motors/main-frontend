import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Alert
} from '@mui/material';
import dayjs from 'dayjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Pagination, PaginationContent, PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import TableShimmer from '@/components/ui/TableShimmer';
import { ReportsService } from '../ReportsService.jsx';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';

const COLUMN_COUNT = 9;

const formatNumber = (value, digits = 0) =>
    typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: digits }) : '-';

const formatCurrency = (value) =>
    typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-';

const formatDate = (value) => (value ? dayjs(value).format('DD MMM YYYY') : '-');

// --- **** DriverReport COMPONENT **** ---
const DriverReport = () => {
    // State for fetched data, loading, and errors specific to this report
    const [driverReportData, setDriverReportData] = useState([]);
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
    const [driverError, setDriverError] = useState(null);

    // State for filters
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

    // Client-side filtering by selected employee (driver name)
    const filteredRows = useMemo(() => {
        let rows = driverReportData;
        if (selectedEmployee && selectedEmployee !== 'all') {
            rows = rows.filter(row => row.driverName === selectedEmployee);
        }
        return rows;
    }, [driverReportData, selectedEmployee]);

    // Pagination
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRows.slice(start, start + itemsPerPage);
    }, [filteredRows, currentPage, itemsPerPage]);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [selectedEmployee]);

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

    const buildCsv = () => {
        const headers = ['Driver Name', 'Mobile Number', 'Refuels', 'Total Distance (KM)', 'Diesel (L)', 'AdBlue (L)', 'Total Fuel Cost (₹)', 'Avg Mileage (km/L)', 'Last Refuel'];
        return [
            headers.join(','),
            ...filteredRows.map(row => [
                row.driverName || '-',
                row.mobileNumber || '-',
                row.totalRefuels || 0,
                typeof row.totalDistanceKm === 'number' ? row.totalDistanceKm.toFixed(0) : '-',
                typeof row.totalDieselLiters === 'number' ? row.totalDieselLiters.toFixed(1) : '-',
                typeof row.totalAdBlueLiters === 'number' ? row.totalAdBlueLiters.toFixed(1) : '-',
                typeof row.totalFuelCost === 'number' ? row.totalFuelCost.toFixed(2) : '-',
                typeof row.avgMileageKmPerL === 'number' ? row.avgMileageKmPerL.toFixed(2) : '-',
                row.lastRefuelAt ? dayjs(row.lastRefuelAt).format('DD/MM/YYYY') : '-',
            ].join(','))
        ].join('\n');
    };

    const downloadCsv = (extension, mimeType) => {
        const blob = new Blob([buildCsv()], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `driver_report_${dayjs().format('YYYY-MM-DD')}.${extension}`;
        link.click();
    };

    const handleExportCSV = () => downloadCsv('csv', 'text/csv;charset=utf-8;');
    const handleExportExcel = () => downloadCsv('xlsx', 'application/vnd.ms-excel;charset=utf-8;');

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
                    <TableShimmer columns={COLUMN_COUNT} rows={10} />
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
                                    <th>Refuels</th>
                                    <th>Total Distance</th>
                                    <th>Diesel (L)</th>
                                    <th>AdBlue (L)</th>
                                    <th>Fuel Cost</th>
                                    <th>Avg Mileage</th>
                                    <th>Last Refuel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLUMN_COUNT} className="driver-empty-state">
                                            No driver fuel data found.
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
                                                <div className="cell-primary">{row.totalRefuels || 0}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalDistanceKm === 'number' ? `${formatNumber(row.totalDistanceKm)} km` : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{formatNumber(row.totalDieselLiters, 1)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{formatNumber(row.totalAdBlueLiters, 1)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{formatCurrency(row.totalFuelCost)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.avgMileageKmPerL === 'number' ? `${row.avgMileageKmPerL.toFixed(2)} km/L` : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{formatDate(row.lastRefuelAt)}</div>
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
