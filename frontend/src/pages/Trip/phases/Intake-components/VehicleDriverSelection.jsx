import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { TripService } from "../../services";

const VehicleDriverSelection = ({
  selectedVehicle,
  setSelectedVehicle,
  selectedDriver,
  setSelectedDriver
}) => {
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);

  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [vehicleError, setVehicleError] = useState(null);
  const [driverError, setDriverError] = useState(null);

  // Fetch vehicles on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      setVehicleError(null);
      try {
        const response = await TripService.getVehicles({ limit: 100 });
        console.log('Vehicle API response:', response);

        const vehiclesList = response?.data || [];
        console.log('Vehicles list:', vehiclesList);
        
        const mappedVehicles = vehiclesList.map(v => ({
          id: v._id,
          name: v.registrationNumber,
          registration: `${v.vehicleType} - ${v.model || 'N/A'}`,
          type: v.vehicleType,
          model: v.model,
          status: v.status
        }));
        console.log('Mapped vehicles:', mappedVehicles);
        
        setVehicles(mappedVehicles);        if (vehiclesList.length === 0) {
          toast.info('No vehicles found. Please add vehicles first.');
        }
      } catch (error) {
        const errorMsg = error?.message || 'Failed to fetch vehicles';
        setVehicleError(errorMsg);
        console.error('Vehicle fetch error:', error);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  // Fetch drivers on mount
  useEffect(() => {
    const fetchDrivers = async () => {
      setLoadingDrivers(true);
      setDriverError(null);
      try {
        const response = await TripService.getDrivers({ limit: 100 });
        console.log('Driver API response:', response);

        const driversList = response?.data || [];
        console.log('Drivers list:', driversList);
        
        const mappedDrivers = driversList.map(d => ({
          id: d._id,
          name: `${d.firstName} ${d.lastName || ''}`.trim(),
          licenseNo: d.licenseNo || 'N/A',
          phone: d.mobileNumber || 'N/A',
          status: d.status,
          email: d.email
        }));
        console.log('Mapped drivers:', mappedDrivers);
        
        setDrivers(mappedDrivers);        if (driversList.length === 0) {
          toast.info('No drivers found. Please add drivers first.');
        }
      } catch (error) {
        const errorMsg = error?.message || 'Failed to fetch drivers';
        setDriverError(errorMsg);
        console.error('Driver fetch error:', error);
      } finally {
        setLoadingDrivers(false);
      }
    };

    fetchDrivers();
  }, []);

  // Filter vehicles based on search
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v =>
      v.name.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.registration.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
  }, [vehicleSearch, vehicles]);

  // Filter drivers based on search
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d =>
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.licenseNo.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.phone.includes(driverSearch)
    );
  }, [driverSearch, drivers]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const vehicleDropdown = document.querySelector('.intake-selections .selection-field:first-child');
      const driverDropdown = document.querySelector('.intake-selections .selection-field:last-child');

      if (vehicleDropdown && !vehicleDropdown.contains(e.target)) {
        setShowVehicleDropdown(false);
      }
      if (driverDropdown && !driverDropdown.contains(e.target)) {
        setShowDriverDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="intake-selections">
      {/* Vehicle Dropdown */}
      <div className="selection-field">
        <label>Select Vehicle *</label>
        <div className="dropdown-wrapper">
          <button
            className="dropdown-button"
            onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
          >
            <span>{selectedVehicle ? selectedVehicle.name : 'Choose vehicle...'}</span>
            <ChevronDown size={16} className={showVehicleDropdown ? 'rotated' : ''} />
          </button>

          {showVehicleDropdown && (
            <div className="dropdown-menu">
              {loadingVehicles ? (
                <div className="dropdown-empty">Loading vehicles...</div>
              ) : vehicleError ? (
                <div className="dropdown-empty" style={{ color: '#e74c3c' }}>Error: {vehicleError}</div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search vehicle..."
                    className="dropdown-search"
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="dropdown-list">
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map(vehicle => (
                        <button
                          key={vehicle.id}
                          className={`dropdown-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowVehicleDropdown(false);
                            setVehicleSearch('');
                            toast.success(`Vehicle selected: ${vehicle.name}`);
                          }}
                        >
                          <div className="item-main">{vehicle.name}</div>
                          <div className="item-sub">{vehicle.registration}</div>
                        </button>
                      ))
                    ) : (
                      <div className="dropdown-empty">No vehicles found</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Driver Dropdown */}
      <div className="selection-field">
        <label>Select Driver *</label>
        <div className="dropdown-wrapper">
          <button
            className="dropdown-button"
            onClick={() => setShowDriverDropdown(!showDriverDropdown)}
          >
            <span>{selectedDriver ? selectedDriver.name : 'Choose driver...'}</span>
            <ChevronDown size={16} className={showDriverDropdown ? 'rotated' : ''} />
          </button>

          {showDriverDropdown && (
            <div className="dropdown-menu">
              {loadingDrivers ? (
                <div className="dropdown-empty">Loading drivers...</div>
              ) : driverError ? (
                <div className="dropdown-empty" style={{ color: '#e74c3c' }}>Error: {driverError}</div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search driver..."
                    className="dropdown-search"
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="dropdown-list">
                    {filteredDrivers.length > 0 ? (
                      filteredDrivers.map(driver => (
                        <button
                          key={driver.id}
                          className={`dropdown-item ${selectedDriver?.id === driver.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedDriver(driver);
                            setShowDriverDropdown(false);
                            setDriverSearch('');
                            toast.success(`Driver selected: ${driver.name}`);
                          }}
                        >
                          <div className="item-main">{driver.name}</div>
                          <div className="item-sub">{driver.licenseNo} • {driver.phone}</div>
                        </button>
                      ))
                    ) : (
                      <div className="dropdown-empty">No drivers found</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDriverSelection;