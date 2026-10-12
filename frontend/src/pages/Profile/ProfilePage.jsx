import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { getThemeCSS } from '../../utils/colorTheme';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext.jsx';
import PageShell from '../../components/ui/PageShell';
import { ProfileCard, ProfileSkeleton } from './profileCard';
import { DetailsPanel } from './profileDetailsPanel';

// The shell's FeatureFlagsProvider already holds the /api/auth/me payload
// ({ user, organization }), and DashboardLayout copies it into the session.
const ProfilePage = () => {
  const { profile, ready, refresh } = useFeatureFlags();
  const [themeColors] = useState(getThemeCSS());
  // The logo upload answers with the updated organization; show it before the
  // context refresh lands.
  const [uploadedOrganization, setUploadedOrganization] = useState(null);

  const userData = profile?.user ?? null;
  const organizationData = uploadedOrganization ?? profile?.organization ?? null;

  // Re-read the shared context too, so the sidebar mark swaps over without a reload.
  const handleLogoChange = (org) => {
    if (org) setUploadedOrganization(org);
    refresh();
  };

  if (!ready) {
    return (
      <PageShell title="Profile">
        <ProfileSkeleton />
      </PageShell>
    );
  }

  if (!userData) {
    return (
      <PageShell title="Profile">
        <div className="flex h-full w-full items-center justify-center p-6">
          <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            <AlertCircle size={16} />
            Failed to load profile information.
            <button type="button" className="underline" onClick={refresh}>
              Retry
            </button>
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
              onLogoChange={handleLogoChange}
            />
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default ProfilePage;
