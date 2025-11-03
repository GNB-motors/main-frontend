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
        localStorage.setItem('profile_id', profileData.id);
        localStorage.setItem('profile_user_id', profileData.user_id);
        localStorage.setItem('profile_company_name', profileData.company_name);
        localStorage.setItem('profile_business_ref_id', profileData.business_ref_id);
        localStorage.setItem('profile_color', profileData.profile_color);
        localStorage.setItem('profile_is_onboarded', profileData.is_onboarded.toString());
        localStorage.setItem('profile_is_superadmin', profileData.is_superadmin.toString());
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
            id: localStorage.getItem('profile_id'),
            user_id: localStorage.getItem('profile_user_id'),
            company_name: localStorage.getItem('profile_company_name'),
            business_ref_id: localStorage.getItem('profile_business_ref_id'),
            profile_color: localStorage.getItem('profile_color'),
            is_onboarded: localStorage.getItem('profile_is_onboarded') === 'true',
            is_superadmin: localStorage.getItem('profile_is_superadmin') === 'true'
        };
        
        // Check if any required field is missing
        if (!profileData.id || !profileData.user_id) {
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
        localStorage.removeItem('profile_user_id');
        localStorage.removeItem('profile_company_name');
        localStorage.removeItem('profile_business_ref_id');
        localStorage.removeItem('profile_color');
        localStorage.removeItem('profile_is_onboarded');
        localStorage.removeItem('profile_is_superadmin');
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
    return localStorage.getItem('profile_id') !== null && localStorage.getItem('profile_user_id') !== null;
};
