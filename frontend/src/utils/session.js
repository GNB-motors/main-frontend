/**
 * THE single gateway to localStorage. Nothing outside this module may touch
 * localStorage directly — enforced by the `no-restricted-syntax` ESLint rule.
 *
 * All reads are null-safe (storage failures return null, never throw).
 */
/* eslint-disable no-restricted-syntax -- this IS the sanctioned localStorage module */

const KEYS = {
  token: 'authToken',
  tokenType: 'tokenType',
  userId: 'user_id',
  userEmail: 'user_email',
  userRole: 'user_role',
  userFirstName: 'user_firstName',
  userLastName: 'user_lastName',
  userStatus: 'user_status',
  userMobileNumber: 'user_mobileNumber',
  orgId: 'user_orgId',
  branchId: 'user_branchId',
  onboardingCompleted: 'onboardingCompleted',
  themeColor: 'primaryThemeColor',
  profileId: 'profile_id',
  profileBusinessRefId: 'profile_business_ref_id',
  profileOwnerEmail: 'profile_owner_email',
  profileCompanyName: 'profile_company_name',
  profileGstin: 'profile_gstin',
};

function get(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage full or unavailable — session state degrades gracefully
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// --- Auth & user ---

export const getToken = () => get(KEYS.token);
export const getTokenType = () => get(KEYS.tokenType);
export const getUserId = () => get(KEYS.userId);
export const getUserEmail = () => get(KEYS.userEmail);
export const getUserRole = () => get(KEYS.userRole);
export const getUserFirstName = () => get(KEYS.userFirstName);
export const getUserLastName = () => get(KEYS.userLastName);
export const getUserStatus = () => get(KEYS.userStatus);
export const getUserMobileNumber = () => get(KEYS.userMobileNumber);
export const getOrgId = () => get(KEYS.orgId);
export const getBranchId = () => get(KEYS.branchId);

/** Full display name; falls back to whatever parts exist. */
export const getUserName = () => {
  const parts = [get(KEYS.userFirstName), get(KEYS.userLastName)].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : (get(KEYS.userEmail) ?? '');
};

export const isAuthenticated = () => Boolean(getToken());

export const isOnboarded = () => get(KEYS.onboardingCompleted) === 'true';

/**
 * Persist a login response ({ token, user, organization }) in one call.
 * Mirrors the shape returned by the login API.
 */
export const setSession = ({ token, tokenType = 'Bearer', user, organization } = {}) => {
  if (token) {
    set(KEYS.token, token);
    set(KEYS.tokenType, tokenType);
  }
  if (user) {
    if (user._id || user.id) set(KEYS.userId, user._id || user.id);
    if (user.email) set(KEYS.userEmail, user.email);
    if (user.role) set(KEYS.userRole, user.role);
    if (user.firstName) set(KEYS.userFirstName, user.firstName);
    if (user.lastName) set(KEYS.userLastName, user.lastName);
    if (user.status) set(KEYS.userStatus, user.status);
    if (user.mobileNumber) set(KEYS.userMobileNumber, user.mobileNumber);
    if (user.orgId) set(KEYS.orgId, user.orgId);
    if (user.primaryThemeColor) setThemeColor(user.primaryThemeColor);
  }
  if (organization?.isOnboarded !== undefined) {
    set(KEYS.onboardingCompleted, String(organization.isOnboarded === true));
  }
};

export const setBranchId = (id) => {
  if (id) set(KEYS.branchId, id);
  else remove(KEYS.branchId);
};

export const setOrgId = (id) => {
  if (id) set(KEYS.orgId, id);
  else remove(KEYS.orgId);
};

// --- Theme ---

export const getThemeColor = () => get(KEYS.themeColor);

export const setThemeColor = (color) => {
  if (!color) return;
  set(KEYS.themeColor, color);
  // Dispatch custom event so Sidebar/Navbar re-render in the same tab.
  // window 'storage' event does NOT fire in the same tab — CustomEvent does.
  window.dispatchEvent(new CustomEvent('themeColorChange'));
};

// --- UI preference (dark/light) — NOT part of the auth session ---

const UI_THEME_KEY = 'gnb-theme';

export const getUiTheme = () => get(UI_THEME_KEY);
export const setUiTheme = (value) => set(UI_THEME_KEY, value);

// --- Generic UI preferences ---
// Escape hatch for non-auth persisted UI state (graph theme, panel collapse,
// etc.). Do NOT store auth/user/profile data through these.

export const getPref = (key) => get(key);
export const setPref = (key, value) => set(key, value);
export const removePref = (key) => remove(key);

// --- Profile (individual fields, consumed via utils/profileStorage.js) ---

export const getProfileField = (field) => get(`profile_${field}`);
export const setProfileField = (field, value) => set(`profile_${field}`, value);
export const removeProfileField = (field) => remove(`profile_${field}`);
export const hasProfileData = () => get(KEYS.profileId) !== null;

// --- Teardown ---

/** Clear auth + user + profile. Leaves theme color untouched. */
export const clearSession = () => {
  Object.values(KEYS).forEach(remove);
};
