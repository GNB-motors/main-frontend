import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

// Import assets
import DefaultAvatar from '../../assets/default-avatar.png';
import UserIcon from '../../assets/user-icon.svg';

// Removed ProfileService import - using mock data instead
import { getThemeCSS } from '../../utils/colorTheme';

// Mock data for profile and user info
const mockProfileData = {
    _id: 'mock-profile-id',
    ownerEmail: 'user@example.com',
    companyName: 'Demo Company',
    gstin: '22AAAAA0000A1Z5',
    primaryThemeColor: '#007bff',
    secondaryThemeColor: '#6c757d',
    businessRefId: 'DEMO001'
};

const mockUserInfo = {
    username: 'Demo User',
    email: 'user@example.com',
    role: 'user',
    isActive: true
};

const ProfilePage = () => {
    const [profileData, setProfileData] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [themeColors, setThemeColors] = useState(getThemeCSS());

    // Update theme colors when component mounts
    useEffect(() => {
        setThemeColors(getThemeCSS());
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            // Simulate loading delay for better UX
            setIsLoadingProfile(true);
            setProfileError(null);

            try {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));

                // Use mock data instead of API calls
                setProfileData(mockProfileData);
                setUserInfo(mockUserInfo);

                // Store individual profile fields in localStorage (for compatibility)
                localStorage.setItem('profile_id', mockProfileData._id);
                localStorage.setItem('profile_owner_email', mockProfileData.ownerEmail);
                localStorage.setItem('profile_company_name', mockProfileData.companyName);
                localStorage.setItem('profile_gstin', mockProfileData.gstin);
                localStorage.setItem('primaryThemeColor', mockProfileData.primaryThemeColor);

                console.log("Profile data loaded (mock):", mockProfileData);
                console.log("User info loaded (mock):", mockUserInfo);
            } catch (error) {
                console.error('Failed to load profile:', error);
                setProfileError('Failed to load profile information.');
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    const renderContent = () => {
        // Profile loading is now handled by DashboardLayout
        if (profileError) return <div className="profile-card error-message">{profileError}</div>;
        if (!profileData) return <div className="profile-card">Could not load profile data.</div>;
        return <UserInfo profile={profileData} userInfo={userInfo} />;
    };

    return (
        <div className="profile-container" style={themeColors}>
            <div className="profile-sidebar">
                <h3>User Profile</h3>
            </div>
            <div className="profile-content">{renderContent()}</div>
        </div>
    );
};

// UserInfo component - Display only, no editing
const UserInfo = ({ profile, userInfo }) => {
    // Split username into first and last name
    const nameParts = userInfo?.username?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return (
        <div className="profile-card">
            <h4>Your account information</h4>
            <div className="avatar-section">
                 <div className="avatar-container">
                     <img src={DefaultAvatar} alt="User Avatar" className="avatar-img" />
                 </div>
                 <div className="avatar-details">
                     <h5>{profile?.company_name || 'Company Name'}</h5>
                     <p>Business Ref: {profile?.business_ref_id || 'N/A'}</p>
                      <p>Role: {profile?.is_superadmin ? 'Super Admin' : 'Admin'}</p>
                 </div>
            </div>
            <div className="info-form">
                <div className="form-row">
                     <div className="form-group">
                         <label>First Name</label>
                         <input 
                             type="text" 
                             value={firstName} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Last Name</label>
                         <input 
                             type="text" 
                             value={lastName} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                 <div className="form-row">
                     <div className="form-group">
                         <label>Location</label>
                         <input 
                             type="text" 
                             value={userInfo?.location || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Mobile Number</label>
                         <input 
                             type="tel" 
                             value={userInfo?.mobile_number || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                 <div className="form-row">
                     <div className="form-group">
                         <label>GSTIN</label>
                         <input 
                             type="text" 
                             value={userInfo?.gstin || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Email</label>
                         <input 
                             type="email" 
                             value={userInfo?.email || ''} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                <div className="form-actions">
                    <div className="profile-edit-notice">
                        <p>If you need to edit your information, please contact the administrator.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;