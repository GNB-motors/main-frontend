/**
 * Contact-page enquiries: the options the public form offers and the labels
 * the super-admin inbox shows. Values match app/modules/enquiry/enquiry.constants.js.
 */

export const ENQUIRY_FLEET_SIZES = [
  { value: '1-5', label: '1 to 5 vehicles' },
  { value: '6-25', label: '6 to 25 vehicles' },
  { value: '26-100', label: '26 to 100 vehicles' },
  { value: '101-500', label: '101 to 500 vehicles' },
  { value: '500+', label: 'More than 500 vehicles' },
];

export const ENQUIRY_TOPICS = [
  { value: 'DEMO', label: 'A demo' },
  { value: 'PRICING', label: 'Pricing' },
  { value: 'MIGRATION', label: 'Moving off another system' },
  { value: 'HARDWARE', label: 'Hardware and GPS devices' },
  { value: 'AI_REPORTING', label: 'AI and reporting' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
];

export const ENQUIRY_STATUSES = ['NEW', 'CONTACTED', 'CLOSED'];

const STATUS_TONE = { NEW: 'caution', CONTACTED: 'inert', CLOSED: 'ok' };
export const enquiryStatusTone = (status) => STATUS_TONE[status] || 'inert';

const labelIn = (options) => (value) => options.find((o) => o.value === value)?.label || value;
export const fleetSizeLabel = labelIn(ENQUIRY_FLEET_SIZES);
export const topicLabel = labelIn(ENQUIRY_TOPICS);

export const EMPTY_ENQUIRY = {
  name: '',
  company: '',
  email: '',
  phone: '',
  fleetSize: '',
  region: '',
  topics: [],
  message: '',
  website: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Same rule as the backend Joi pattern.
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;

/** Field → message for everything the backend would reject; {} when the form can be sent. */
export function validateEnquiry(values) {
  const errors = {};
  const email = values.email.trim();
  const phone = values.phone.trim();

  if (values.name.trim().length < 2) errors.name = 'Enter your name';
  if (email && !EMAIL_RE.test(email)) errors.email = 'Enter a valid email';
  if (phone && !PHONE_RE.test(phone)) errors.phone = 'Enter a valid phone number';
  if (!email && !phone) errors.email = 'Add an email or a phone number so we can reply';
  if (!values.fleetSize) errors.fleetSize = 'Pick your fleet size';
  return errors;
}

export const toEnquiryPayload = (values) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  );
