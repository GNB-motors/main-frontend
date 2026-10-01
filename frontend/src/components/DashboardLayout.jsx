import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import LottieLoader from './LottieLoader.jsx';
import CommandPalette from './cluster/CommandPalette.jsx';
import { ConfirmDialogHost } from './ui/ConfirmDialog.jsx';
import { applyThemeToRoot } from '../utils/colorTheme.js';
import { storeProfileData } from '../utils/profileStorage.js';
import { FeatureFlagsProvider, useFeatureFlags } from '../contexts/FeatureFlagsContext.jsx';
import { BranchProvider, useActiveBranch } from '../contexts/BranchContext.jsx';
import './DashboardLayout.css';

const DashboardLayoutInner = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  // Re-key the routed page on location switch so every fetch effect re-runs
  // against the newly selected branch (X-Branch-Id changes in the interceptor).
  const { branchId } = useActiveBranch();
  const { profile, ready } = useFeatureFlags();

  React.useEffect(() => {
    // Set all CSS tokens on :root immediately — covers page refresh & login redirect.
    // This updates --primary-color, --primary-light, --primary-dark,
    // --color-primary-500/600/100, and Shadcn's --primary (oklch).
    applyThemeToRoot();

    // Re-apply on any colour change (login, profile page, onboarding finish).
    // CustomEvent fires in the same tab — window 'storage' event does NOT.
    window.addEventListener('themeColorChange', applyThemeToRoot);
    return () => window.removeEventListener('themeColorChange', applyThemeToRoot);
  }, []);

  // Sync profile (incl. primaryThemeColor) for the entire authenticated
  // session, regardless of which page the user lands on. storeProfileData
  // dispatches `themeColorChange`, which the listener above translates into
  // applyThemeToRoot — so every page (Overview, Reports, Trip, …) gets the
  // user's theme color applied immediately after login. Reads the /api/auth/me
  // payload FeatureFlagsProvider already fetched instead of firing a second,
  // redundant request for the same endpoint.
  React.useEffect(() => {
    if (!profile) return;
    storeProfileData(profile);
    if (profile.primaryThemeColor) applyThemeToRoot();
  }, [profile]);

  // Hold the whole shell until the first /api/auth/me has settled: the sidebar
  // and the landing page both depend on its permissions/flags, and rendering
  // them first showed an empty/wrong sidebar and a page the user may not be
  // allowed to see. Only the first load gates — branch-switch refetches keep
  // the previous payload, so the shell never blanks after that.
  if (!ready) {
    return <LottieLoader isLoading size="medium" message="Loading your workspace..." />;
  }

  return (
    <div className="dashboard-layout">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main
        id="main-content"
        className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}
      >
        <Navbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        <div className="page-content" key={branchId || 'all-locations'}>
          <ConfirmDialogHost>
            <Outlet />
          </ConfirmDialogHost>
        </div>
      </main>
      <CommandPalette />
    </div>
  );
};

const DashboardLayout = () => (
  <FeatureFlagsProvider>
    <BranchProvider>
      <DashboardLayoutInner />
    </BranchProvider>
  </FeatureFlagsProvider>
);

export default DashboardLayout;
