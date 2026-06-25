// Canonical insurance enums + merge placeholders. Mirrors the backend
// (lead.model.js) so the UI and API agree on stage/flag names.

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Quote Shared',
  'Documents Pending',
  'Policy Issued',
  'Converted',
  'Closed',
];

export const LEAD_PRIORITIES = ['Hot', 'Warm', 'Cold'];

// Tokens an agent can drop into a signature / template body. `sample` is used by
// the live preview to render a realistic email; on save the token stays literal
// and is merged against lead data when sending (a later phase).
export const PLACEHOLDERS = [
  { token: '{{CustomerName}}', label: 'Customer Name', sample: 'Rajesh Kumar' },
  { token: '{{MobileNumber}}', label: 'Mobile Number', sample: '98765 43210' },
  { token: '{{Email}}', label: 'Email', sample: 'rajesh@example.com' },
  { token: '{{CompanyName}}', label: 'Company Name', sample: 'GNB Edge Insurance' },
  { token: '{{VehicleNumber}}', label: 'Vehicle Number', sample: 'MH12 AB 1234' },
  { token: '{{PolicyNumber}}', label: 'Policy Number', sample: 'POL-2026-0042' },
  { token: '{{AgentName}}', label: 'Agent Name', sample: 'Priya Sharma' },
];

// Replace every {{token}} with its sample value (preview only).
export function fillPlaceholders(html) {
  if (!html) return '';
  let out = html;
  PLACEHOLDERS.forEach(({ token, sample }) => {
    out = out.split(token).join(sample);
  });
  return out;
}
