const keysOfRole = (role) => {
  if (!role) return [];
  if (Array.isArray(role.permissionKeys)) return role.permissionKeys;
  // Fallback for roles stored only as a { key: bool } map.
  return Object.entries(role.permissions || {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);
};

export default keysOfRole;
