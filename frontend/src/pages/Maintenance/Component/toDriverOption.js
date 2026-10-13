const toDriverOption = (d) => {
  const id = d._id || d.id;
  const firstName = (d.firstName || d.first_name || '').trim();
  const lastName = (d.lastName || d.last_name || '').trim();
  const combined = [firstName, lastName].filter(Boolean).join(' ');

  const displayName =
    (d.name && d.name.trim() !== '' && d.name.trim().toLowerCase() !== 'driver'
      ? d.name.trim()
      : '') ||
    combined ||
    (d.fullName && d.fullName.trim() !== '' ? d.fullName.trim() : '') ||
    (d.employeeId ? `Employee ${d.employeeId}` : '') ||
    (d.name ? d.name.trim() : '') ||
    'Driver';

  const phone = d.mobileNumber || d.mobile_number || d.mobile || d.phone || '';
  const roleTag = d.role && d.role !== 'DRIVER' ? ` · ${d.role}` : '';
  const label = `${displayName}${phone ? ` (${phone})` : ''}${roleTag}`;

  return {
    _id: id,
    name: label,
    rawName: displayName,
  };
};

export default toDriverOption;
