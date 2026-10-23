/**
 * Utility functions for managing profile data in the session store
 * Each profile field is stored individually for easier access
 */
import logger from './logger';
} from './session.js';
  setThemeColor,
  getThemeColor,
  hasProfileData as sessionHasProfileData,
  removeProfileField,
  setProfileField,
  getProfileField as sessionGetProfileField,
import {

/**
 * Store individual profile fields in the session store
 * @param {Object} profileData - The profile data to store
 */
export const storeProfileData = (profileData) => {
  try {
    if (profileData._id) setProfileField('id', profileData._id);
    if (profileData.ownerEmail) setProfileField('owner_email', profileData.ownerEmail);
    if (profileData.companyName) setProfileField('company_name', profileData.companyName);
    if (profileData.gstin) setProfileField('gstin', profileData.gstin);
    // setThemeColor persists the colour AND dispatches 'themeColorChange'.
    if (profileData.primaryThemeColor) setThemeColor(profileData.primaryThemeColor);
  } catch (error) {
    logger.warn('profileStorage', 'Failed to store profile data in the session store', error);
  }
};

/**
 * Store the /api/auth/me payload, which nests the fields under `user` and
 * `organization` rather than the flat shape storeProfileData takes.
 * @param {{ user?: Object, organization?: Object }} me
 */
export const storeMeProfile = ({ user, organization } = {}) =>
  storeProfileData({
    _id: user?.id ?? user?._id,
    ownerEmail: organization?.ownerEmail ?? user?.email,
    companyName: organization?.companyName,
    gstin: organization?.gstin,
    primaryThemeColor: user?.primaryThemeColor,
  });

/**
 * Retrieve profile data from the session store as an object
 * @returns {Object|null} - The stored profile data or null if not found
 */
export const getProfileData = () => {
  try {
    const profileData = {
      _id: getProfileField('id'),
      ownerEmail: getProfileField('owner_email'),
      companyName: getProfileField('company_name'),
      gstin: getProfileField('gstin'),
      primaryThemeColor: getThemeColor(),
    };

    // Check if any required field is missing
    if (!profileData._id) {
      return null;
    }

    return profileData;
  } catch (error) {
    logger.warn('profileStorage', 'Failed to retrieve profile data from the session store', error);
    return null;
  }
};

/**
 * Get individual profile field from the session store
 * @param {string} field - The field name (without 'profile_' prefix)
 * @returns {string|null} - The field value or null if not found
 */
export const getProfileField = (field) => {
  try {
    return sessionGetProfileField(field);
  } catch (error) {
    logger.warn(
      'profileStorage',
      `Failed to retrieve profile field '${field}' from the session store`,
      error,
    );
    return null;
  }
};

/**
 * Clear all profile data from the session store
 */
export const clearProfileData = () => {
  try {
    removeProfileField('id');
    removeProfileField('owner_email');
    removeProfileField('company_name');
    removeProfileField('gstin');
    logger.info('profileStorage', 'Profile data cleared from the session store');
  } catch (error) {
    logger.warn('profileStorage', 'Failed to clear profile data from the session store', error);
  }
};

/**
 * Check if profile data exists in the session store
 * @returns {boolean} - True if profile data exists, false otherwise
 */
export const hasProfileData = () => {
  return sessionHasProfileData();
};
