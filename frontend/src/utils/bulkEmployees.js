/**
 * Utilities for bulk employee upload normalization, validation, and password generation
 */

/**
 * Split name into firstName and lastName
 * @param {string} name - Full name
 * @returns {{firstName: string, lastName: string}}
 */
export const splitName = (name) => {
  if (!name || typeof name !== 'string') {
    return { firstName: '', lastName: 'NA' };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { firstName: '', lastName: 'NA' };
  }
  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ') || 'NA';
  return { firstName, lastName };
};

/**
 * Normalize phone number to E.164-ish format
 * Assumes India (+91) for 10-digit numbers without country code
 * @param {string|number} phone - Phone number (can be string or number from Excel)
 * @returns {string|null} - Normalized phone or null if invalid
 */
export const normalizePhone = (phone) => {
  // Handle null, undefined, empty string
  if (phone === null || phone === undefined || phone === '') return null;
  
  // Convert to string (handles numbers from Excel/CSV)
  let phoneStr = String(phone).trim();
  if (!phoneStr) return null;
  
  // Remove all spaces, dashes, parentheses, dots
  let cleaned = phoneStr.replace(/[\s\-\(\)\.]/g, '');
  
  // If already starts with +, keep it
  if (cleaned.startsWith('+')) {
    cleaned = cleaned;
  } else if (/^[1-9]\d{9}$/.test(cleaned)) {
    // 10 digits starting with 1-9 -> assume India
    cleaned = `+91${cleaned}`;
  } else if (/^91[1-9]\d{9}$/.test(cleaned)) {
    // 12 digits starting with 91 -> add +
    cleaned = `+${cleaned}`;
  }
  
  // Validate against E.164-ish pattern: ^\+?[1-9]\d{1,14}$
  const e164Pattern = /^\+?[1-9]\d{1,14}$/;
  if (e164Pattern.test(cleaned)) {
    return cleaned;
  }
  
  return null;
};

/**
 * Normalize email - treat empty/null/undefined as not provided
 * @param {string|null|undefined} email - Email string
 * @returns {string|null} - Normalized email or null
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  
  // Basic email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailPattern.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  
  return null;
};

/**
 * Normalize role - default to DRIVER, coerce common variants
 * @param {string} role - Role string
 * @returns {string} - 'DRIVER' or 'MANAGER'
 */
export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return 'DRIVER';
  
  const normalized = role.trim().toUpperCase();
  if (normalized === 'MANAGER' || normalized === 'MGR' || normalized === 'MANAGEMENT') {
    return 'MANAGER';
  }
  return 'DRIVER';
};

/**
 * Generate a random password (min 8 chars)
 * @param {number} length - Password length (default 12)
 * @returns {string}
 */
export const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // digit
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special
  
  // Fill rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Validate a normalized employee row
 * @param {object} row - Employee row with normalized fields
 * @returns {object} - Error object (empty if valid)
 */
export const validateEmployeeRow = (row) => {
  const errors = {};
  
  if (!row.firstName || !row.firstName.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!row.lastName || !row.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!row.mobileNumber) {
    errors.mobileNumber = 'Phone number is required and must be valid';
  }
  
  if (!row.password || row.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  if (row.role && row.role !== 'DRIVER' && row.role !== 'MANAGER') {
    errors.role = 'Role must be DRIVER or MANAGER';
  }
  
  if (row.email && row.email !== null) {
    // Email is optional, but if provided must be valid
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(row.email)) {
      errors.email = 'Email must be valid format';
    }
  }
  
  return errors;
};

/**
 * Estimate payload size in bytes (rough approximation)
 * @param {Array} employees - Array of employee objects
 * @returns {number} - Estimated size in bytes
 */
export const estimatePayloadSize = (employees) => {
  const payload = { employees };
  return JSON.stringify(payload).length;
};

/**
 * Check if payload exceeds size limit
 * @param {Array} employees - Array of employee objects
 * @param {number} maxSizeMB - Max size in MB (default 1)
 * @returns {{exceeds: boolean, sizeMB: number, maxMB: number}}
 */
export const checkPayloadSize = (employees, maxSizeMB = 1) => {
  const sizeBytes = estimatePayloadSize(employees);
  const sizeMB = sizeBytes / (1024 * 1024);
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  return {
    exceeds: sizeBytes > maxBytes,
    sizeMB: parseFloat(sizeMB.toFixed(2)),
    maxMB: maxSizeMB,
    sizeBytes,
  };
};

