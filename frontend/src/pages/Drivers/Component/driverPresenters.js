// Pure display helpers for the Drivers components (WS0.7 split of driversComponents.jsx).

// Function to get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

// Human-friendly labels for the role enum.
export const ROLE_LABELS = {
  DRIVER: 'Driver',
  MANAGER: 'Manager',
  KAM: 'Key Account Manager',
  FIELD_AGENT: 'Field Agent',
  SUPER_ADMIN: 'Super Admin',
};
export const formatRole = (role, isSuperadmin) => {
  if (isSuperadmin) return 'Super Admin';
  return ROLE_LABELS[role] || role || 'Employee';
};
