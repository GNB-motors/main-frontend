import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment,
    Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { ReportsService } from '../ReportsService.jsx'; // Adjusted path
import { months } from '../../../utils/mockdata.jsx'; // Adjusted path
import SearchableDropdown from '../../../components/SearchableDropdown/SearchableDropdown.jsx';

// --- TripReport COMPONENT (Uses fetched data) ---
const TripReport = ({}) => {
    const [tripData, setTripData] = useState([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);
    const [tripError, setTripError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedRoute, setSelectedRoute] = useState('');
    const [routeOptions, setRouteOptions] = useState([]);
    
    useEffect(() => {
        const fetchTrips = async () => {
            setIsLoadingTrips(true);
            setTripError(null);
            try {
                const data = await ReportsService.getTripReports();
                setTripData(data);
                
                // Extract unique routes from trip data
                const uniqueRoutes = [...new Set(data.map(trip => trip.route).filter(Boolean))];
                setRouteOptions(uniqueRoutes);
                
                console.log("Trip Reports Fetched:", data);
            } catch (err) {
                console.error("Failed to fetch trip reports:", err);
                setTripError(err.detail || "Could not load trip reports.");
                setTripData([]);
            } finally {
                setIsLoadingTrips(false);
            }
        };

        fetchTrips();
    }, []);
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
        const startDate = dateRange[0];
        const endDate = dateRange[1];
        if (startDate || endDate) {
            rows = rows.filter(row => {
                if (!row.tripDate) return false;
                const rowStartDate = dayjs(row.tripDate);
                const afterStart = startDate ? rowStartDate.isAfter(startDate.subtract(1, 'day')) : true;
                const beforeEnd = endDate ? rowStartDate.isBefore(endDate.add(1, 'day')) : true;
                return afterStart && beforeEnd;
            });
        }

        // Filter by employee name - updated to use driverName
        if (selectedEmployee !== '') {
            rows = rows.filter(row => row.driverName === selectedEmployee);
        }

        // Filter by route
        if (selectedRoute !== '') {
            rows = rows.filter(row => row.route === selectedRoute);
        }

        return rows;
    }, [tripData, searchText, dateRange, selectedEmployee, selectedRoute]);

    const handleRouteSelect = (route) => {
        setSelectedRoute(route);
    };

    const handleAddNewRoute = (newRoute) => {
        // Add the new route to the options
        setRouteOptions(prev => [...prev, newRoute]);
        setSelectedRoute(newRoute);
        console.log("New route added:", newRoute);
    };

    const handleClearRoute = () => {
        setSelectedRoute('');
    };
    return (
        <Box>
            {/* Header Section */}
            <div className="report-header-section">
                <div className="report-header-top">
                    <h3 className="report-title">Trip Report</h3>
                    {/* <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Search Driver/Vehicle..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 250 }}
                    /> */}
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
                                {[...new Set(tripData.map(trip => trip.driver_name))].map((driver) => (
                                    <MenuItem key={driver} value={driver}>
                                        {driver || 'N/A'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>

                    <div className="date-input-group">
                        <label>Route</label>
                        <div style={{ minWidth: 200, position: 'relative' }}>
                            <SearchableDropdown
                                options={routeOptions}
                                selectedOption={selectedRoute}
                                onSelect={handleRouteSelect}
                                onAddNew={handleAddNewRoute}
                                placeholder="All Routes"
                                addNewLabel="Create new route"
                            />
                            {selectedRoute && (
                                <button
                                    onClick={handleClearRoute}
                                    style={{
                                        position: 'absolute',
                                        right: '32px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 5
                                    }}
                                    title="Clear selection"
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path
                                            d="M2 2L12 12M12 2L2 12"
                                            stroke="#666"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isLoadingTrips && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading trip data...</Typography>
                </Box>
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