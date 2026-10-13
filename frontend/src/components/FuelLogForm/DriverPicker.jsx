import React from 'react';
import { ChevronDown } from 'lucide-react';

const DriverPicker = ({
  uid,
  lockDriver,
  selectedDriver,
  loadingDrivers,
  showDriverDropdown,
  setShowDriverDropdown,
  setShowVehicleDropdown,
  driverSearch,
  setDriverSearch,
  filteredDrivers,
  setSelectedDriver,
  setDriverTouchedByUser,
  setDriverAutoFilled,
}) => {
  if (lockDriver) {
    return (
      <div className="dropdown-button disabled" style={{ cursor: 'default' }}>
        <span>{selectedDriver ? selectedDriver.name : loadingDrivers ? 'Loading...' : '—'}</span>
      </div>
    );
  }
  return (
    <div className="dropdown-wrapper" style={{ zIndex: showDriverDropdown ? 200 : undefined }}>
      <button
        id={`${uid}-driver`}
        type="button"
        className={`dropdown-button ${loadingDrivers ? 'disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setShowDriverDropdown(!showDriverDropdown);
          setShowVehicleDropdown(false);
        }}
      >
        <span>
          {selectedDriver
            ? selectedDriver.name
            : loadingDrivers
              ? 'Loading...'
              : 'Choose driver...'}
        </span>
        <ChevronDown size={16} className={showDriverDropdown ? 'rotated' : ''} />
      </button>
      {showDriverDropdown && (
        <div className="dropdown-menu">
          <input
            type="text"
            aria-label="Search driver"
            placeholder="Search driver..."
            className="dropdown-search"
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="dropdown-list">
            {filteredDrivers.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`dropdown-item ${selectedDriver?.id === d.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedDriver(d);
                  setDriverTouchedByUser(true);
                  setDriverAutoFilled(false);
                  setShowDriverDropdown(false);
                }}
              >
                <div className="item-main">{d.name}</div>
                <div className="item-sub">{d.licenseNo}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPicker;
