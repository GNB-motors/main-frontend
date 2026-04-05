import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Alert
} from '@mui/material';
import {
    Pagination, PaginationContent, PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import TableShimmer from '@/components/ui/TableShimmer';
import { ReportsService } from '../ReportsService.jsx';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';

// --- VehicleReport COMPONENT (Uses fetched data) ---
const VehicleReport = () => {
    const [vehicleReportData, setVehicleReportData] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehicleError, setVehicleError] = useState(null);
    const [searchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchVehicleReports = async () => {
            setIsLoadingVehicles(true);
            setVehicleError(null);
            try {
                const data = await ReportsService.getVehicleReports();
                setVehicleReportData(data);
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


    const filteredRows = useMemo(() => {
        let rows = vehicleReportData;

        // Filter by search text - updated to use 'id' field
        if (searchText) {
            const lowerSearchText = searchText.toLowerCase();
            rows = rows.filter((row) => row.id?.toLowerCase().includes(lowerSearchText));
        }

        return rows;
    }, [vehicleReportData, searchText]);

    // Pagination
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRows.slice(start, start + itemsPerPage);
    }, [filteredRows, currentPage, itemsPerPage]);

    useEffect(() => { setCurrentPage(1); }, [searchText]);

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

            </div>

            {isLoadingVehicles && (
                <div className="report-content">
                    <TableShimmer columns={17} rows={10} />
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
                                    <th>Journeys</th>
                                    <th>WS Trips</th>
                                    <th>Distance</th>
                                    <th>Diesel (L)</th>
                                    <th>Diesel Cost</th>
                                    <th>AdBlue (L)</th>
                                    <th>AdBlue Cost</th>
                                    <th>Revenue</th>
                                    <th>Expenses</th>
                                    <th>Profit</th>
                                    <th>Efficiency</th>
                                    <th>Cost/KM</th>
                                    <th>Rev/KM</th>
                                    <th>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={17} className="vehicle-empty-state">
                                            No vehicle summary data found. Try adjusting your filters.
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
                                                <div className="cell-primary">{row.totalJourneys || '-'}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{row.totalWeightSlipTrips || '-'}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalDistanceKm === 'number'
                                                        ? row.totalDistanceKm.toLocaleString('en-IN', { maximumFractionDigits: 0 })
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalDieselLiters === 'number' ? row.totalDieselLiters.toFixed(1) : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalDieselCost === 'number'
                                                        ? `₹${row.totalDieselCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalAdBlueLiters === 'number' ? row.totalAdBlueLiters.toFixed(1) : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.totalAdBlueCost === 'number'
                                                        ? `₹${row.totalAdBlueCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
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
                                                    {typeof row.averageEfficiencyKmpl === 'number' ? row.averageEfficiencyKmpl.toFixed(2) : 'N/A'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.costPerKm === 'number' ? `₹${row.costPerKm.toFixed(2)}` : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.revenuePerKm === 'number' ? `₹${row.revenuePerKm.toFixed(2)}` : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">
                                                    {typeof row.profitMargin === 'number' ? `${row.profitMargin.toFixed(1)}%` : 'N/A'}
                                                </div>
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

export default VehicleReport;