export const DEFAULT_SERVICE_TYPES = [
  'Periodic / Scheduled Service',
  'Engine Oil Change',
  'Brake Service',
  'Clutch Service',
  'Suspension / Steering',
  'Cooling System (Coolant / Radiator)',
  'Air Filter / Fuel Filter',
  'Tyre Rotation / Alignment',
  'Full Body / Detailing',
  'Others / Miscellaneous',
];

export const DEFAULT_REPAIR_TYPES = [
  'Engine Repair',
  'Transmission / Gearbox',
  'Brake System',
  'Clutch Replacement',
  'Suspension',
  'Electrical / Wiring',
  'Cooling / Radiator',
  'Body / Dent / Paint',
  'Tyre / Puncture',
  'Air Conditioning',
  'Others / Miscellaneous',
];

export const mergeUnique = (defaults, fromServer) => {
  const set = new Set(defaults);
  (fromServer || []).forEach((v) => v && set.add(v));
  return Array.from(set);
};
