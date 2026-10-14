export const EDITOR_ROLES = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];
export const canEditPlaces = (role) => EDITOR_ROLES.includes(String(role || '').toUpperCase());

export const TAB_IDS = [
  'places',
  'idling',
  'fuel',
  'stops',
  'routes',
  'facilities',
  'regions',
  'homes',
  'shadow',
];
