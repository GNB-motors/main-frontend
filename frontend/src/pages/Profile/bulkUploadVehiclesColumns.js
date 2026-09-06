// Column schema for the vehicle bulk-upload template. Keys match what the
// normalizer in utils/bulkNormalization emits.
export const VEHICLE_COLUMNS = [
  {
    key: 'registration_no',
    label: 'Vehicle No',
    placeholder: 'KA01AB1234',
    required: true,
  },
  {
    key: 'model',
    label: 'Model',
    placeholder: '4830TC, LPT 4830',
    required: true,
  },
  {
    key: 'chassis_number',
    label: 'Chassis No',
    placeholder: 'MAT828113S2C05629',
    required: true,
  },
];
