import { DOC_COLS } from './vehicleDashboardLogic';
import { DocBadge } from './vehicleDashboardCells';

/**
 * Column defs for the fleet document-expiry table matching WheelsEye standard:
 * 1. Vehicle Number (with inline model/chassis)
 * 2. RC
 * 3. Insurance
 * 4. State Permit
 * 5. National Permit
 * 6. Road Tax
 * 7. Fitness
 * 8. PUCC
 *
 * All management and chassis/owner details live in the right-side inspection panel
 * on click, ensuring zero horizontal scrollbar on standard desktop displays.
 */
export function buildVehicleDashboardColumns({
  onSelectVehicle,
  onSelectDoc,
  selectedVehicleId = null,
  selectedDocKey = null,
}) {
  const columns = [
    {
      key: 'vehicle',
      label: 'Vehicle Number',
      render: (row) => {
        const isVehicleSelected = selectedVehicleId === row._id && !selectedDocKey;
        return (
          <div
            className={`v-dash-vehicle-cell${isVehicleSelected ? ' v-dash-vehicle-cell--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectVehicle?.(row);
            }}
            title="Click to view all document & challan details"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectVehicle?.(row);
              }
            }}
          >
            <div className="v-dash-reg-text">{row.registrationNumber}</div>
            <div className="v-dash-model-text">
              {[row.manufacturer, row.model].filter(Boolean).join(' · ') || 'Commercial Vehicle'}
            </div>
            {row.chassisNumber && (
              <div className="v-dash-chassis-inline" title={`Chassis: ${row.chassisNumber}`}>
                {row.chassisNumber}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  DOC_COLS.forEach(({ key, label }) => {
    columns.push({
      key,
      label,
      render: (row) => (
        <DocBadge
          docEntry={row.documents?.[key]}
          onClick={(e) => {
            e?.stopPropagation?.();
            onSelectDoc?.(row, key, row.documents?.[key]);
          }}
          isSelected={selectedVehicleId === row._id && selectedDocKey === key}
        />
      ),
    });
  });

  return columns;
}
