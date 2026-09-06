// DataTable column definitions for the Vehicles page.
// Extracted from VehiclesPage.jsx (WS0.7) to keep the page under the file-size rule;
// cell markup preserved byte-identically.
import { describeFleetEdgeAccount } from './vehicleList.js';
import { VehicleActionMenu } from './VehicleModals.jsx';

export function useVehicleColumns({
  accountMap,
  openMenuId,
  setOpenMenuId,
  isSubmitting,
  onEdit,
  onDelete,
  onActivateHere,
}) {
  return [
    {
      key: 'registration_no',
      label: 'Vehicle No',
      render: (vehicle) => (
        <>
          <span style={{ fontWeight: 600 }}>{vehicle.registration_no}</span>
          {vehicle.branchStatus === 'DEACTIVATED' && (
            <span
              className="vehicle-badge"
              title="Moved to another location — deactivated here"
              style={{
                marginLeft: 8,
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
              }}
            >
              Deactivated
            </span>
          )}
        </>
      ),
    },
    { key: 'model', label: 'Model', render: (vehicle) => vehicle.model || 'N/A' },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      render: (vehicle) =>
        vehicle.manufacturer && vehicle.manufacturer !== 'UNKNOWN' ? (
          <span
            className={`vehicle-badge manufacturer-${vehicle.manufacturer?.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {vehicle.manufacturer}
          </span>
        ) : (
          <span className="vehicle-badge vehicle-badge-unknown">—</span>
        ),
    },
    {
      key: 'vehicleCategory',
      label: 'Category',
      render: (vehicle) =>
        vehicle.vehicleCategory && vehicle.vehicleCategory !== 'UNKNOWN' ? (
          <span className={`vehicle-badge category-${vehicle.vehicleCategory?.toLowerCase()}`}>
            {vehicle.vehicleCategory}
          </span>
        ) : (
          <span className="vehicle-badge vehicle-badge-unknown">—</span>
        ),
    },
    {
      key: 'chassis_number',
      label: 'Chassis No',
      render: (vehicle) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {vehicle.chassis_number || 'N/A'}
        </span>
      ),
    },
    {
      key: 'fleetEdgeAccountId',
      label: 'FleetEdge Account',
      render: (vehicle) => {
        const acct = describeFleetEdgeAccount(vehicle, accountMap);
        if (!acct.tagged) {
          return <span style={{ fontStyle: 'italic', color: '#aaa', fontSize: 12 }}>untagged</span>;
        }
        return (
          <span
            title={acct.tip}
            className="vehicle-badge"
            style={{
              background: acct.isDisabled ? '#fef3c7' : '#eff6ff',
              color: acct.isDisabled ? '#92400e' : '#1d4ed8',
              border: `1px solid ${acct.isDisabled ? '#fde68a' : '#bfdbfe'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {acct.isDisabled && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'inline-block',
                }}
                title="Source account disabled"
              />
            )}
            {acct.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (vehicle) => (
        <VehicleActionMenu
          vehicle={vehicle}
          isOpen={openMenuId === vehicle.id}
          onToggle={(e) => {
            e.stopPropagation();
            setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id);
          }}
          onClose={() => setOpenMenuId(null)}
          isSubmitting={isSubmitting}
          onEdit={() => {
            setOpenMenuId(null);
            onEdit(vehicle);
          }}
          onDelete={() => {
            onDelete(vehicle);
          }}
          onActivateHere={() => onActivateHere(vehicle)}
        />
      ),
    },
  ];
}
