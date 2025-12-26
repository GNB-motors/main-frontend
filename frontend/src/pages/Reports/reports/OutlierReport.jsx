import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment, CircularProgress, Alert
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { ReportsService } from '../ReportsService.jsx'; // Adjusted path

// --- OutlierReport COMPONENT (Uses fetched data) ---
const OutlierReport = ({ businessRefId, isLoadingProfile, profileError, highlightedOutlierId }) => {
    const [outlierData, setOutlierData] = useState([]); const [isLoadingOutliers, setIsLoadingOutliers] = useState(true); const [outlierError, setOutlierError] = useState(null); const [searchText, setSearchText] = useState(""); const [dateRange, setDateRange] = useState([null, null]);
    useEffect(() => { if (isLoadingProfile || profileError || !businessRefId) { if (!isLoadingProfile) { setIsLoadingOutliers(false); if (profileError) setOutlierError(`Profile Error: ${profileError}`); else if (!businessRefId) setOutlierError("Business ID not found."); } else { setIsLoadingOutliers(true); } return; } const fetchOutliers = async () => { setIsLoadingOutliers(true); setOutlierError(null); try { const filters = { startDate: dateRange[0], endDate: dateRange[1] }; const data = await ReportsService.getOutlierReports(businessRefId, filters); setOutlierData(data); console.log("Outlier Reports Fetched:", data); } catch (err) { console.error("Failed to fetch outliers:", err); setOutlierError(err.detail || "Could not load outliers."); setOutlierData([]); } finally { setIsLoadingOutliers(false); } }; fetchOutliers(); }, [businessRefId, isLoadingProfile, profileError, dateRange]);
    const outlierColumns = useMemo(() => [{ field: 'end_date', headerName: 'Date', flex: 1, type: 'date', valueGetter: (value) => value ? dayjs(value).toDate() : null }, { field: 'driver_name', headerName: 'Driver', flex: 1.5, valueGetter: (value) => value || 'N/A' }, { field: 'vehicle_registration_no', headerName: 'Vehicle', flex: 1 }, { field: 'fleetedge_mileage_kml', headerName: 'FleetEdge (km/l)', type: 'number', flex: 1, align: 'right', headerAlign: 'right', valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : '-' }, { field: 'bill_mileage_kml', headerName: 'Bill (km/l)', type: 'number', flex: 1, align: 'right', headerAlign: 'right', valueFormatter: (value) => typeof value === 'number' ? value.toFixed(2) : '-' }, { field: 'variance', headerName: 'Variance', type: 'number', flex: 1, align: 'right', headerAlign: 'right', renderCell: (params) => { const value = params.value; if (typeof value !== 'number') return '-'; return <span style={{ color: value > 0 ? 'green' : 'red', fontWeight: Math.abs(value) >= 1.5 ? 'bold' : 'normal' }}>{value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}</span>; } },], []);
    const filteredRows = useMemo(() => { if (!searchText) return outlierData; const lowerSearchText = searchText.toLowerCase(); return outlierData.filter((row) => row.driver_name?.toLowerCase().includes(lowerSearchText) || row.vehicle_registration_no?.toLowerCase().includes(lowerSearchText)); }, [outlierData, searchText]);
    const getRowClassName = (params) => { if (highlightedOutlierId && (params.row.driver_name === highlightedOutlierId || params.row.vehicle_registration_no === highlightedOutlierId)) { return 'highlighted-outlier'; } return ''; };
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="report-header">
          <h3>Outlier Instances</h3>
          <div className="report-filters">
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search Driver or Vehicle..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <DatePicker
              label="Start Date"
              value={dateRange[0]}
              onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={dateRange[1]}
              onChange={(newValue) => setDateRange([dateRange[0], newValue])}
              slotProps={{ textField: { size: 'small' } }}
            />
          </div>
        </div>

        {isLoadingOutliers && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading outlier data...</Typography>
          </Box>
        )}

        {outlierError && !isLoadingOutliers && (
          <Alert severity="error" sx={{ my: 2 }}>
            {outlierError}
          </Alert>
        )}

        {!isLoadingOutliers && !outlierError && (
          <div className="report-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                height: 'calc(100vh - 260px)',
                minHeight: 500,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <DataGrid
                rows={filteredRows}
                columns={outlierColumns}
                disableColumnResize={true}
                initialState={{
                  pagination: { paginationModel: { pageSize: 15 } },
                  sorting: { sortModel: [{ field: 'end_date', sort: 'desc' }] },
                }}
                pageSizeOptions={[15, 25, 50]}
                getRowClassName={getRowClassName}
                localeText={{ noRowsLabel: 'No outliers found.' }}
              />
            </Box>
          </div>
        )}
      </Box>
    );
};

export default OutlierReport;