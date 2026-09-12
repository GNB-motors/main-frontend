/**
 * Pure presentation helpers for the Overview dashboard. Extracted from
 * OverviewPage so the component modules stay presentational and the helpers
 * stay unit-testable.
 */

/** Two-letter avatar initials from a driver/vehicle display name. */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Short "12 Aug" axis label for chart ticks; empty string when there is no date. */
export const getDateLabel = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};
