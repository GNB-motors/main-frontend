/**
 * Utility functions for managing profile data in localStorage
 * Each profile field is stored individually for easier access
 */

/**
 * Store individual profile fields in localStorage
 * @param {Object} profileData - The profile data to store
 */
export const storeProfileData = (profileData) => {
    try {
        if (profileData._id) localStorage.setItem('profile_id', profileData._id);
        if (profileData.ownerEmail) localStorage.setItem('profile_owner_email', profileData.ownerEmail);
        if (profileData.companyName) localStorage.setItem('profile_company_name', profileData.companyName);
        if (profileData.gstin) localStorage.setItem('profile_gstin', profileData.gstin);
        if (profileData.primaryThemeColor) localStorage.setItem('primaryThemeColor', profileData.primaryThemeColor);
        console.log('Profile data stored in localStorage:', profileData);
    } catch (error) {
        console.error('Failed to store profile data in localStorage:', error);
    }
};

/**
 * Retrieve profile data from localStorage as an object
 * @returns {Object|null} - The stored profile data or null if not found
 */
export const getProfileData = () => {
    try {
        const profileData = {
            _id: localStorage.getItem('profile_id'),
            ownerEmail: localStorage.getItem('profile_owner_email'),
            companyName: localStorage.getItem('profile_company_name'),
            gstin: localStorage.getItem('profile_gstin'),
            primaryThemeColor: localStorage.getItem('primaryThemeColor')
        };
        
        // Check if any required field is missing
        if (!profileData._id) {
            return null;
        }
        
        return profileData;
    } catch (error) {
        console.error('Failed to retrieve profile data from localStorage:', error);
        return null;
    }
};

/**
 * Get individual profile field from localStorage
 * @param {string} field - The field name (without 'profile_' prefix)
 * @returns {string|null} - The field value or null if not found
 */
export const getProfileField = (field) => {
    try {
        return localStorage.getItem(`profile_${field}`);
    } catch (error) {
        console.error(`Failed to retrieve profile field '${field}' from localStorage:`, error);
        return null;
    }
};

/**
 * Clear all profile data from localStorage
 */
export const clearProfileData = () => {
    try {
        localStorage.removeItem('profile_id');
        localStorage.removeItem('profile_owner_email');
        localStorage.removeItem('profile_company_name');
        localStorage.removeItem('profile_gstin');
        localStorage.removeItem('primaryThemeColor');
        console.log('Profile data cleared from localStorage');
    } catch (error) {
        console.error('Failed to clear profile data from localStorage:', error);
    }
};

/**
 * Check if profile data exists in localStorage
 * @returns {boolean} - True if profile data exists, false otherwise
 */
export const hasProfileData = () => {
    return localStorage.getItem('profile_id') !== null;
};
