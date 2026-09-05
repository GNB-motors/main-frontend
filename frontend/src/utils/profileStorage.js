/**
 * Utility functions for managing profile data in the session store
 * Each profile field is stored individually for easier access
 */
import {
    getProfileField as sessionGetProfileField,
    setProfileField,
    removeProfileField,
    hasProfileData as sessionHasProfileData,
    getThemeColor,
    setThemeColor,
} from './session.js';

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
        console.error('Failed to store profile data in the session store:', error);
    }
};

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
            primaryThemeColor: getThemeColor()
        };
        
        // Check if any required field is missing
        if (!profileData._id) {
            return null;
        }
        
        return profileData;
    } catch (error) {
        console.error('Failed to retrieve profile data from the session store:', error);
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
        console.error(`Failed to retrieve profile field '${field}' from the session store:`, error);
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
        console.log('Profile data cleared from the session store');
    } catch (error) {
        console.error('Failed to clear profile data from the session store:', error);
    }
};

/**
 * Check if profile data exists in the session store
 * @returns {boolean} - True if profile data exists, false otherwise
 */
export const hasProfileData = () => {
    return sessionHasProfileData();
};