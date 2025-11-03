// src/utils/mockdata.jsx

// Mock data for the Driver Report DataGrid
export const mockDriverRows = [
  { id: 1, name: 'Driver A (Devayan)', totalKms: 4850, instances: 45, avgVariance: 2.1, outliers: 2 },
  { id: 2, name: 'Driver B (Amitansu)', totalKms: 6120, instances: 52, avgVariance: -1.5, outliers: 8 },
  { id: 3, name: 'Driver C', totalKms: 3200, instances: 30, avgVariance: 0.8, outliers: 1 },
  { id: 4, name: 'Driver D', totalKms: 5300, instances: 48, avgVariance: -0.2, outliers: 3 },
];

// Mock data for the Vehicle Report DataGrid
export const mockVehicleRows = [
  { id: 1, vehicle: 'WB-01-1234', totalKms: 12500, instances: 120, avgVariance: 1.8, outliers: 4 },
  { id: 2, vehicle: 'WB-02-5678', totalKms: 9800, instances: 95, avgVariance: -0.7, outliers: 12 },
  { id: 3, vehicle: 'WB-06-9001', totalKms: 22000, instances: 150, avgVariance: 0.5, outliers: 3 },
];

// Mock data for the EOM Report Summary (Keep for potential other uses)
export const mockEomReport = {
  totalKms: 44300,
  mostDriven: 'WB-06-9001 (22,000 KMs)',
  leastVariance: 'WB-01-1234 (+1.8 km/l)',
  mostVariance: 'WB-02-5678 (-0.7 km/l)',
};

// Mock data for the Projected Savings Report Summary (Still needed for calculation below)
export const mockProjectedReport = {
  totalSavings: 12450.75,
  avgPositiveVariance: 1.2,
  bestVehicle: 'WB-01-1234',
  note: 'Projected savings based on positive variance of 1.2 km/l over 44,300 KMs with avg. fuel price.'
};


// Mock data for the collapsible graphs
export const mockGraphData = [
  { name: 'Trip 1', fleetEdgeMileage: 10.5, billMileage: 11.0, variance: 0.5 },
  { name: 'Trip 2', fleetEdgeMileage: 11.0, billMileage: 10.8, variance: -0.2 },
  { name: 'Trip 3', fleetEdgeMileage: 9.8, billMileage: 10.5, variance: 0.7 },
  { name: 'Trip 4', fleetEdgeMileage: 12.0, billMileage: 9.5, variance: -2.5 }, // Outlier
  { name: 'Trip 5', fleetEdgeMileage: 10.2, billMileage: 11.2, variance: 1.0 },
  { name: 'Trip 6', fleetEdgeMileage: 10.8, billMileage: 11.0, variance: 0.2 },
  { name: 'Trip 7', fleetEdgeMileage: 11.5, billMileage: 14.0, variance: 2.5 }, // Outlier
];

// Mock data for Outliers Table
export const mockOutlierRows = [
  { id: 1, date: '2025-10-20', driver: 'Driver B (Amitansu)', vehicle: 'WB-02-5678', fleetEdgeMileage: 12.0, billMileage: 9.5, variance: -2.5 },
  { id: 2, date: '2025-10-18', driver: 'Driver B (Amitansu)', vehicle: 'WB-02-5678', fleetEdgeMileage: 10.0, billMileage: 8.1, variance: -1.9 },
  { id: 3, date: '2025-10-15', driver: 'Driver A (Devayan)', vehicle: 'WB-01-1234', fleetEdgeMileage: 11.5, billMileage: 14.0, variance: 2.5 },
  { id: 4, date: '2025-10-12', driver: 'Driver D', vehicle: 'WB-06-9001', fleetEdgeMileage: 9.0, billMileage: 7.2, variance: -1.8 },
  { id: 5, date: '2025-10-11', driver: 'Driver B (Amitansu)', vehicle: 'WB-02-5678', fleetEdgeMileage: 11.2, billMileage: 9.0, variance: -2.2 },
  { id: 6, date: '2025-09-09', driver: 'Driver A (Devayan)', vehicle: 'WB-01-1234', fleetEdgeMileage: 10.1, billMileage: 12.0, variance: 1.9 },
];

export const mockOutlierColumns = [
  { field: 'date', headerName: 'Date', width: 120, flex: 1 },
  { field: 'driver', headerName: 'Driver', width: 180, flex: 1.5 },
  { field: 'vehicle', headerName: 'Vehicle', width: 150, flex: 1 },
  { field: 'fleetEdgeMileage', headerName: 'FleetEdge (km/l)', type: 'number', width: 150, flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'billMileage', headerName: 'Bill (km/l)', type: 'number', width: 120, flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'variance', headerName: 'Variance', type: 'number', width: 120, flex: 1, align: 'right', headerAlign: 'right',
    renderCell: (params) => (
      <span style={{ color: params.value > 0 ? 'green' : 'red', fontWeight: Math.abs(params.value) >= 1.5 ? 'bold' : 'normal' }}>
        {params.value > 0 ? `+${params.value.toFixed(1)}` : params.value.toFixed(1)}
      </span>
    )
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      const isSignificantNegativeOutlier = params.row.variance < 0 && Math.abs(params.row.variance) >= 1.5;
      if (isSignificantNegativeOutlier) {
        return (
          <button
            style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', color: '#6c757d', backgroundColor: 'transparent', border: '1px solid #6c757d', borderRadius: '4px' }}
            onClick={(event) => {
              event.stopPropagation();
              console.log(`Resolving outlier ID: ${params.row.id}`);
              alert(`Resolving outlier for ${params.row.driver} on ${params.row.date}.`);
            }}
          >
            Resolve
          </button>
        );
      }
      return null;
    }
  }
];

// --- MOCK DATA FOR PROJECTED SAVINGS TABLE ---
export const mockProjectedRows = mockVehicleRows.map(vehicle => {
  const dieselRate = 92;
  const estimatedAvgMileage = 10;
  const totalLiters = vehicle.totalKms / estimatedAvgMileage;
  const diffKms = parseFloat((totalLiters * vehicle.avgVariance).toFixed(2));
  const financialImpact = parseFloat((diffKms * dieselRate).toFixed(2));

  return {
    id: vehicle.id,
    vehicle: vehicle.vehicle,
    avgVariance: vehicle.avgVariance,
    diffKms: diffKms,
    financialImpact: financialImpact
  };
});


export const mockProjectedColumns = [
  { field: 'vehicle', headerName: 'Vehicle', width: 180, flex: 1.5 },
  {
    field: 'avgVariance',
    headerName: 'Avg. Variance (km/l)',
    type: 'number',
    width: 180,
    flex: 1,
    align: 'right',
    headerAlign: 'right',
    cellClassName: (params) => params.value >= 0 ? 'positive-variance' : 'negative-variance',
    valueFormatter: (value) => {
        if (typeof value !== 'number') return '';
        return value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
    }
  },
  {
    field: 'diffKms',
    headerName: 'Difference in KMs',
    description: 'Estimated extra (+) or missed (-) KMs driven for the fuel used',
    type: 'number',
    width: 180,
    flex: 1,
    align: 'right',
    headerAlign: 'right',
    cellClassName: (params) => params.value >= 0 ? 'positive-variance' : 'negative-variance',
    valueFormatter: (value) => {
        if (typeof value !== 'number') return '';
        return value >= 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
    }
  },
  {
    field: 'financialImpact',
    headerName: 'Financial Impact (₹)',
    description: `Savings (+) or Potential Loss (-) calculated at ₹92/km`,
    type: 'number',
    width: 180,
    flex: 1,
    align: 'right',
    headerAlign: 'right',
    cellClassName: (params) => params.value >= 0 ? 'positive-impact' : 'negative-impact',
    valueFormatter: (value) => {
        if (typeof value !== 'number') return '';
        const formattedValue = Math.abs(value).toLocaleString();
        return value >= 0 ? `₹${formattedValue}` : `₹(${formattedValue})`;
    },
  },
];

// --- **MODIFIED** MOCK DATA FOR TRIP REPORT ---
export const mockTripRows = [
  // Changed 'date' to 'startDate' and 'endDate'
  { id: 1, startDate: '2025-10-23', endDate: '2025-10-23', driver: 'Driver A (Devayan)', vehicle: 'WB-01-1234', kmsDriven: 150, fleetEdgeMileage: 10.8, billMileage: 11.2, variance: 0.4 },
  { id: 2, startDate: '2025-10-23', endDate: '2025-10-23', driver: 'Driver B (Amitansu)', vehicle: 'WB-02-5678', kmsDriven: 180, fleetEdgeMileage: 11.0, billMileage: 10.5, variance: -0.5 },
  { id: 3, startDate: '2025-10-22', endDate: '2025-10-22', driver: 'Driver C', vehicle: 'WB-06-9001', kmsDriven: 210, fleetEdgeMileage: 9.5, billMileage: 9.8, variance: 0.3 },
  { id: 4, startDate: '2025-10-21', endDate: '2025-10-21', driver: 'Driver A (Devayan)', vehicle: 'WB-01-1234', kmsDriven: 135, fleetEdgeMileage: 10.5, billMileage: 11.0, variance: 0.5 },
  { id: 5, startDate: '2025-10-20', endDate: '2025-10-20', driver: 'Driver B (Amitansu)', vehicle: 'WB-02-5678', kmsDriven: 95, fleetEdgeMileage: 12.0, billMileage: 9.5, variance: -2.5 }, // Outlier
  { id: 6, startDate: '2025-09-15', endDate: '2025-09-15', driver: 'Driver D', vehicle: 'WB-06-9001', kmsDriven: 190, fleetEdgeMileage: 9.8, billMileage: 9.9, variance: 0.1 },
  { id: 7, startDate: '2025-09-14', endDate: '2025-09-14', driver: 'Driver A (Devayan)', vehicle: 'WB-01-1234', kmsDriven: 165, fleetEdgeMileage: 11.2, billMileage: 11.5, variance: 0.3 },
  { id: 8, startDate: '2025-08-30', endDate: '2025-08-30', driver: 'Driver B (Amitansu)', vehicle: 'WB-02-5678', kmsDriven: 175, fleetEdgeMileage: 10.9, billMileage: 10.7, variance: -0.2 },
  { id: 9, startDate: '2025-08-28', endDate: '2025-08-28', driver: 'Driver C', vehicle: 'WB-06-9001', kmsDriven: 200, fleetEdgeMileage: 9.6, billMileage: 9.7, variance: 0.1 },
  { id: 10, startDate: '2025-08-25', endDate: '2025-08-26', driver: 'Driver A (Devayan)', vehicle: 'WB-01-1234', kmsDriven: 350, fleetEdgeMileage: 10.2, billMileage: 10.8, variance: 0.6 },
];

// --- **MODIFIED** Trip Columns ---
export const mockTripColumns = [
  // Replaced 'date' with 'startDate' and 'endDate'
  { field: 'startDate', headerName: 'Start Date', width: 120, flex: 1 },
  { field: 'endDate', headerName: 'End Date', width: 120, flex: 1 },
  { field: 'driver', headerName: 'Driver', width: 180, flex: 1.5 },
  { field: 'vehicle', headerName: 'Vehicle', width: 150, flex: 1 },
  { field: 'kmsDriven', headerName: 'KMs Driven', type: 'number', width: 130, flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'fleetEdgeMileage', headerName: 'FleetEdge (km/l)', type: 'number', width: 150, flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'billMileage', headerName: 'Bill (km/l)', type: 'number', width: 120, flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'variance', headerName: 'Variance', type: 'number', width: 120, flex: 1, align: 'right', headerAlign: 'right',
    renderCell: (params) => (
      <span style={{ color: params.value > 0 ? 'green' : 'red', fontWeight: Math.abs(params.value) >= 1.5 ? 'bold' : 'normal' }}>
        {params.value > 0 ? `+${params.value.toFixed(1)}` : params.value.toFixed(1)}
      </span>
    )
  },
];

// --- LIST OF MONTHS FOR FILTER ---
export const months = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' },
];