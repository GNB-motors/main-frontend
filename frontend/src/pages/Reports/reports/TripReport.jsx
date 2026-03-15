import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Alert,
} from '@mui/material';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TableShimmer from '@/components/ui/TableShimmer';
import { ReportsService } from '../ReportsService.jsx';
import { CsvIcon, ExcelIcon } from '../../../components/Icons';

// --- TripReport COMPONENT (Uses fetched data) ---
const TripReport = ({}) => {
    const [tripData, setTripData] = useState([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);
    const [tripError, setTripError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
    const [tempDateRange, setTempDateRange] = useState({ from: new Date(), to: new Date() });
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [routeOptions, setRouteOptions] = useState([]);
    const [employeeOptions, setEmployeeOptions] = useState([]);

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

    useEffect(() => {
        const fetchTrips = async () => {
            setIsLoadingTrips(true);
            setTripError(null);
            try {
                const params = {};
                if (dateRange?.from) params.start_date = format(dateRange.from, 'yyyy-MM-dd');
                if (dateRange?.to) params.end_date = format(dateRange.to, 'yyyy-MM-dd');
                const data = await ReportsService.getTripReports(params);
                setTripData(data);

                const uniqueRoutes = [...new Set(data.map(trip => trip.route).filter(Boolean))];
                setRouteOptions(uniqueRoutes);
            } catch (err) {
                console.error("Failed to fetch trip reports:", err);
                setTripError(err.detail || "Could not load trip reports.");
                setTripData([]);
            } finally {
                setIsLoadingTrips(false);
            }
        };

        fetchTrips();
    }, [dateRange]);
    const tripColumns = useMemo(() => [
        { 
            field: 'tripDate', 
            headerName: 'Trip Date', 
            flex: 1, 
            type: 'date', 
            valueGetter: (value) => value ? dayjs(value).toDate() : null 
        },
        { 
            field: 'vehicleRegNo', 
            headerName: 'Vehicle', 
            flex: 1 
        },
        { 
            field: 'driverName', 
            headerName: 'Driver', 
            flex: 1.5, 
            valueGetter: (value) => value || 'N/A' 
        },
        { 
            field: 'route', 
            headerName: 'Route', 
            flex: 1.5 
        },
        { 
            field: 'status', 
            headerName: 'Status', 
            flex: 1, 
            align: 'center', 
            headerAlign: 'center',
            renderCell: (params) => (
                <span style={{ 
                    color: params.value === 'COMPLETED' ? 'green' : 'orange',
                    fontWeight: 500
                }}>
                    {params.value}
                </span>
            )
        },
        { 
            field: 'distanceKm', 
            headerName: 'Distance (KM)', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right', 
            valueFormatter: (value) => typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : '-' 
        },
        { 
            field: 'fuelLoggedLiters', 
            headerName: 'Fuel (L)', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right', 
            valueFormatter: (value) => typeof value === 'number' ? value.toFixed(1) : '-' 
        },
        { 
            field: 'fuelCost', 
            headerName: 'Fuel Cost (₹)', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right', 
            valueFormatter: (value) => typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : '-' 
        },
        { 
            field: 'impliedKmpl', 
            headerName: 'Mileage (km/l)', 
            type: 'number', 
            flex: 1, 
            align: 'right', 
            headerAlign: 'right', 
            valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : 'N/A' 
        },
    ], []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };
    const filteredRows = useMemo(() => {
        let rows = tripData;

        // Filter by search text - updated to use driverName and vehicleRegNo
        if (searchText) {
            const lowerSearchText = searchText.toLowerCase();
            rows = rows.filter(row =>
                row.driverName?.toLowerCase().includes(lowerSearchText) ||
                row.vehicleRegNo?.toLowerCase().includes(lowerSearchText)
            );
        }

        // Filter by date range - updated to use tripDate
        const startDate = dateRange?.from;
        const endDate = dateRange?.to;
        if (startDate || endDate) {
            rows = rows.filter(row => {
                if (!row.tripDate) return false;
                const rowDate = new Date(row.tripDate);
                const afterStart = startDate ? rowDate >= startDate : true;
                const beforeEnd = endDate ? rowDate <= endDate : true;
                return afterStart && beforeEnd;
            });
        }

        // Filter by employee name - updated to use driverName
        if (selectedEmployee && selectedEmployee !== 'all') {
            rows = rows.filter(row => row.driverName === selectedEmployee);
        }

        // Filter by route
        if (selectedRoute && selectedRoute !== 'all') {
            rows = rows.filter(row => row.route === selectedRoute);
        }

        return rows;
    }, [tripData, searchText, dateRange, selectedEmployee, selectedRoute]);

    // Export to CSV function
    const handleExportCSV = () => {
        const headers = ['Trip Date', 'Driver Name', 'Vehicle Reg No', 'Route', 'Start Location', 'End Location', 'Distance (KM)', 'Diesel (L)', 'Diesel Cost (₹)', 'Efficiency (km/l)'];
        const csvContent = [
            headers.join(','),
            ...filteredRows.map(row => [
                row.tripDate ? dayjs(row.tripDate).format('DD/MM/YYYY') : '-',
                row.driverName || '-',
                row.vehicleRegNo || '-',
                row.route || '-',
                row.startLocation || '-',
                row.endLocation || '-',
                typeof row.distanceKm === 'number' ? row.distanceKm.toFixed(0) : '-',
                typeof row.dieselLiters === 'number' ? row.dieselLiters.toFixed(1) : '-',
                typeof row.dieselCost === 'number' ? row.dieselCost.toFixed(2) : '-',
                typeof row.efficiencyKmpl === 'number' ? row.efficiencyKmpl.toFixed(2) : 'N/A'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trip_report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    // Export to Excel function
    const handleExportExcel = () => {
        const headers = ['Trip Date', 'Driver Name', 'Vehicle Reg No', 'Route', 'Start Location', 'End Location', 'Distance (KM)', 'Diesel (L)', 'Diesel Cost (₹)', 'Efficiency (km/l)'];
        const csvContent = [
            headers.join(','),
            ...filteredRows.map(row => [
                row.tripDate ? dayjs(row.tripDate).format('DD/MM/YYYY') : '-',
                row.driverName || '-',
                row.vehicleRegNo || '-',
                row.route || '-',
                row.startLocation || '-',
                row.endLocation || '-',
                typeof row.distanceKm === 'number' ? row.distanceKm.toFixed(0) : '-',
                typeof row.dieselLiters === 'number' ? row.dieselLiters.toFixed(1) : '-',
                typeof row.dieselCost === 'number' ? row.dieselCost.toFixed(2) : '-',
                typeof row.efficiencyKmpl === 'number' ? row.efficiencyKmpl.toFixed(2) : 'N/A'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trip_report_${dayjs().format('YYYY-MM-DD')}.xlsx`;
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
                        <Popover open={calendarOpen} onOpenChange={(open) => {
                            setCalendarOpen(open);
                            if (open) setTempDateRange(dateRange);
                        }}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 w-[280px] justify-start gap-2 pl-2 pr-3 text-sm font-normal bg-[#F8F8FB] border-[#ECECEE] hover:bg-[#F8F8FB]"
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
                                    defaultMonth={tempDateRange?.from}
                                    selected={tempDateRange}
                                    onSelect={setTempDateRange}
                                    numberOfMonths={2}
                                />
                                <div className="flex items-center justify-end gap-2 p-3 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCalendarOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setDateRange(tempDateRange);
                                            setCalendarOpen(false);
                                        }}
                                    >
                                        Apply
                                    </Button>
                                </div>
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
                                {employeeOptions.map((name) => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="date-input-group">
                        <label>Route</label>
                        <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                            <SelectTrigger className="h-10 w-[200px] text-sm">
                                <SelectValue>
                                    {selectedRoute === 'all' ? 'All Routes' : selectedRoute}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectItem value="all">All Routes</SelectItem>
                                {routeOptions.map((route) => (
                                    <SelectItem key={route} value={route}>
                                        {route}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {isLoadingTrips && (
                <div className="report-content">
                    <TableShimmer columns={10} rows={10} />
                </div>
            )}

            {tripError && !isLoadingTrips && <Alert severity="error" sx={{ my: 2 }}>{tripError}</Alert>}

            {!isLoadingTrips && !tripError && (
                <div className="report-content">
                    <div className="trip-table-container">
                        <table className="trip-table">
                            <thead>
                                <tr>
                                    <th>Trip Date</th>
                                    <th>Vehicle</th>
                                    <th>Driver</th>
                                    <th>Route</th>
                                    <th>Status</th>
                                    <th>Distance (KM)</th>
                                    <th>Fuel (L)</th>
                                    <th>Fuel Cost (₹)</th>
                                    <th>Mileage (km/l)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="trip-empty-state">
                                            No trips found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => (
                                        <tr key={row.id || index}>
                                            <td>
                                                <div className="cell-primary">{formatDate(row.tripDate)}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.vehicleRegNo || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.driverName || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="cell-primary">{row.route || '-'}</div>
                                            </td>
                                            <td>
                                                <div 
                                                    className="cell-primary" 
                                                    style={{ 
                                                        color: row.status === 'COMPLETED' ? 'green' : 'orange',
                                                        fontWeight: 500,
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {row.status || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.distanceKm === 'number' 
                                                        ? row.distanceKm.toLocaleString('en-IN', { maximumFractionDigits: 1 }) 
                                                        : '-'} km
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.fuelLoggedLiters === 'number' 
                                                        ? row.fuelLoggedLiters.toFixed(1) 
                                                        : '-'} L
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.fuelCost === 'number' 
                                                        ? `₹${row.fuelCost.toLocaleString('en-IN')}` 
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-primary" style={{ textAlign: 'right' }}>
                                                    {typeof row.impliedKmpl === 'number' 
                                                        ? row.impliedKmpl.toFixed(2) 
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

export default TripReport;