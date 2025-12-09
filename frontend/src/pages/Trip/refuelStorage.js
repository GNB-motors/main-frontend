const REFUEL_LOGS_STORAGE_KEY = 'fleetpro_refuel_logs_v1';

const seedRefuelLogs = [
  {
    id: 'RF-1001',
    date: '2025-12-05',
    time: '09:20',
    vehicleNo: 'WB-01-1234',
    vehicleModel: 'Tata LPT 1618',
    driverName: 'Driver A (Devayan)',
    driverPhone: '+91 98765 43210',
    location: 'Indian Oil, Park Street - Kolkata',
    fuelType: 'Diesel',
    quantity: 120,
    unitPrice: 90,
    totalAmount: 10800,
    odometer: 12680,
    paymentMethod: 'Fuel Card',
    vendor: 'Indian Oil',
    notes: 'Top-up before western corridor trip.'
  },
  {
    id: 'RF-1002',
    date: '2025-12-04',
    time: '18:45',
    vehicleNo: 'WB-02-5678',
    vehicleModel: 'Ashok Leyland 1920',
    driverName: 'Driver B (Amitansu)',
    driverPhone: '+91 99876 54321',
    location: 'HP Fuel Stop, Pune Bypass',
    fuelType: 'Diesel',
    quantity: 95,
    unitPrice: 91.4,
    totalAmount: 8683,
    odometer: 45390,
    paymentMethod: 'Company Card',
    vendor: 'Hindustan Petroleum',
    notes: 'Evening refill during return leg.'
  },
  {
    id: 'RF-1003',
    date: '2025-12-03',
    time: '14:10',
    vehicleNo: 'WB-06-9001',
    vehicleModel: 'Tata Prima 4038',
    driverName: 'Driver C',
    driverPhone: '+91 91234 56780',
    location: 'Bharat Petroleum, NH48 - Surat',
    fuelType: 'AdBlue',
    quantity: 18,
    unitPrice: 64.5,
    totalAmount: 1161,
    odometer: 78980,
    paymentMethod: 'Cash',
    vendor: 'Bharat Petroleum',
    notes: 'AdBlue top-up before hill ascent.'
  }
];

const loadRefuelLogs = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return seedRefuelLogs;
  }
  try {
    const stored = window.localStorage.getItem(REFUEL_LOGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Unable to read refuel logs from storage', error);
  }

  try {
    window.localStorage.setItem(
      REFUEL_LOGS_STORAGE_KEY,
      JSON.stringify(seedRefuelLogs)
    );
  } catch (error) {
    console.warn('Unable to seed refuel logs in storage', error);
  }

  return seedRefuelLogs;
};

const persistRefuelLogs = (logs) => {
  if (!Array.isArray(logs)) {
    return;
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(REFUEL_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to persist refuel logs', error);
  }
};

const notifyRefuelLogsUpdated = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event('refuelLogsUpdated'));
};

export {
  REFUEL_LOGS_STORAGE_KEY,
  seedRefuelLogs,
  loadRefuelLogs,
  persistRefuelLogs,
  notifyRefuelLogsUpdated
};
