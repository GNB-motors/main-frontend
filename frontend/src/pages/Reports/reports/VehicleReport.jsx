import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, Alert
} from '@mui/material';
import { Search as SearchIcon, InfoOutlined } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { ReportsService } from '../ReportsService.jsx'; // Adjusted path

// --- VehicleReport COMPONENT (Uses fetched data) ---
const VehicleReport = ({ businessRefId, isLoadingProfile, profileError, handleViewOutliers }) => {
    const [vehicleReportData, setVehicleReportData] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehicleError, setVehicleError] = useState(null);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (isLoadingProfile || profileError || !businessRefId) { if (!isLoadingProfile) { setIsLoadingVehicles(false); if (profileError) setVehicleError(`Profile Error: ${profileError}`); else if (!businessRefId) setVehicleError("Business ID not found."); } else { setIsLoadingVehicles(true); } return; }
        const fetchVehicleReports = async () => { setIsLoadingVehicles(true); setVehicleError(null); try { const data = await ReportsService.getVehicleReports(businessRefId); setVehicleReportData(data); console.log("Vehicle Reports Fetched:", data); } catch (err) { console.error("Failed to fetch vehicle reports:", err); setVehicleError(err.detail || "Could not load vehicle reports."); setVehicleReportData([]); } finally { setIsLoadingVehicles(false); } }; fetchVehicleReports();
    }, [businessRefId, isLoadingProfile, profileError]);

    const vehicleReportColumns = useMemo(() => [
        { field: 'vehicle_registration_no', headerName: 'Vehicle Number', flex: 1 },
        { field: 'total_kms_driven', headerName: 'Total KMs Driven', type: 'number', flex: 1, align: 'right', headerAlign: 'right', valueFormatter: (value) => typeof value === 'number' ? value.toFixed(1) : '-' },
        { field: 'instances_driven', headerName: 'Instances Driven', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
        { field: 'average_variance', headerName: 'Avg. Variance (km/l)', type: 'number', flex: 1, align: 'right', headerAlign: 'right', valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : 'N/A', renderCell: (params) => { const value = params.value; if (typeof value !== 'number') return 'N/A'; return <span style={{ color: value > 0 ? 'green' : (value < 0 ? 'red' : 'inherit') }}>{value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}</span>; } },
        { field: 'negative_variance_outliers', headerName: 'Neg. Variance Instances', type: 'number', flex: 1, align: 'right', headerAlign: 'right', renderCell: (params) => (<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}><Typography sx={{ mr: 1, color: params.value > 0 ? 'red' : 'inherit' }}>{params.value}</Typography>{params.value > 0 && <IconButton size="small" className="outlier-info-button" onClick={() => handleViewOutliers(params.row.vehicle_registration_no)}><InfoOutlined fontSize="small" /></IconButton>}</Box>) },
        // IMPORTANT: Add handleViewOutliers to the dependency array
    ], [handleViewOutliers]);

    const filteredRows = useMemo(() => { if (!searchText) return vehicleReportData; const lowerSearchText = searchText.toLowerCase(); return vehicleReportData.filter((row) => row.vehicle_registration_no?.toLowerCase().includes(lowerSearchText)); }, [vehicleReportData, searchText]);

    return (
        <Box>
            <div className="report-header"><h3>Vehicle Report</h3><div className="report-filters"><TextField size="small" variant="outlined" placeholder="Search Vehicles..." value={searchText} onChange={(e) => setSearchText(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>), }} /></div></div>
            {isLoadingVehicles && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}><CircularProgress /><Typography sx={{ ml: 2 }}>Loading vehicle data...</Typography></Box>}
            {vehicleError && !isLoadingVehicles && <Alert severity="error" sx={{ my: 2 }}>{vehicleError}</Alert>}
            {!isLoadingVehicles && !vehicleError && <div className="report-content"><Box sx={{ height: 400, width: '100%' }}><DataGrid rows={filteredRows} columns={vehicleReportColumns} disableColumnResize={true} getRowId={(row) => row.id} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 25, 50]} localeText={{ noRowsLabel: 'No vehicle summary data found.' }} /></Box></div>}
        </Box>
    );
};

export default VehicleReport;