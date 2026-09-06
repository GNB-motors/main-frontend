import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * Vehicle + driver searchable dropdowns for the fuel-log form. Owns their
 * search/open state; selection state lives in the parent page. Driver options
 * are gated on a vehicle being selected first, matching the original form.
 */
const VehicleDriverPickers = ({
  vehicles,
  drivers,
  selectedOrgFilter,
  loadingVehicles,
  loadingDrivers,
  selectedVehicle,
  onVehicleChange,
  onVehicleClear,
  selectedDriver,
  onDriverChange,
  onDriverClear,
  lastOdometer,
  loadingLastOdometer,
}) => {
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowVehicleDropdown(false);
      setShowDriverDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((v) => {
        if (selectedOrgFilter && v.orgId?.companyName !== selectedOrgFilter) return false;
        return (
          v.name.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
          v.registration.toLowerCase().includes(vehicleSearch.toLowerCase())
        );
      }),
    [vehicleSearch, vehicles, selectedOrgFilter],
  );

  const groupedVehicles = useMemo(() => {
    return filteredVehicles.reduce((acc, v) => {
      const orgName = v.orgId?.companyName || 'Unknown Org';
      if (!acc[orgName]) acc[orgName] = [];
      acc[orgName].push(v);
      return acc;
    }, {});
  }, [filteredVehicles]);

  const filteredDrivers = useMemo(
    () =>
      drivers.filter((d) => {
        if (selectedOrgFilter && d.orgId?.companyName !== selectedOrgFilter) return false;
        return (
          d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
          d.mobileNo.toLowerCase().includes(driverSearch.toLowerCase())
        );
      }),
    [driverSearch, drivers, selectedOrgFilter],
  );

  const groupedDrivers = useMemo(() => {
    let driversToGroup = filteredDrivers;
    // Optimization: Only show drivers belonging to the selected vehicle's organization
    if (selectedVehicle) {
      const vehicleOrgId = selectedVehicle.orgId?._id || selectedVehicle.orgId;
      driversToGroup = driversToGroup.filter((d) => {
        const driverOrgId = d.orgId?._id || d.orgId;
        return driverOrgId === vehicleOrgId;
      });
    }

    return driversToGroup.reduce((acc, d) => {
      const orgName = d.orgId?.companyName || 'Unknown Org';
      if (!acc[orgName]) acc[orgName] = [];
      acc[orgName].push(d);
      return acc;
    }, {});
  }, [filteredDrivers, selectedVehicle]);

  const handleDriverFieldAccess = () => {
    if (!selectedVehicle) {
      toast.warning('Please select a vehicle first.');
      return false;
    }
    return true;
  };

  return (
    <div className="mileage-form-row">
      <div className="mileage-form-group">
        <label>Select Vehicle *</label>
        <div className="dropdown-wrapper">
          <div
            className={`dropdown-button ${loadingVehicles ? 'disabled' : ''}`}
            style={{ padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <input
              type="text"
              placeholder={
                selectedVehicle
                  ? `${selectedVehicle.name} (${selectedVehicle.registration})`
                  : loadingVehicles
                    ? 'Loading...'
                    : 'Search vehicle...'
              }
              value={vehicleSearch}
              onChange={(e) => {
                setVehicleSearch(e.target.value);
                setShowVehicleDropdown(true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowVehicleDropdown(true);
                setShowDriverDropdown(false);
              }}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                padding: '10px 14px',
                width: '100%',
                fontSize: '14px',
                color: '#1e293b',
              }}
            />
            {selectedVehicle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVehicleClear();
                  setVehicleSearch('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 4px',
                  color: '#94a3b8',
                  display: 'flex',
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowVehicleDropdown(!showVehicleDropdown);
                setShowDriverDropdown(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 14px 0 8px',
                color: '#94a3b8',
                display: 'flex',
              }}
            >
              <ChevronDown size={18} className={showVehicleDropdown ? 'rotated' : ''} />
            </button>
          </div>
          {showVehicleDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-list" style={{ maxHeight: '250px' }}>
                {Object.entries(groupedVehicles).map(([orgName, orgVehicles]) => (
                  <div key={orgName}>
                    <div
                      className="dropdown-group-label"
                      style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        background: '#f8fafc',
                      }}
                    >
                      {orgName}
                    </div>
                    {orgVehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`dropdown-item ${selectedVehicle?.id === v.id ? 'selected' : ''}`}
                        onClick={() => {
                          onVehicleChange(v);
                          setVehicleSearch('');
                          setShowVehicleDropdown(false);
                        }}
                      >
                        <div className="item-main">{v.name}</div>
                        <div className="item-sub">{v.registration}</div>
                      </button>
                    ))}
                  </div>
                ))}
                {Object.keys(groupedVehicles).length === 0 && (
                  <div
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '13px',
                    }}
                  >
                    No vehicles found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {selectedVehicle && (
          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {loadingLastOdometer ? (
              <>
                <Loader2 size={12} className="spinning" /> Fetching prior logs...
              </>
            ) : lastOdometer ? (
              <span>
                <b>Previous Log:</b> {lastOdometer.fillingType?.replace('_', ' ')} fill{' '}
                {lastOdometer.odometerReading
                  ? `at ${lastOdometer.odometerReading} km`
                  : '(No odometer recorded)'}{' '}
                <span style={{ color: '#94a3b8' }}>
                  ({new Date(lastOdometer.refuelTime).toLocaleDateString()})
                </span>
              </span>
            ) : (
              <span>No prior fuel logs found. Starting fresh.</span>
            )}
          </div>
        )}
      </div>
      <div className="mileage-form-group">
        <label>Select Driver *</label>
        <div className="dropdown-wrapper">
          <div
            className={`dropdown-button ${loadingDrivers ? 'disabled' : ''}`}
            style={{ padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <input
              type="text"
              placeholder={
                selectedDriver
                  ? `${selectedDriver.name} (${selectedDriver.mobileNo})`
                  : loadingDrivers
                    ? 'Loading...'
                    : 'Search driver...'
              }
              value={driverSearch}
              onChange={(e) => {
                setDriverSearch(e.target.value);
                if (!handleDriverFieldAccess()) return;
                setShowDriverDropdown(true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!handleDriverFieldAccess()) return;
                setShowDriverDropdown(true);
                setShowVehicleDropdown(false);
              }}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                padding: '10px 14px',
                width: '100%',
                fontSize: '14px',
                color: '#1e293b',
              }}
            />
            {selectedDriver && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDriverClear();
                  setDriverSearch('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 4px',
                  color: '#94a3b8',
                  display: 'flex',
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!handleDriverFieldAccess()) return;
                setShowDriverDropdown(!showDriverDropdown);
                setShowVehicleDropdown(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 14px 0 8px',
                color: '#94a3b8',
                display: 'flex',
              }}
            >
              <ChevronDown size={18} className={showDriverDropdown ? 'rotated' : ''} />
            </button>
          </div>
          {showDriverDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-list" style={{ maxHeight: '250px' }}>
                {Object.entries(groupedDrivers).map(([orgName, orgDrivers]) => (
                  <div key={orgName}>
                    <div
                      className="dropdown-group-label"
                      style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        background: '#f8fafc',
                      }}
                    >
                      {orgName}
                    </div>
                    {orgDrivers.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`dropdown-item ${selectedDriver?.id === d.id ? 'selected' : ''}`}
                        onClick={() => {
                          onDriverChange(d);
                          setDriverSearch('');
                          setShowDriverDropdown(false);
                        }}
                      >
                        <div className="item-main">{d.name}</div>
                        <div className="item-sub">{d.mobileNo}</div>
                      </button>
                    ))}
                  </div>
                ))}
                {Object.keys(groupedDrivers).length === 0 && (
                  <div
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '13px',
                    }}
                  >
                    No drivers found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDriverPickers;
