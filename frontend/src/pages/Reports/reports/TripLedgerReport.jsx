import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, FormControl, Select, MenuItem, CircularProgress, Alert,
    IconButton, Slider, Collapse
} from '@mui/material';
import { ChevronDown, ChevronUp, TrendingUp, Wallet, Percent, MapPin, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import { ReportsService } from '../ReportsService.jsx';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';

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

// --- Expandable Trip Detail Row Component ---
const TripDetailRow = ({ tripData, isLoading }) => {
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '-';
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const formatWeight = (value) => {
        if (typeof value !== 'number') return '-';
        return `${value.toLocaleString('en-IN')} kg`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return dayjs(dateStr).format('DD MMM YYYY');
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    if (!tripData) {
        return (
            <Box sx={{ padding: 3, textAlign: 'center', color: '#8b8b8c' }}>
                No trip details available.
            </Box>
        );
    }

    return (
        <div className="trip-detail-content">
            <div className="trip-detail-grid">
                {/* Trip Info Section */}
                <div className="detail-section">
                    <h4 className="detail-section-title">Trip Information</h4>
                    <div className="detail-info-grid">
                        <div className="detail-info-item">
                            <span className="detail-info-label">Trip Number</span>
                            <span className="detail-info-value">{tripData.tripNumber || '-'}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Trip Date</span>
                            <span className="detail-info-value">{formatDate(tripData.tripDate)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Status</span>
                            <span className={`detail-info-value status-badge ${tripData.status?.toLowerCase()}`}>
                                {tripData.status || '-'}
                            </span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Material Type</span>
                            <span className="detail-info-value">{tripData.materialType || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Driver & Vehicle Section */}
                <div className="detail-section">
                    <h4 className="detail-section-title">Driver & Vehicle</h4>
                    <div className="detail-info-grid">
                        <div className="detail-info-item">
                            <span className="detail-info-label">Driver</span>
                            <span className="detail-info-value">{tripData.driver?.fullName || '-'}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Mobile</span>
                            <span className="detail-info-value">{tripData.driver?.mobileNumber || '-'}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Vehicle</span>
                            <span className="detail-info-value">{tripData.vehicle?.registrationNumber || '-'}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Vehicle Type</span>
                            <span className="detail-info-value">{tripData.vehicle?.vehicleType || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Route Section */}
                <div className="detail-section">
                    <h4 className="detail-section-title">Route Details</h4>
                    <div className="detail-info-grid">
                        <div className="detail-info-item">
                            <span className="detail-info-label">Route Name</span>
                            <span className="detail-info-value">{tripData.route?.name || '-'}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">From</span>
                            <span className="detail-info-value">{tripData.route?.sourceLocation?.city || '-'}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">To</span>
                            <span className="detail-info-value">{tripData.route?.destLocation?.city || '-'}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Distance</span>
                            <span className="detail-info-value">{tripData.route?.distanceKm ? `${tripData.route.distanceKm} km` : '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Weight Section */}
                <div className="detail-section">
                    <h4 className="detail-section-title">Weight Details</h4>
                    <div className="detail-info-grid">
                        <div className="detail-info-item">
                            <span className="detail-info-label">Gross Weight</span>
                            <span className="detail-info-value">{formatWeight(tripData.weights?.grossWeight)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Tare Weight</span>
                            <span className="detail-info-value">{formatWeight(tripData.weights?.tareWeight)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Net Weight</span>
                            <span className="detail-info-value highlight">{formatWeight(tripData.weights?.netWeight)}</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Section */}
                <div className="detail-section">
                    <h4 className="detail-section-title">Revenue</h4>
                    <div className="detail-info-grid">
                        <div className="detail-info-item">
                            <span className="detail-info-label">Rate per Kg</span>
                            <span className="detail-info-value">{formatCurrency(tripData.revenue?.ratePerKg)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Calculated Amount</span>
                            <span className="detail-info-value">{formatCurrency(tripData.revenue?.calculatedAmount)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Amount Received</span>
                            <span className="detail-info-value highlight">{formatCurrency(tripData.revenue?.actualAmountReceived)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Variance</span>
                            <span className={`detail-info-value ${tripData.revenue?.variance >= 0 ? 'positive' : 'negative'}`}>
                                {formatCurrency(tripData.revenue?.variance)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="detail-section">
                    <h4 className="detail-section-title">Expenses Breakdown</h4>
                    <div className="detail-info-grid">
                        <div className="detail-info-item">
                            <span className="detail-info-label">Material Cost</span>
                            <span className="detail-info-value">{formatCurrency(tripData.expenses?.materialCost)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Toll</span>
                            <span className="detail-info-value">{formatCurrency(tripData.expenses?.toll)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Driver Cost</span>
                            <span className="detail-info-value">{formatCurrency(tripData.expenses?.driverCost)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Driver Trip Expense</span>
                            <span className="detail-info-value">{formatCurrency(tripData.expenses?.driverTripExpense)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Royalty</span>
                            <span className="detail-info-value">{formatCurrency(tripData.expenses?.royalty)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Fuel Cost</span>
                            <span className="detail-info-value">{formatCurrency(tripData.expenses?.allocatedFuelCost)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Total Expense</span>
                            <span className="detail-info-value highlight">{formatCurrency(tripData.expenses?.totalExpense)}</span>
                        </div>
                    </div>
                </div>

                {/* Performance Section */}
                <div className="detail-section">
                    <h4 className="detail-section-title">Performance</h4>
                    <div className="detail-info-grid">
                        <div className="detail-info-item">
                            <span className="detail-info-label">Total Revenue</span>
                            <span className="detail-info-value positive">{formatCurrency(tripData.performance?.totalRevenue)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Total Expense</span>
                            <span className="detail-info-value negative">{formatCurrency(tripData.performance?.totalExpense)}</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Net Profit</span>
                            <span className={`detail-info-value highlight ${tripData.performance?.netProfit >= 0 ? 'positive' : 'negative'}`}>
                                {formatCurrency(tripData.performance?.netProfit)}
                            </span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Profit Margin</span>
                            <span className={`detail-info-value ${tripData.performance?.profitMargin >= 0 ? 'positive' : 'negative'}`}>
                                {typeof tripData.performance?.profitMargin === 'number' ? `${tripData.performance.profitMargin.toFixed(2)}%` : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Fuel Section */}
                {tripData.fuelConsumed && tripData.fuelConsumed.length > 0 && (
                    <div className="detail-section">
                        <h4 className="detail-section-title">Fuel Consumption</h4>
                        <div className="detail-info-grid">
                            {tripData.fuelConsumed.map((fuel, index) => (
                                <React.Fragment key={index}>
                                    <div className="detail-info-item">
                                        <span className="detail-info-label">Litres</span>
                                        <span className="detail-info-value">{fuel.litres} L</span>
                                    </div>
                                    <div className="detail-info-item">
                                        <span className="detail-info-label">Cost</span>
                                        <span className="detail-info-value">{formatCurrency(fuel.cost)}</span>
                                    </div>
                                    <div className="detail-info-item">
                                        <span className="detail-info-label">Fuel Type</span>
                                        <span className="detail-info-value">{fuel.fuelType || '-'}</span>
                                    </div>
                                    <div className="detail-info-item">
                                        <span className="detail-info-label">Source</span>
                                        <span className="detail-info-value">{fuel.source || '-'}</span>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {/* Odometer Section */}
                <div className="detail-section">
                    <h4 className="detail-section-title">Odometer & Mileage</h4>
                    <div className="detail-info-grid">
                        <div className="detail-info-item">
                            <span className="detail-info-label">Start Odometer</span>
                            <span className="detail-info-value">{tripData.journeyOdometer?.startOdometer?.toLocaleString('en-IN') || '-'} km</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">End Odometer</span>
                            <span className="detail-info-value">{tripData.journeyOdometer?.endOdometer?.toLocaleString('en-IN') || '-'} km</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Total Distance</span>
                            <span className="detail-info-value">{tripData.journeyOdometer?.totalDistanceKm || '-'} km</span>
                        </div>
                        <div className="detail-info-item">
                            <span className="detail-info-label">Mileage</span>
                            <span className="detail-info-value">{tripData.mileage?.kmPerLitre?.toFixed(2) || '-'} km/L</span>
                        </div>
                    </div>
                </div>

                {/* Weight Certificate Image */}
                {tripData.weightCertificateDoc?.publicUrl && (
                    <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                        <h4 className="detail-section-title">Weight Certificate</h4>
                        <img 
                            src={tripData.weightCertificateDoc.publicUrl} 
                            alt="Weight Certificate" 
                            className="detail-certificate-image"
                            onClick={() => window.open(tripData.weightCertificateDoc.publicUrl, '_blank')}
                        />
                        <span className="detail-image-hint">Click to view full size</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Trip Ledger Report Component ---
const TripLedgerReport = () => {
    // Data states
    const [ledgerData, setLedgerData] = useState([]);
    const [summaryData, setSummaryData] = useState(null);
    const [isLoadingLedger, setIsLoadingLedger] = useState(true);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [ledgerError, setLedgerError] = useState(null);
    const [summaryError, setSummaryError] = useState(null);

    // Filter states
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [selectedRoute, setSelectedRoute] = useState('');
    const [profitRange, setProfitRange] = useState([-1000000, 10000000]);
    const [minProfit, setMinProfit] = useState(-1000000);
    const [maxProfit, setMaxProfit] = useState(10000000);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Expandable row states
    const [expandedTripId, setExpandedTripId] = useState(null);
    const [expandedTripData, setExpandedTripData] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

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

    // Extract unique options for filters
    const driverOptions = useMemo(() => {
        const drivers = [...new Set(ledgerData.map(d => d.driver?.fullName).filter(Boolean))];
        return drivers.sort();
    }, [ledgerData]);

    const vehicleOptions = useMemo(() => {
        const vehicles = [...new Set(ledgerData.map(d => d.vehicle?.registrationNumber).filter(Boolean))];
        return vehicles.sort();
    }, [ledgerData]);

    const routeOptions = useMemo(() => {
        const routes = [...new Set(ledgerData.map(d => d.route?.name).filter(Boolean))];
        return routes.sort();
    }, [ledgerData]);

    // Filter data
    const filteredData = useMemo(() => {
        let rows = ledgerData;

        // Filter by driver
        if (selectedDriver) {
            rows = rows.filter(row => row.driver?.fullName === selectedDriver);
        }

        // Filter by vehicle
        if (selectedVehicle) {
            rows = rows.filter(row => row.vehicle?.registrationNumber === selectedVehicle);
        }

        // Filter by route
        if (selectedRoute) {
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

    // Handle view trip details
    const handleToggleTripDetail = async (tripId) => {
        // If clicking the same row, collapse it
        if (expandedTripId === tripId) {
            setExpandedTripId(null);
            setExpandedTripData(null);
            return;
        }

        // Expand new row
        setExpandedTripId(tripId);
        setIsLoadingDetail(true);
        try {
            const tripDetail = await ReportsService.getTripLedgerById(tripId);
            setExpandedTripData(tripDetail);
        } catch (err) {
            console.error("Failed to fetch trip details:", err);
            setExpandedTripData(null);
        } finally {
            setIsLoadingDetail(false);
        }
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

    // Generate page numbers
    const generatePageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 7;
        
        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        
        return pages;
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
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <Select
                                value={selectedDriver}
                                onChange={(e) => setSelectedDriver(e.target.value)}
                                displayEmpty
                                renderValue={(value) => value || 'All'}
                            >
                                <MenuItem value="">All</MenuItem>
                                {driverOptions.map((driver) => (
                                    <MenuItem key={driver} value={driver}>{driver}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>

                    <div className="date-input-group">
                        <label>Vehicle</label>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <Select
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                                displayEmpty
                                renderValue={(value) => value || 'All'}
                            >
                                <MenuItem value="">All</MenuItem>
                                {vehicleOptions.map((vehicle) => (
                                    <MenuItem key={vehicle} value={vehicle}>{vehicle}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>

                    <div className="date-input-group">
                        <label>Route</label>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <Select
                                value={selectedRoute}
                                onChange={(e) => setSelectedRoute(e.target.value)}
                                displayEmpty
                                renderValue={(value) => value || 'All Routes'}
                            >
                                <MenuItem value="">All Routes</MenuItem>
                                {routeOptions.map((route) => (
                                    <MenuItem key={route} value={route}>{route}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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
                    <div className="trip-ledger-table-container">
                        <table className="trip-ledger-table">
                            <thead>
                                <tr>
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
                                    <th style={{ textAlign: 'center', width: '80px' }}>View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="trip-ledger-empty-state">
                                            No trips found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((row) => {
                                        const isExpanded = expandedTripId === row._id;
                                        return (
                                            <React.Fragment key={row._id}>
                                                <tr 
                                                    onClick={() => handleToggleTripDetail(row._id)}
                                                    style={{ cursor: 'pointer' }}
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
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className={`cell-primary ${row.performance?.profitMargin >= 0 ? 'positive' : 'negative'}`}>
                                                            {typeof row.performance?.profitMargin === 'number' 
                                                                ? `${row.performance.profitMargin.toFixed(1)}%` 
                                                                : '-'}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button 
                                                            className={`trip-ledger-view-btn ${isExpanded ? 'expanded' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleTripDetail(row._id);
                                                            }}
                                                            title={isExpanded ? "Hide Details" : "View Details"}
                                                        >
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="trip-detail-row">
                                                        <td colSpan={11} className="trip-detail-cell">
                                                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                                <TripDetailRow 
                                                                    tripData={expandedTripData} 
                                                                    isLoading={isLoadingDetail}
                                                                />
                                                            </Collapse>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredData.length > 0 && (
                        <div className="trip-ledger-pagination">
                            <span className="pagination-info">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                            </span>
                            <div className="pagination-controls">
                                <button 
                                    className="pagination-btn" 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    ←
                                </button>
                                {generatePageNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                                <button 
                                    className="pagination-btn" 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Box>
    );
};

export default TripLedgerReport;
