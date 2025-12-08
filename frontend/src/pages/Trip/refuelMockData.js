export const REFUEL_STORAGE_KEY = 'refuelLogs';

export const mockVehicles = [
  { id: 1, number: 'WB-01-1234', model: 'Tata LPT 1618' },
  { id: 2, number: 'WB-02-5678', model: 'Ashok Leyland 1920' },
  { id: 3, number: 'WB-06-9001', model: 'Tata Prima 4038' },
  { id: 4, number: 'WB-07-3456', model: 'Mahindra Blazo X 28' }
];

export const mockDrivers = [
  { id: 1, name: 'Driver A (Devayan)', phone: '+91 98765 43210' },
  { id: 2, name: 'Driver B (Amitansu)', phone: '+91 99876 54321' },
  { id: 3, name: 'Driver C', phone: '+91 91234 56780' },
  { id: 4, name: 'Driver H', phone: '+91 90909 11223' }
];

export const fuelTypes = ['Diesel', 'Petrol', 'CNG', 'AdBlue'];

export const paymentModes = ['Fuel Card', 'Company Card', 'Cash', 'UPI'];

export const receiptTypes = [
  { id: 'diesel', label: 'Diesel Slip' },
  { id: 'adblue', label: 'AdBlue Slip' }
];

export const mockReceiptExtracts = {
  diesel: {
    slipType: 'Diesel Slip',
    date: '2025-12-06',
    time: '14:35',
    location: 'IOCL Highway Pump, Durgapur',
    vendor: 'IndianOil Highway Pump',
    fuelType: 'Diesel',
    quantity: 118.4,
    unitPrice: 93.5,
    totalAmount: 11070.24,
    paymentMethod: 'Fuel Card',
    odometer: 78412,
    invoiceNumber: 'IOCL-582394',
    gstNumber: '19AAACI1681G1ZX'
  },
  adblue: {
    slipType: 'AdBlue Slip',
    date: '2025-12-05',
    time: '09:10',
    location: 'Xtra Mile Logistics Hub, Pune',
    vendor: 'AdBlue Express Center',
    fuelType: 'AdBlue',
    quantity: 22.5,
    unitPrice: 54.2,
    totalAmount: 1220.0,
    paymentMethod: 'Company Card',
    odometer: 90342,
    invoiceNumber: 'ABX-992134',
    gstNumber: '27AACCE9821A1Z3'
  }
};

export const defaultRefuelLogs = [
  {
    id: 1,
    transactionId: 'RF-2025-0001',
    date: '2025-10-05',
    time: '11:15',
    location: 'IndianOil Park Street, Kolkata',
    vehicleNumber: 'WB-01-1234',
  driverName: 'Driver A (Devayan)',
    driverPhone: '+91 98765 43210',
    fuelType: 'Diesel',
    quantityLiters: 120,
    amount: 10450,
    pricePerLiter: 87.08,
    paymentMode: 'Fuel Card',
    odometer: 128450
  },
  {
    id: 2,
    transactionId: 'RF-2025-0002',
    date: '2025-10-04',
    time: '18:05',
    location: 'HPCL NH48 Fuel Stop, Pune',
    vehicleNumber: 'WB-07-3456',
  driverName: 'Driver H',
  driverPhone: '+91 90909 11223',
    fuelType: 'Diesel',
    quantityLiters: 95,
    amount: 8230,
    pricePerLiter: 86.63,
    paymentMode: 'UPI',
    odometer: 67420
  },
  {
    id: 3,
    transactionId: 'RF-2025-0003',
    date: '2025-10-03',
    time: '07:55',
    location: 'Bharat Petroleum, Asansol',
    vehicleNumber: 'WB-02-5678',
  driverName: 'Driver B (Amitansu)',
  driverPhone: '+91 90123 45678',
    fuelType: 'Diesel',
    quantityLiters: 80,
    amount: 6960,
    pricePerLiter: 87.00,
    paymentMode: 'Cash',
    odometer: 45290
  },
  {
    id: 4,
    transactionId: 'RF-2025-0004',
    date: '2025-10-02',
    time: '14:40',
    location: 'Reliance, Bengaluru Airport Road',
    vehicleNumber: 'WB-06-9001',
  driverName: 'Driver C',
  driverPhone: '+91 91234 56780',
    fuelType: 'Diesel',
    quantityLiters: 110,
    amount: 9570,
    pricePerLiter: 87.00,
    paymentMode: 'Corporate Card',
    odometer: 79012
  },
  {
    id: 5,
    transactionId: 'RF-2025-0005',
    date: '2025-10-01',
    time: '09:20',
    location: 'Shell, Navi Mumbai MIDC',
    vehicleNumber: 'WB-05-6789',
  driverName: 'Driver A (Devayan)',
  driverPhone: '+91 98765 43210',
    fuelType: 'Diesel',
    quantityLiters: 102,
    amount: 8874,
    pricePerLiter: 87.00,
    paymentMode: 'Fuel Card',
    odometer: 23610
  }
];
