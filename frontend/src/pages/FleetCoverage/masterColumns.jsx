// Column defs — key matches the row field for both display and export.
const masterColumns = [
  {
    key: 'registrationNumber',
    label: 'Vehicle',
    render: (v) => <span className="reg-plate">{v.registrationNumber}</span>,
  },
  { key: 'model', label: 'Model', render: (v) => v.model || '—' },
  { key: 'manufacturer', label: 'Manufacturer', render: (v) => v.manufacturer || '—' },
  { key: 'statusLabel', label: 'Status', render: (v) => v.statusLabel },
  {
    key: 'fleetEdgeRegistration',
    label: 'FleetEdge reg.',
    render: (v) => v.fleetEdgeRegistration || '—',
  },
];

export default masterColumns;
