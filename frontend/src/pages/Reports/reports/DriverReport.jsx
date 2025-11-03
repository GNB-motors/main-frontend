import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, Alert
} from '@mui/material';
import { Search as SearchIcon, InfoOutlined, Star } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ReportsService } from '../ReportsService.jsx'; // Adjusted path

// --- **** DriverReport COMPONENT **** ---
const DriverReport = ({ businessRefId, isLoadingProfile, profileError, handleViewOutliers }) => {
    // State for fetched data, loading, and errors specific to this report
    const [driverReportData, setDriverReportData] = useState([]);
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
    const [driverError, setDriverError] = useState(null);

    // State for filters
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState([null, null]); // Keep date filters for UI consistency

    // Fetch Driver Data Effect
    useEffect(() => {
        // Check profile status first (from parent scope)
        if (isLoadingProfile || profileError || !businessRefId) {
            if (!isLoadingProfile) {
                setIsLoadingDrivers(false);
                if (profileError) setDriverError(`Profile Error: ${profileError}`);
                else if (!businessRefId) setDriverError("Business ID not found.");
            } else { setIsLoadingDrivers(true); }
            return;
        }

        const fetchDriverReports = async () => {
            setIsLoadingDrivers(true);
            setDriverError(null);
            try {
                const data = await ReportsService.getDriverReports(businessRefId);
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
        // Rerun fetch only when businessRefId changes (or profile status changes)
    }, [businessRefId, isLoadingProfile, profileError]);

    // Define columns based on DriverReportItem schema
    const driverColumns = useMemo(() => [
        { field: 'driver_name', headerName: 'Driver Name', flex: 1 },
        {
            field: 'total_kms_driven', headerName: 'Total KMs Driven', type: 'number', flex: 1, align: 'right', headerAlign: 'right',
            valueFormatter: (value) => typeof value === 'number' ? value.toFixed(1) : '-'
        }, // Format KMs
        { field: 'instances_driven', headerName: 'Instances Driven', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
        {
            field: 'average_variance', headerName: 'Avg. Variance', type: 'number', flex: 1, align: 'right', headerAlign: 'right',
            description: 'Avg. Mileage Variance (km/l)',
            valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : 'N/A', // Format variance
            renderCell: (params) => { // Color variance
                const value = params.value;
                if (typeof value !== 'number') return 'N/A';
                return (
                    <span style={{ color: value > 0 ? 'green' : (value < 0 ? 'red' : 'inherit') }}>
                        {value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}
                    </span>
                );
            }
        },
        {
            field: 'driver_rating', headerName: 'Rating (1-5)', flex: 1, align: 'right', headerAlign: 'right',
            type: 'number',
            valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : 'N/A', // Format rating
            renderCell: (params) => { // Display rating with star
                const ratingValue = params.value;
                if (typeof ratingValue !== 'number') return 'N/A';

                // Determine star color based on rating value
                const getRatingColor = (rating) => {
                    if (rating >= 4.5) return '#4caf50'; // Darker Green
                    if (rating >= 3.5) return '#8bc34a'; // Light Green
                    if (rating >= 2.5) return '#ffc107'; // Amber
                    if (rating >= 1.5) return '#ff9800'; // Orange
                    return '#f44336'; // Red
                };
                const starColor = getRatingColor(ratingValue);

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                        <Typography sx={{ fontWeight: 500, mr: 0.5 }}>
                            {ratingValue.toFixed(2)}
                        </Typography>
                        <Star sx={{ color: starColor, fontSize: '1rem' }} />
                    </Box>
                );
            }
        },
        {
            field: 'outlier_count', headerName: 'Outliers', type: 'number', flex: 1, align: 'right', headerAlign: 'right',
            description: 'Count of trips with negative variance',
            renderCell: (params) => ( // Link to outliers report if count > 0
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                    <Typography sx={{ mr: 1, color: params.value > 0 ? 'red' : 'inherit' }}>
                        {params.value}
                    </Typography>
                    {params.value > 0 && (
                        <IconButton
                            size="small"
                            className="outlier-info-button"
                            // Use handleViewOutliers from parent scope, passing driver_name
                            onClick={() => handleViewOutliers(params.row.driver_name)}
                        >
                            <InfoOutlined fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            )
        },
        // IMPORTANT: Add handleViewOutliers to the dependency array
    ], [handleViewOutliers]);

    // Client-side filtering based on search text
    const filteredRows = useMemo(() => {
        if (!searchText) return driverReportData;
        const lowerSearchText = searchText.toLowerCase();
        return driverReportData.filter((row) =>
            row.driver_name.toLowerCase().includes(lowerSearchText)
        );
    }, [driverReportData, searchText]);

    return (
        <Box>
            <div className="report-header">
                <h3>Driver Report</h3>
                <div className="report-filters">
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Search Drivers..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>),
                        }}
                    />
                    {/* Keep date pickers for UI consistency, even if not used for filtering this specific table */}
                    <DatePicker label="Start Date" value={dateRange[0]} onChange={(newValue) => setDateRange([newValue, dateRange[1]])} slotProps={{ textField: { size: 'small' } }} />
                    <DatePicker label="End Date" value={dateRange[1]} onChange={(newValue) => setDateRange([dateRange[0], newValue])} slotProps={{ textField: { size: 'small' } }} />
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

            {/* Data Grid */}
            {!isLoadingDrivers && !driverError && (
                <div className="report-content">
                    <Box sx={{ height: 400, width: '100%' }}>
                        <DataGrid
                            rows={filteredRows} // Use filtered real data
                            columns={driverColumns} // Use the new columns
                            disableColumnResize={true}
                            // getRowId={(row) => row.id} // Backend maps driver_name to id, which is used by default
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10 } },
                                sorting: { sortModel: [{ field: 'driver_rating', sort: 'asc' }] }, // Default sort by rating ascending
                            }}
                            pageSizeOptions={[10, 25, 50]}
                            localeText={{ noRowsLabel: 'No driver summary data found.' }} // Customize empty message
                        />
                    </Box>
                </div>
            )}

            {/* Keep collapsible graph for potential future use or remove if not needed */}
            {/* <CollapsibleGraph data={mockGraphData} /> */}
        </Box>
    );
};

export default DriverReport;