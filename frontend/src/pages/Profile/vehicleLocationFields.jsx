import { Building2 } from 'lucide-react';

/**
 * Owning-location picker for a new vehicle. Inside an active location the
 * vehicle is locked to it (mirrors the employee create flow); at the
 * enterprise scope it's a dropdown, defaulting to "Enterprise" (no location).
 */
export const VehicleLocationField = (props) => {
  const { activeBranchId, activeBranch, branches, selectedBranchId, onChange } = props;
  return (
    <div style={{ padding: '0 24px 16px', maxWidth: 480 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: '#64748b',
          marginBottom: 6,
        }}
      >
        Location
      </label>
      {activeBranchId ? (
        <>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              color: '#1e293b',
              background: '#f8fafc',
            }}
          >
            <Building2 size={14} />
            {activeBranch?.name ||
              branches.find((b) => String(b._id) === String(activeBranchId))?.name ||
              'Current location'}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            This vehicle will be added to the current location.
          </p>
        </>
      ) : (
        <>
          <select
            value={selectedBranchId}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              color: '#1e293b',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="">Enterprise (no specific location)</option>
            {branches.map((b) => (
              <option key={b._id} value={String(b._id)}>
                {b.name}
                {b.isDefault ? ' (default)' : ''}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            The operating location this vehicle belongs to. Enterprise-level vehicles show only in
            the all-locations view.
          </p>
        </>
      )}
    </div>
  );
};

/** Optional FleetEdge account assignment — only shown when there's more than one to pick from. */
export const VehicleFleetEdgeAccountField = ({ accounts, selectedAccountId, onChange }) => (
  <div style={{ padding: '0 24px 16px', maxWidth: 480 }}>
    <label
      style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}
    >
      FleetEdge Account (optional)
    </label>
    <select
      value={selectedAccountId}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        fontSize: 14,
        color: '#1e293b',
        background: '#fff',
        cursor: 'pointer',
      }}
    >
      <option value="">— Not assigned —</option>
      {accounts.map((a) => (
        <option key={a._id} value={String(a._id)}>
          {a.friendlyName || a.externalAccountId}
        </option>
      ))}
    </select>
    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
      Assign this vehicle to a FleetEdge account. If left blank it will be tagged automatically on
      first data arrival.
    </p>
  </div>
);
