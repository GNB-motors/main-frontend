import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

// Import assets
import DefaultAvatar from '../../assets/default-avatar.png';
import UserIcon from '../../assets/user-icon.svg';

// Import ProfileService for API calls
import { ProfileService } from './ProfileService';
import { getThemeCSS } from '../../utils/colorTheme';

const ProfilePage = () => {
    const [userData, setUserData] = useState(null);
    const [organizationData, setOrganizationData] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [themeColors, setThemeColors] = useState(getThemeCSS());

    // Update theme colors when component mounts
    useEffect(() => {
        setThemeColors(getThemeCSS());
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoadingProfile(true);
            setProfileError(null);

            try {
                // Call /auth/me endpoint
                const response = await ProfileService.getProfile();
                
                // Extract user and organization data from response
                const { user, organization } = response;
                
                setUserData(user);
                setOrganizationData(organization);

                // Store individual profile fields in localStorage (for compatibility)
                if (user) {
                    localStorage.setItem('profile_id', user.id);
                    localStorage.setItem('profile_owner_email', user.email);
                    localStorage.setItem('primaryThemeColor', user.primaryThemeColor || '#007bff');
                }
                
                if (organization) {
                    localStorage.setItem('profile_company_name', organization.companyName);
                    localStorage.setItem('profile_gstin', organization.gstin);
                    localStorage.setItem('profile_owner_email', organization.ownerEmail);
                }

                console.log("User data loaded:", user);
                console.log("Organization data loaded:", organization);
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
        if (isLoadingProfile) {
            return <div className="profile-card">Loading profile...</div>;
        }
        if (profileError) {
            return <div className="profile-card error-message">{profileError}</div>;
        }
        if (!userData || !organizationData) {
            return <div className="profile-card">Could not load profile data.</div>;
        }
        return <UserInfo user={userData} organization={organizationData} />;
    };

    return (
        <div className="profile-container" style={themeColors}>
            <div className="profile-content">{renderContent()}</div>
        </div>
    );
};

// UserInfo component - Display only, no editing
const UserInfo = ({ user, organization }) => {
    return (
        <div className="profile-card">
            <h4>Your account information</h4>
            <div className="avatar-section">
                 <div className="avatar-container">
                     <img src={DefaultAvatar} alt="User Avatar" className="avatar-img" />
                 </div>
                 <div className="avatar-details">
                     <h5>{organization?.companyName || 'Company Name'}</h5>
                     <p>Email: {organization?.ownerEmail || 'N/A'}</p>
                     <p>Role: {user?.role || 'N/A'}</p>
                     <p>Status: {user?.status || 'N/A'}</p>
                 </div>
            </div>
            <div className="info-form">
                <div className="form-row">
                     <div className="form-group">
                         <label>First Name</label>
                         <input 
                             type="text" 
                             value={user?.firstName || ''} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Last Name</label>
                         <input 
                             type="text" 
                             value={user?.lastName || ''} 
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
                             value={user?.location || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Mobile Number</label>
                         <input 
                             type="tel" 
                             value={user?.mobileNumber || 'N/A'} 
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
                             value={organization?.gstin || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Email</label>
                         <input 
                             type="email" 
                             value={user?.email || ''} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                <div className="form-row">
                     <div className="form-group">
                         <label>Company Name</label>
                         <input 
                             type="text" 
                             value={organization?.companyName || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Organization ID</label>
                         <input 
                             type="text" 
                             value={organization?._id || 'N/A'} 
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