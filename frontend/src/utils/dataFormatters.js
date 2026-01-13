// Utility functions for formatting vehicle and driver data and populating fields defensive helpers 
export function getVehicleRegistration(vehicle) {
  if (!vehicle) return '-';
  if (typeof vehicle === 'string') return vehicle;
  return vehicle.registrationNumber || vehicle._id || '-';
}

export function getDriverName(driver) {
  if (!driver) return '-';
  if (typeof driver === 'string') return driver;
  const name = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
  return name || driver._id || '-';
}

export function getDriverPhone(driver) {
  if (!driver) return '-';
  if (typeof driver === 'string') return '-';
  return driver.mobileNumber || driver.phone || '-';
}
