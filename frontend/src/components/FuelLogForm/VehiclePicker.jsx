import React from 'react';
import { ChevronDown } from 'lucide-react';

const VehiclePicker = ({
  uid,
  lockVehicle,
  selectedVehicle,
  loadingVehicles,
  showVehicleDropdown,
  setShowVehicleDropdown,
  setShowDriverDropdown,
  vehicleSearch,
  setVehicleSearch,
  filteredVehicles,
  setSelectedVehicle,
  suggestDriverForVehicle,
}) => {
  if (lockVehicle) {
    return (
      <div className="dropdown-button disabled" style={{ cursor: 'default' }}>
        <span>{selectedVehicle ? selectedVehicle.name : loadingVehicles ? 'Loading...' : '—'}</span>
      </div>
    );
  }
  return (
    <div className="dropdown-wrapper" style={{ zIndex: showVehicleDropdown ? 200 : undefined }}>
      <button
        id={`${uid}-vehicle`}
        type="button"
        className={`dropdown-button ${loadingVehicles ? 'disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setShowVehicleDropdown(!showVehicleDropdown);
          setShowDriverDropdown(false);
        }}
      >
        <span>
          {selectedVehicle
            ? selectedVehicle.name
            : loadingVehicles
              ? 'Loading...'
              : 'Choose vehicle...'}
        </span>
        <ChevronDown size={16} className={showVehicleDropdown ? 'rotated' : ''} />
      </button>
      {showVehicleDropdown && (
        <div className="dropdown-menu">
          <input
            type="text"
            aria-label="Search vehicle"
            placeholder="Search vehicle..."
            className="dropdown-search"
            value={vehicleSearch}
            onChange={(e) => setVehicleSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="dropdown-list">
            {filteredVehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`dropdown-item ${selectedVehicle?.id === v.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedVehicle(v);
                  setShowVehicleDropdown(false);
                  suggestDriverForVehicle(v.id);
                }}
              >
                <div className="item-main">{v.name}</div>
                <div className="item-sub">{v.registration}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclePicker;
