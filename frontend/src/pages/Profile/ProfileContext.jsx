import React, { createContext, useState, useEffect, useContext } from 'react';
// Correct path for ProfileService relative to ProfileContext in the same folder
import { ProfileService } from './ProfileService.jsx';
import { validateTokenBeforeRequest, handleAuthError } from '../../utils/authUtils';

// 1. Create the Context
const ProfileContext = createContext(null);

// 2. Create the Provider Component
export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            // Validate token before making request
            if (!validateTokenBeforeRequest()) {
                setIsLoadingProfile(false);
                setProfile(null);
                return;
            }

            setIsLoadingProfile(true);
            setProfileError(null);
            try {
                const token = localStorage.getItem('authToken');
                const data = await ProfileService.getProfile(token);
                setProfile(data);
                // Store individual profile fields in localStorage
                localStorage.setItem('profile_id', data.id);
                localStorage.setItem('profile_user_id', data.user_id);
                localStorage.setItem('profile_company_name', data.company_name);
                localStorage.setItem('profile_business_ref_id', data.business_ref_id);
                localStorage.setItem('profile_color', data.profile_color);
                localStorage.setItem('profile_is_onboarded', data.is_onboarded.toString());
                localStorage.setItem('profile_is_superadmin', data.is_superadmin.toString());
                console.log("ProfileContext: Profile data loaded:", data);
            } catch (error) {
                console.error("ProfileContext: Failed to fetch profile:", error);
                setProfileError(error?.detail || "Failed to load profile data in context.");
                setProfile(null); // Clear profile on error
                
                // Handle 401 errors with auto-logout
                if (handleAuthError(error)) {
                    // Auth error handled, user will be redirected
                    return;
                }
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchProfileData();

        // Optional: Listen for storage changes if token might be updated elsewhere
        // window.addEventListener('storage', fetchProfileData);
        // return () => window.removeEventListener('storage', fetchProfileData);

    }, []); // Runs once on mount, or could re-run if token changes (needs more complex setup)

    // Function to explicitly reload profile (e.g., after update)
    const reloadProfile = async () => {
         const token = localStorage.getItem('authToken');
            if (!token) return; // Cannot reload without token

            setIsLoadingProfile(true);
            setProfileError(null);
            try {
                const data = await ProfileService.getProfile(token);
                setProfile(data);
                // Store individual profile fields in localStorage
                localStorage.setItem('profile_id', data.id);
                localStorage.setItem('profile_user_id', data.user_id);
                localStorage.setItem('profile_company_name', data.company_name);
                localStorage.setItem('profile_business_ref_id', data.business_ref_id);
                localStorage.setItem('profile_color', data.profile_color);
                localStorage.setItem('profile_is_onboarded', data.is_onboarded.toString());
                localStorage.setItem('profile_is_superadmin', data.is_superadmin.toString());
            } catch (error) {
                 console.error("ProfileContext: Failed to reload profile:", error);
                 setProfileError(error?.detail || "Failed to reload profile data.");
            } finally {
                setIsLoadingProfile(false);
            }
    };


    // Value provided to consuming components
    const value = {
        profile,
        isLoadingProfile,
        profileError,
        reloadProfile // Expose reload function if needed
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

// 3. Create a custom hook for easy consumption
export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    // You might return context directly, or structure it differently:
    // return { profile: context.profile, isLoading: context.isLoadingProfile, ... };
    return context;
};