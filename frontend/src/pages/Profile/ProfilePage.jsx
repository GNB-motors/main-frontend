import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { ProfileService } from './ProfileService';
import { getThemeCSS } from '../../utils/colorTheme';
import { useOrganization } from '../../contexts/FeatureFlagsContext.jsx';
import { setProfileField, setThemeColor } from '../../utils/session.js';
import PageShell from '../../components/ui/PageShell';
import { ProfileCard, ProfileSkeleton } from './profileCard';
import { DetailsPanel } from './profileDetailsPanel';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [organizationData, setOrganizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [themeColors] = useState(getThemeCSS());
  const { refresh: refreshOrganization } = useOrganization();

  // Repaint this page from the server response, then re-read the shared
  // context so the sidebar mark swaps over without a reload.
  const handleLogoChange = (org) => {
    if (org) setOrganizationData(org);
    refreshOrganization?.();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { user, organization } = await ProfileService.getProfile();
        setUserData(user);
        setOrganizationData(organization);

        if (user) {
          setProfileField('id', user.id);
          setProfileField('owner_email', user.email);
          // setThemeColor dispatches themeColorChange itself, so
          // Sidebar/Navbar re-render with the loaded colour in the same tab
          setThemeColor(user.primaryThemeColor || '#2940d3');
        }
        if (organization) {
          setProfileField('company_name', organization.companyName);
          setProfileField('gstin', organization.gstin);
          setProfileField('owner_email', organization.ownerEmail);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile information.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <PageShell title="Profile">
        <ProfileSkeleton />
      </PageShell>
    );
  }

  if (error || !userData) {
    return (
      <PageShell title="Profile">
        <div className="flex h-full w-full items-center justify-center p-6">
          <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            <AlertCircle size={16} />
            {error || 'Could not load profile data.'}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <div className="h-full w-full bg-slate-50 p-6" style={themeColors}>
      <PageShell title="Profile">
        <div className="flex w-full gap-6 items-stretch">
          {/* Left sidebar */}
          <div className="w-72 shrink-0">
            <ProfileCard user={userData} organization={organizationData} />
          </div>

          {/* Right details */}
          <div className="min-w-0 flex-1">
            <DetailsPanel
              user={userData}
              organization={organizationData}
              canEditLogo={['OWNER', 'SUPER_ADMIN'].includes(userData?.role)}
              canManageLocations={['OWNER', 'MANAGER'].includes(userData?.role)}
              onLogoChange={handleLogoChange}
            />
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default ProfilePage;
