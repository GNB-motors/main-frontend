import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, CircularProgress, Alert,
    IconButton, Slider
} from '@mui/material';
import { ChevronDown, ChevronUp, ChevronRight, TrendingUp, Wallet, Percent, MapPin, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Pagination, PaginationContent, PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { ReportsService } from '../ReportsService.jsx';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';
import { DriverService } from '../../Drivers/DriverService';

// --- Summary Card Component (KPI Card from Figma) ---
const SummaryCard = ({ icon: Icon, label, value, iconColor = '#2F58EE' }) => {
    return (
        <div className="trip-ledger-kpi-card">
            <div className="trip-ledger-kpi-icon" style={{ background: `rgba(47, 88, 238, 0.10)` }}>
                <Icon size={16} color={iconColor} />
            </div>
            <div className="trip-ledger-kpi-content">
                <span className="trip-ledger-kpi-label">{label}</span>
                <span className="trip-ledger-kpi-value">{value}</span>
            </div>
        </div>
    );
};

// --- Main Trip Ledger Report Component ---
const TripLedgerReport = () => {
    const navigate = useNavigate();
    // Data states
    const [ledgerData, setLedgerData] = useState([]);
    const [summaryData, setSummaryData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [isLoadingLedger, setIsLoadingLedger] = useState(true);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [ledgerError, setLedgerError] = useState(null);
    const [summaryError, setSummaryError] = useState(null);

    // Filter states
    const [selectedDriver, setSelectedDriver] = useState('all');
    const [selectedVehicle, setSelectedVehicle] = useState('all');
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [profitRange, setProfitRange] = useState([-1000000, 10000000]);
    const [minProfit, setMinProfit] = useState(-1000000);
    const [maxProfit, setMaxProfit] = useState(10000000);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Expandable row states

    // Fetch ledger data
    useEffect(() => {
        const fetchLedgerData = async () => {
            setIsLoadingLedger(true);
            setLedgerError(null);
            try {
                const data = await ReportsService.getTripLedger();
                setLedgerData(data);
                
                // Calculate profit range from data
                if (data.length > 0) {
                    const profits = data.map(d => d.performance?.netProfit || 0);
                    const min = Math.min(...profits);
                    const max = Math.max(...profits);
                    setMinProfit(min);
                    setMaxProfit(max);
                    setProfitRange([min, max]);
                }
            } catch (err) {
                console.error("Failed to fetch trip ledger:", err);
                setLedgerError(err.detail || "Could not load trip ledger data.");
            } finally {
                setIsLoadingLedger(false);
            }
        };

        fetchLedgerData();
    }, []);

    // Fetch summary data
    useEffect(() => {
        const fetchSummaryData = async () => {
            setIsLoadingSummary(true);
            setSummaryError(null);
            try {
                const data = await ReportsService.getTripLedgerSummary();
                setSummaryData(data);
            } catch (err) {
                console.error("Failed to fetch trip ledger summary:", err);
                setSummaryError(err.detail || "Could not load summary data.");
            } finally {
                setIsLoadingSummary(false);
            }
        };

        fetchSummaryData();
    }, []);

    // Fetch employees (drivers)
    useEffect(() => {
        const fetchEmployees = async () => {
            setIsLoadingEmployees(true);
            try {
                const data = await DriverService.getAllDrivers(null, { limit: 100 });
                const driverList = Array.isArray(data?.data || data) ? (data?.data || data) : [];
                setEmployees(driverList);
            } catch (err) {
                console.error("Failed to fetch employees:", err);
                setEmployees([]);
            } finally {
                setIsLoadingEmployees(false);
            }
        };

        fetchEmployees();
    }, []);

    // Fetch vehicles
    useEffect(() => {
        const fetchVehicles = async () => {
            setIsLoadingVehicles(true);
            try {
                const data = await DriverService.getAvailableVehicles(null);
                setVehicles(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch vehicles:", err);
                setVehicles([]);
            } finally {
                setIsLoadingVehicles(false);
            }
        };

        fetchVehicles();
    }, []);

    // Extract unique options for filters from API data
    const driverOptions = useMemo(() => {
        return employees
            .map(emp => `${emp.firstName || ''} ${emp.lastName || ''}`.trim())
            .filter(Boolean)
            .sort();
    }, [employees]);

    const vehicleOptions = useMemo(() => {
        return vehicles
            .map(vehicle => vehicle.registrationNumber || '')
            .filter(Boolean)
            .sort();
    }, [vehicles]);

    const routeOptions = useMemo(() => {
        const routes = [...new Set(ledgerData.map(d => d.route?.name).filter(Boolean))];
        return routes.sort();
    }, [ledgerData]);

    // Filter data
    const filteredData = useMemo(() => {
        let rows = ledgerData;

        // Filter by driver
        if (selectedDriver && selectedDriver !== 'all') {
            rows = rows.filter(row => row.driver?.fullName === selectedDriver);
        }

        // Filter by vehicle
        if (selectedVehicle && selectedVehicle !== 'all') {
            rows = rows.filter(row => row.vehicle?.registrationNumber === selectedVehicle);
        }

        // Filter by route
        if (selectedRoute && selectedRoute !== 'all') {
            rows = rows.filter(row => row.route?.name === selectedRoute);
        }

        // Filter by profit range
        rows = rows.filter(row => {
            const profit = row.performance?.netProfit || 0;
            return profit >= profitRange[0] && profit <= profitRange[1];
        });

        return rows;
    }, [ledgerData, selectedDriver, selectedVehicle, selectedRoute, profitRange]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDriver, selectedVehicle, selectedRoute, profitRange]);

    // Navigate to trip detail page
    const handleViewTripDetail = (row) => {
        navigate(`/reports/trip/${row._id}`, { state: { trip: row } });
    };

    // Format helpers
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '-';
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return dayjs(dateStr).format('DD MMM YYYY');
    };

    const formatWeight = (value) => {
        if (typeof value !== 'number') return '-';
        return `${value.toLocaleString('en-IN')} kg`;
    };

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

    // Export to CSV
    const handleExportCSV = () => {
        const headers = ['Trip No', 'Date', 'Driver', 'Vehicle', 'Route', 'Net Weight (kg)', 'Revenue (₹)', 'Expense (₹)', 'Profit (₹)', 'Margin (%)'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                row.tripNumber || '-',
                row.tripDate ? dayjs(row.tripDate).format('DD/MM/YYYY') : '-',
                row.driver?.fullName || '-',
                row.vehicle?.registrationNumber || '-',
                row.route?.name || '-',
                row.weights?.netWeight || 0,
                row.performance?.totalRevenue || 0,
                row.performance?.totalExpense || 0,
                row.performance?.netProfit || 0,
                row.performance?.profitMargin?.toFixed(2) || 0
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trip_ledger_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    // Export to Excel
    const handleExportExcel = () => {
        // Using CSV format with .xlsx extension (for basic Excel support)
        const headers = ['Trip No', 'Date', 'Driver', 'Vehicle', 'Route', 'Net Weight (kg)', 'Revenue (₹)', 'Expense (₹)', 'Profit (₹)', 'Margin (%)'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                row.tripNumber || '-',
                row.tripDate ? dayjs(row.tripDate).format('DD/MM/YYYY') : '-',
                row.driver?.fullName || '-',
                row.vehicle?.registrationNumber || '-',
                row.route?.name || '-',
                row.weights?.netWeight || 0,
                row.performance?.totalRevenue || 0,
                row.performance?.totalExpense || 0,
                row.performance?.netProfit || 0,
                row.performance?.profitMargin?.toFixed(2) || 0
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trip_ledger_${dayjs().format('YYYY-MM-DD')}.xlsx`;
        link.click();
    };

    return (
        <Box sx={{ padding: '24px' }}>
            {/* Header Section */}
            <div className="report-header-section">
                <div className="report-header-top">
                    <h3 className="report-title">Trip Report</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={handleExportCSV}
                            className="export-btn"
                            title="Export to CSV"
                        >
                            <CsvIcon width={24} height={24} />
                        </button>
                        <button 
                            onClick={handleExportExcel}
                            className="export-btn"
                            title="Export to Excel"
                        >
                            <ExcelIcon width={22} height={22} />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="trip-ledger-summary-cards">
                    {isLoadingSummary ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : summaryError ? (
                        <Alert severity="error" sx={{ width: '100%' }}>{summaryError}</Alert>
                    ) : summaryData && (
                        <>
                            <SummaryCard 
                                icon={DollarSign} 
                                label="Total Revenue" 
                                value={formatCurrency(summaryData.totalRevenue)}
                                iconColor="#2F58EE"
                            />
                            <SummaryCard 
                                icon={Wallet} 
                                label="Total Expense" 
                                value={formatCurrency(summaryData.totalExpense)}
                                iconColor="#EE2F2F"
                            />
                            <SummaryCard 
                                icon={TrendingUp} 
                                label="Total Profit" 
                                value={formatCurrency(summaryData.totalProfit)}
                                iconColor="#2ECC71"
                            />
                            <SummaryCard 
                                icon={Percent} 
                                label="Avg Margin" 
                                value={`${summaryData.avgProfitMargin?.toFixed(2) || 0}%`}
                                iconColor="#F39C12"
                            />
                            <SummaryCard 
                                icon={MapPin} 
                                label="Total Distance" 
                                value={`${summaryData.totalDistanceKm?.toLocaleString('en-IN') || 0} km`}
                                iconColor="#9B59B6"
                            />
                        </>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="report-filters trip-ledger-filters">
                    <div className="date-input-group">
                        <label>Driver</label>
                        <Select value={selectedDriver} onValueChange={setSelectedDriver} disabled={isLoadingEmployees}>
                            <SelectTrigger className="h-10 w-[180px] text-sm">
                                <SelectValue>
                                    {isLoadingEmployees ? 'Loading...' : selectedDriver === 'all' ? 'All Drivers' : selectedDriver}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectItem value="all">All Drivers</SelectItem>
                                {driverOptions.map((driver) => (
                                    <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="date-input-group">
                        <label>Vehicle</label>
                        <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={isLoadingVehicles}>
                            <SelectTrigger className="h-10 w-[180px] text-sm">
                                <SelectValue>
                                    {isLoadingVehicles ? 'Loading...' : selectedVehicle === 'all' ? 'All Vehicles' : selectedVehicle}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectItem value="all">All Vehicles</SelectItem>
                                {vehicleOptions.map((vehicle) => (
                                    <SelectItem key={vehicle} value={vehicle}>{vehicle}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="date-input-group">
                        <label>Route</label>
                        <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                            <SelectTrigger className="h-10 w-[220px] text-sm">
                                <SelectValue>
                                    {selectedRoute === 'all' ? 'All Routes' : selectedRoute}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectItem value="all">All Routes</SelectItem>
                                {routeOptions.map((route) => (
                                    <SelectItem key={route} value={route}>{route}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="date-input-group profit-range-filter">
                        <label>Profit Range</label>
                        <Box sx={{ width: 180, px: 1 }}>
                            <Slider
                                value={profitRange}
                                onChange={(e, newValue) => setProfitRange(newValue)}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => `₹${(value / 1000).toFixed(0)}K`}
                                min={minProfit}
                                max={maxProfit}
                                size="small"
                            />
                        </Box>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoadingLedger && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading trips...</Typography>
                </Box>
            )}

            {/* Error State */}
            {ledgerError && !isLoadingLedger && (
                <Alert severity="error" sx={{ my: 2 }}>{ledgerError}</Alert>
            )}

            {/* Table Content */}
            {!isLoadingLedger && !ledgerError && (
                <div className="report-content">
                    <div className="table-wrapper">
                        <table className="trip-ledger-table">
                            <thead>
                                <tr className="table-header-row">
                                    <th>Trip No</th>
                                    <th>Date</th>
                                    <th>Driver</th>
                                    <th>Vehicle</th>
                                    <th>Route</th>
                                    <th style={{ textAlign: 'right' }}>Net Wt</th>
                                    <th style={{ textAlign: 'right' }}>Revenue</th>
                                    <th style={{ textAlign: 'right' }}>Expense</th>
                                    <th style={{ textAlign: 'right' }}>Profit</th>
                                    <th style={{ textAlign: 'right' }}>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="trip-ledger-empty-state">
                                            No trips found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((row) => (
                                        <tr
                                            key={row._id}
                                            className="trip-table-row"
                                            onClick={() => handleViewTripDetail(row)}
                                        >
                                            <td>
                                                <div className="cell-primary">{row.tripNumber || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{formatDate(row.tripDate)}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.driver?.fullName || '-'}</div>
                                                <div className="cell-secondary">{row.driver?.mobileNumber || ''}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.vehicle?.registrationNumber || '-'}</div>
                                                <div className="cell-secondary">{row.vehicle?.vehicleType || ''}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.route?.name || '-'}</div>
                                                <div className="cell-secondary">{row.route?.distanceKm ? `${row.route.distanceKm} km` : ''}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary">{formatWeight(row.weights?.netWeight)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary positive">{formatCurrency(row.performance?.totalRevenue)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="cell-primary negative">{formatCurrency(row.performance?.totalExpense)}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className={`cell-primary ${row.performance?.netProfit >= 0 ? 'positive' : 'negative'}`}>
                                                    {formatCurrency(row.performance?.netProfit)}
                                                </div>
                                            </td>
                                            <td className="last-col" style={{ textAlign: 'right' }}>
                                                <span className="date-text">
                                                    {typeof row.performance?.profitMargin === 'number'
                                                        ? `${row.performance.profitMargin.toFixed(1)}%`
                                                        : '-'}
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

                    {/* Pagination */}
                    {filteredData.length > 0 && totalPages > 1 && (
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

export default TripLedgerReport;
