const toSafeString = (value) => {
  if (value === null || value === undefined) return "";
  return value.toString().trim();
};

const normalizeWhitespace = (value) =>
  toSafeString(value).replace(/\s+/g, " ").trim();

const standardizeRegistration = (value) =>
  normalizeWhitespace(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const standardizeChassis = (value) =>
  normalizeWhitespace(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const standardizeName = (value) => {
  const cleaned = normalizeWhitespace(value).toLowerCase();
  if (!cleaned) return "";
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
};

const sanitizeRole = (value) => {
  const cleaned = normalizeWhitespace(value);
  if (!cleaned) return "Employee";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
};

const sanitizeKey = (key) =>
  toSafeString(key)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const VEHICLE_ALIAS_MAP = {
  registration_no: [
    "registration_no",
    "registration",
    "vehicle_registration_no",
    "reg no",
    "reg_no",
    "vehicle number",
    "regnumber",
    "regnum",
  ],
  vehicle_type: ["vehicle_type", "type", "category", "bodytype"],
  chassis_number: ["chassis_number", "chassis", "vin", "vinnumber", "serialnumber"],
};

const DRIVER_ALIAS_MAP = {
  name: ["name", "driver", "driver_name", "employee_name"],
  role: ["role", "designation"],
  vehicle_registration_no: [
    "vehicle_registration_no",
    "vehicle",
    "vehicle_registration",
    "registration_no",
    "reg no",
    "reg_no",
  ],
};

// --- Regex Definitions ---
const REGISTRATION_REGEX = /^[A-Z0-9]{5,}$/;
const EXTENDED_REGISTRATION_REGEX = /^[A-Z0-9-]{6,12}$/i;
const REGISTRATION_VALUE_REGEX = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{3,4}$/i;
const CHASSIS_REGEX = /^[A-Z0-9]{6,}$/;
const STRONG_CHASSIS_REGEX = /^[A-Z0-9]{10,}$/i;
const MODEL_NUMBER_REGEX = /^[A-Z0-9-]{3,}$/i;
const VEHICLE_TYPE_REGEX = /truck|van|bus|car|tractor|pickup|suv|tempo/i;

// --- Column Analysis Logic ---

const detectColumnMappings = (rows, mode = "vehicles") => {
  if (!rows.length) return {};
  
  const columnStats = {};
  const allKeys = new Set();
  
  // Initialize stats for all keys
  rows.forEach(row => {
    Object.keys(row).forEach(key => {
      allKeys.add(key);
      if (!columnStats[key]) {
        columnStats[key] = {
          total: 0,
          regMatch: 0,
          chassisMatch: 0,
          typeMatch: 0,
          aliasScore: {
            registration: 0,
            chassis: 0,
            type: 0,
            name: 0,
            role: 0
          }
        };
      }
    });
  });

  const aliases = mode === "vehicles" ? VEHICLE_ALIAS_MAP : DRIVER_ALIAS_MAP;

  // Calculate scores
  allKeys.forEach(key => {
    const cleanKey = sanitizeKey(key);
    const stats = columnStats[key];

    // Header Heuristics
    if (aliases.registration_no?.some(a => cleanKey.includes(sanitizeKey(a)))) stats.aliasScore.registration = 100;
    if (aliases.chassis_number?.some(a => cleanKey.includes(sanitizeKey(a)))) stats.aliasScore.chassis = 100;
    if (aliases.vehicle_type?.some(a => cleanKey.includes(sanitizeKey(a)))) stats.aliasScore.type = 100;
    if (aliases.name?.some(a => cleanKey.includes(sanitizeKey(a)))) stats.aliasScore.name = 100;
    if (aliases.role?.some(a => cleanKey.includes(sanitizeKey(a)))) stats.aliasScore.role = 100;

    // Content Heuristics
    rows.forEach(row => {
      const value = toSafeString(row[key]);
      if (!value) return;
      
      stats.total++;

      const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      
      // Registration check
      if (REGISTRATION_VALUE_REGEX.test(value) || (EXTENDED_REGISTRATION_REGEX.test(value) && normalized.length <= 13 && normalized.length > 5)) {
        stats.regMatch++;
      }

      // Chassis check
      if ((STRONG_CHASSIS_REGEX.test(value) && normalized.length >= 10) || normalized.length === 17) {
        stats.chassisMatch++;
      }

      // Type check
      if (VEHICLE_TYPE_REGEX.test(value) || (cleanKey.includes("model") && MODEL_NUMBER_REGEX.test(value))) {
        stats.typeMatch++;
      }
    });
  });

  const mapping = {};
  const usedKeys = new Set();

  const findBestKey = (field) => {
    let bestKey = null;
    let maxScore = -1;

    allKeys.forEach(key => {
      if (usedKeys.has(key)) return;
      
      const stats = columnStats[key];
      if (stats.total === 0) return;

      let score = 0;
      
      // Prioritize explicit header match
      if (field === "registration_no" && stats.aliasScore.registration) score += 1000;
      if (field === "chassis_number" && stats.aliasScore.chassis) score += 1000;
      if (field === "vehicle_type" && stats.aliasScore.type) score += 1000;
      if (field === "name" && stats.aliasScore.name) score += 1000;
      if (field === "role" && stats.aliasScore.role) score += 1000;
      // For drivers, vehicle_registration_no uses registration alias
      if (field === "vehicle_registration_no" && stats.aliasScore.registration) score += 1000;

      // Content match percentage
      const regPercent = (stats.regMatch / stats.total) * 100;
      const chassisPercent = (stats.chassisMatch / stats.total) * 100;
      const typePercent = (stats.typeMatch / stats.total) * 100;

      if (field === "registration_no" || field === "vehicle_registration_no") {
        if (regPercent > 50) score += regPercent;
      }
      if (field === "chassis_number" && chassisPercent > 50) score += chassisPercent;
      if (field === "vehicle_type" && typePercent > 50) score += typePercent;

      if (score > maxScore && score > 0) {
        maxScore = score;
        bestKey = key;
      }
    });

    if (bestKey) {
      mapping[field] = bestKey;
      usedKeys.add(bestKey);
    }
  };

  if (mode === "vehicles") {
    findBestKey("registration_no");
    findBestKey("chassis_number");
    findBestKey("vehicle_type");
  } else {
    findBestKey("name");
    findBestKey("vehicle_registration_no");
    findBestKey("role");
  }

  return mapping;
};

// --- Normalization Functions ---

const buildExtraFields = (row, usedKeys) => {
  const extra = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    if (!key || usedKeys.has(key)) return;
    const cleanedValue = toSafeString(value);
    if (cleanedValue) {
      extra[key] = cleanedValue;
    }
  });
  return extra;
};

export const normalizeVehicleDataset = (rows) => {
  const mapping = detectColumnMappings(rows, "vehicles");
  const usedKeys = new Set(Object.values(mapping));

  return rows.map(row => {
    const regValue = mapping.registration_no ? row[mapping.registration_no] : "";
    const typeValue = mapping.vehicle_type ? row[mapping.vehicle_type] : "";
    const chassisValue = mapping.chassis_number ? row[mapping.chassis_number] : "";

    // Fallback for extra fields: exclude keys used in mapping
    const rowUsedKeys = new Set(usedKeys);
    
    return {
      registration_no: standardizeRegistration(regValue),
      vehicle_type: normalizeWhitespace(typeValue),
      chassis_number: standardizeChassis(chassisValue),
      extra: buildExtraFields(row, rowUsedKeys)
    };
  });
};

export const normalizeDriverDataset = (rows) => {
  const mapping = detectColumnMappings(rows, "drivers");
  
  return rows.map(row => {
    const nameValue = mapping.name ? row[mapping.name] : "";
    const roleValue = mapping.role ? row[mapping.role] : "";
    const vehicleValue = mapping.vehicle_registration_no ? row[mapping.vehicle_registration_no] : "";

    return {
      name: standardizeName(nameValue),
      role: sanitizeRole(roleValue),
      vehicle_registration_no: standardizeRegistration(vehicleValue),
    };
  });
};

// Keep single row normalizers for backward compatibility or edge cases, 
// but updated to use dataset logic if needed (conceptually)
export const normalizeVehicleRow = (row) => normalizeVehicleDataset([row])[0];
export const normalizeDriverRow = (row) => normalizeDriverDataset([row])[0];


export const validateVehicleRow = (row) => {
  const issues = [];
  if (!row.registration_no || !REGISTRATION_REGEX.test(row.registration_no)) {
    issues.push("Registration number must be at least 5 characters (A-Z/0-9).");
  }
  if (row.chassis_number && !CHASSIS_REGEX.test(row.chassis_number)) {
    issues.push("Chassis number must be at least 6 alphanumeric characters.");
  }
  return issues;
};

export const validateDriverRow = (row) => {
  const issues = [];
  if (!row.name || row.name.length < 2) {
    issues.push("Name must be at least 2 characters.");
  }
  if (row.vehicle_registration_no && !REGISTRATION_REGEX.test(row.vehicle_registration_no)) {
    issues.push("Vehicle registration number must be at least 5 alphanumeric characters.");
  }
  if (row.role === "Super Admin") {
    issues.push("Bulk upload cannot assign Super Admin role.");
  }
  return issues;
};

export const dedupeRows = (rows, key) => {
  const seen = new Set();
  return rows.filter((row) => {
    const value = row[key];
    if (!value) return true;
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};