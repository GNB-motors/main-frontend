import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Alert
} from '@mui/material';
import dayjs from 'dayjs';
import {
    Pagination, PaginationContent, PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import TableShimmer from '@/components/ui/TableShimmer';
import { ReportsService } from '../ReportsService.jsx';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';

const COLUMN_COUNT = 13;

const formatNumber = (value, digits = 0) =>
    typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: digits }) : '-';

const formatCurrency = (value) =>
    typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-';

const formatDate = (value) => (value ? dayjs(value).format('DD MMM YYYY') : '-');

// --- VehicleReport COMPONENT (aggregated from refuel logs) ---
const VehicleReport = () => {
    const [vehicleReportData, setVehicleReportData] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehicleError, setVehicleError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchVehicleReports = async () => {
            setIsLoadingVehicles(true);
            setVehicleError(null);
            try {
                const data = await ReportsService.getVehicleReports();
                setVehicleReportData(Array.isArray(data) ? data : []);
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

    // Pagination
    const totalPages = Math.ceil(vehicleReportData.length / itemsPerPage) || 1;
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return vehicleReportData.slice(start, start + itemsPerPage);
    }, [vehicleReportData, currentPage, itemsPerPage]);

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
        const headers = ['Registration Number', 'Vehicle Type', 'Model', 'Refuels', 'Total Distance (KM)', 'Diesel (L)', 'Diesel Cost (₹)', 'AdBlue (L)', 'AdBlue Cost (₹)', 'Total Fuel Cost (₹)', 'Avg. Efficiency (km/L)', 'Cost per KM (₹)', 'Last Refuel'];
        return [
            headers.join(','),
            ...vehicleReportData.map(row => [
                row.registrationNumber || '-',
                row.vehicleType || '-',
                row.model || '-',
                row.totalRefuels || 0,
                typeof row.totalDistanceKm === 'number' ? row.totalDistanceKm.toFixed(0) : '-',
                typeof row.totalDieselLiters === 'number' ? row.totalDieselLiters.toFixed(1) : '-',
                typeof row.totalDieselCost === 'number' ? row.totalDieselCost.toFixed(2) : '-',
                typeof row.totalAdBlueLiters === 'number' ? row.totalAdBlueLiters.toFixed(1) : '-',
                typeof row.totalAdBlueCost === 'number' ? row.totalAdBlueCost.toFixed(2) : '-',
                typeof row.totalFuelCost === 'number' ? row.totalFuelCost.toFixed(2) : '-',
                typeof row.averageEfficiencyKmpl === 'number' ? row.averageEfficiencyKmpl.toFixed(2) : 'N/A',
                typeof row.costPerKm === 'number' ? row.costPerKm.toFixed(2) : '-',
                row.lastRefuelAt ? dayjs(row.lastRefuelAt).format('DD/MM/YYYY') : '-',
            ].join(','))
        ].join('\n');
    };

    const downloadCsv = (extension, mimeType) => {
        const blob = new Blob([buildCsv()], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vehicle_report_${dayjs().format('YYYY-MM-DD')}.${extension}`;
        link.click();
    };

    const handleExportCSV = () => downloadCsv('csv', 'text/csv;charset=utf-8;');
    const handleExportExcel = () => downloadCsv('xlsx', 'application/vnd.ms-excel;charset=utf-8;');

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
            </div>

            {isLoadingVehicles && (
                <div className="report-content">
                    <TableShimmer columns={COLUMN_COUNT} rows={10} />
                </div>
            )}

            {vehicleError && !isLoadingVehicles && <Alert severity="error" sx={{ my: 2 }}>{vehicleError}</Alert>}

            {!isLoadingVehicles && !vehicleError && (
                <div className="report-content">
                    <div className="table-wrapper">
                        <table className="vehicle-table">
                            <thead>
                                <tr className="table-header-row">
                                    <th>Reg Number</th>
                                    <th>Type</th>
                                    <th>Model</th>
                                    <th>Refuels</th>
                                    <th>Distance</th>
                                    <th>Diesel (L)</th>
                                    <th>Diesel Cost</th>
                                    <th>AdBlue (L)</th>
                                    <th>AdBlue Cost</th>
                                    <th>Total Fuel Cost</th>
                                    <th>Efficiency</th>
                                    <th>Cost/KM</th>
                                    <th>Last Refuel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLUMN_COUNT} className="vehicle-empty-state">
                                            No vehicle fuel data found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRows.map((row, index) => (
                                        <tr key={row.id || index} className="trip-table-row">
                                            <td>
                                                <div className="cell-primary">{row.registrationNumber || '-'}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="cell-primary">{row.vehicleType || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.model || '-'}</div>
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
                                                <div className="cell-primary">{formatCurrency(row.totalDieselCost)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{formatNumber(row.totalAdBlueLiters, 1)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{formatCurrency(row.totalAdBlueCost)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{formatCurrency(row.totalFuelCost)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.averageEfficiencyKmpl === 'number' ? `${row.averageEfficiencyKmpl.toFixed(2)} km/L` : 'N/A'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.costPerKm === 'number' ? `₹${row.costPerKm.toFixed(2)}` : '-'}
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

                    {vehicleReportData.length > 0 && totalPages > 1 && (
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

export default VehicleReport;
