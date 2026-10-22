import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import ChevronIcon from '../pages/Trip/assets/ChevronIcon';
import UkoLogo from '../assets/uko-logo.png';
import { applyThemeToRoot } from '../utils/colorTheme';
import { clearAuthData } from '../utils/authUtils';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext.jsx';
import useApprovalBadges from '../hooks/useApprovalBadges';
import { getUserRole } from '../utils/session';
import { useOrganization } from '../contexts/FeatureFlagsContext.jsx';
import {
  SIDE_NAV_GROUPS,
  isGroupActive,
  getNavGroupId,
  computeVisibleNav,
} from '../utils/sideNavUtils.js';
import { useUsageAnalytics } from '../contexts/UsageAnalyticsContext.js';
import './Sidebar.css';

const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Accordion: at most one group open at a time, keyed by getNavGroupId().
  const [openGroupId, setOpenGroupId] = useState(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  // A broken/expired logo URL must not leave an empty header, so a load error
  // falls back to the default mark exactly like "no logo uploaded" does.
  const [logoFailed, setLogoFailed] = useState(false);
  // `canAccess` = org-entitled (feature flag) AND role-permitted (RBAC). A
  // module only appears when the user's assigned role grants it — so granting a
  // role e.g. CRM/insurance makes it visible to that user automatically.
  const { canAccess } = useFeatureFlags();
  const { organization } = useOrganization();
  // The org's OWN measured usage. null => nothing is folded and the menu is
  // whole; that is the designed state for every org until it has been measured.
  const { profile: usageProfile } = useUsageAnalytics();
  const role = getUserRole();

  const logoSrc = !logoFailed && organization?.logoUrl ? organization.logoUrl : UkoLogo;
  const logoAlt = organization?.companyName || 'Company logo';

  useEffect(() => {
    setLogoFailed(false);
  }, [organization?.logoUrl]);

  const { items: navItems, folded, foldedByJob } = useMemo(
    () => computeVisibleNav(canAccess, role, usageProfile),
    [canAccess, role, usageProfile],
  );
  // Entries the org's own numbers folded. They are NOT gone: each keeps its
  // route and the sentence the server wrote, and lives under "More" so a cut
  // never hides a screen with no way back to it.
  const [moreOpen, setMoreOpen] = useState(false);
  const foldedJobs = Object.keys(foldedByJob || {}).sort();
  const onFoldedRoute = (folded || []).some((f) => location.pathname === f.to);

  // Approval badges belong to the ERP "Approval Center". For an org without the
  // erpApprovals entitlement that nav group is hidden AND the backend routes
  // answer 404 (requireFeature hides disabled modules), so only poll when the
  // Approval Center is actually accessible.
  // A SUPER_ADMIN on a dashboard page has no org, so there is nothing to count.
  const { approvals: approvalsCount, bills: billApprovalsCount } = useApprovalBadges(
    canAccess('erpApprovals') && getUserRole() !== 'SUPER_ADMIN',
  );

  // Defensive: ensure :root has the current theme CSS variables on mount and
  // whenever the theme color changes. The Sidebar previously kept a LOCAL
  // copy of theme colors and applied them inline on <aside>, which created a
  // competing CSS variable scope: when the local state was stale (e.g. before
  // the profile API resolved), descendants resolved var(--primary-light) to
  // the stale inline value instead of the freshly-updated :root value. By
  // dropping the inline style and routing all updates through :root, every
  // descendant sees a single source of truth.
  useEffect(() => {
    applyThemeToRoot();
    const handleThemeChange = () => applyThemeToRoot();
    window.addEventListener('themeColorChange', handleThemeChange);
    return () => window.removeEventListener('themeColorChange', handleThemeChange);
  }, []);

  // The group (if any) that owns the current route.
  const activeGroupId = useMemo(() => {
    const match = SIDE_NAV_GROUPS.find((group) => isGroupActive(group, location.pathname));
    return match ? getNavGroupId(match) : null;
  }, [location.pathname]);

  // H.3 brand cue: the sidebar ground is orange in fleet sections and
  // cross-fades to blue on ERP & CRM routes (and back on leaving).
  const isErpRoute = location.pathname === '/erp' || location.pathname.startsWith('/erp/');

  // Auto-expand the group whose child route is active. Navigating to a route
  // outside every group leaves the user's manual selection alone.
  useEffect(() => {
    if (activeGroupId) setOpenGroupId(activeGroupId);
  }, [activeGroupId]);

  // Auto-close the dropdown when sidebar is not hovered on desktop, unless the
  // group's own route is active.
  useEffect(() => {
    if (!isSidebarHovered && window.innerWidth > 992) {
      const timer = setTimeout(() => setOpenGroupId(activeGroupId), 200);
      return () => clearTimeout(timer);
    }
  }, [isSidebarHovered, activeGroupId]);

  // Opening a group collapses whichever one was open — the CSS grid-rows
  // transition animates both at once, so they cross-fade smoothly.
  const toggleGroup = (groupId) => {
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const handleLogout = () => {
    // Full logout teardown (auth token, user data, profile fields, theme
    // colour, active location) lives in authUtils.clearAuthData.
    clearAuthData();
    navigate('/login');
  };

  // When a nav link is clicked on mobile, close the sidebar.
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 992) {
      setSidebarOpen(false);
    }
  };

  // Render one item from the SIDE_NAV_ITEMS config. Feature-flag filtering
  // already happened in getVisibleNavItems().
  const renderNavItem = (item) => {
    const Icon = item.icon;

    if (item.type === 'section') {
      return (
        <div className="nav-section-label" key={`section-${item.label}`}>
          <span>{item.label}</span>
        </div>
      );
    }

    if (item.type === 'link') {
      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className="nav-link"
          onClick={closeSidebarOnMobile}
        >
          <Icon size={20} />
          <span>{item.label}</span>
          {item.badgeKey === 'approvalsCount' && approvalsCount > 0 && (
            <span
              className="erp-badge warning"
              style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 7px' }}
            >
              {approvalsCount}
            </span>
          )}
          {item.badgeKey === 'billApprovalsCount' && billApprovalsCount > 0 && (
            <span
              className="erp-badge warning"
              style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 7px' }}
            >
              {billApprovalsCount}
            </span>
          )}
        </NavLink>
      );
    }

    // type === 'group' (collapsible dropdown)
    // Children are already flag-, module-, role- and usage-filtered by
    // getVisibleNavItems(); re-filtering here would undo the cut.
    const visibleChildren = item.children || [];
    const groupId = getNavGroupId(item);
    const isOpen = openGroupId === groupId;
    return (
      <div className="nav-section" key={groupId}>
        <button
          className={`nav-link nav-parent ${isOpen ? 'active-parent' : ''}`}
          onClick={() => toggleGroup(groupId)}
          aria-expanded={isOpen}
        >
          <div className="nav-parent-left">
            <Icon size={20} />
            <span>{item.label}</span>
            {item.badgeKey === 'approvalsTotal' && approvalsCount + billApprovalsCount > 0 && (
              <span className="erp-badge warning" style={{ fontSize: '11px', padding: '2px 7px' }}>
                {approvalsCount + billApprovalsCount}
              </span>
            )}
          </div>
          <ChevronIcon size={16} className={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
        </button>
        <div className={`nav-children ${isOpen ? 'open' : ''}`}>
          <div className="nav-children-inner">
            {visibleChildren.map((child) => (
              <NavLink
                key={`${child.to}-${child.label}`}
                to={child.to}
                end={child.end}
                className="nav-link nav-child"
                onClick={closeSidebarOnMobile}
              >
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    // Hover only tracks whether the pointer is over the rail, so groups the
    // pointer left can collapse; it activates nothing and has no keyboard analogue.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- see above
    <aside
      className={`sidebar ${isSidebarOpen ? 'open' : ''} ${isErpRoute ? 'sidebar--erp' : ''}`}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
    >
      <div className="sidebar-content">
        <div className="sidebar-header">
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError swaps in the fallback logo; it is not a user interaction */}
          <img
            src={logoSrc}
            alt={logoAlt}
            className="logo-img"
            onError={() => setLogoFailed(true)}
          />
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(renderNavItem)}
          {foldedJobs.length > 0 && (
            <div className="nav-section nav-more" key="nav-more">
              <button
                className={`nav-link nav-parent ${moreOpen || onFoldedRoute ? 'active-parent' : ''}`}
                onClick={() => setMoreOpen((prev) => !prev)}
                aria-expanded={moreOpen}
              >
                <div className="nav-parent-left">
                  <span>More</span>
                  <span className="erp-badge" style={{ fontSize: '11px', padding: '2px 7px' }}>
                    {folded.length}
                  </span>
                </div>
                <ChevronIcon size={16} className={`chevron-icon ${moreOpen ? 'rotated' : ''}`} />
              </button>
              <div className={`nav-children ${moreOpen ? 'open' : ''}`}>
                <div className="nav-children-inner">
                  {foldedJobs.map((job) => (
                    <div key={`more-${job}`} className="nav-more-group">
                      <div className="nav-more-job">{foldedByJob[job][0].jobLabel}</div>
                      {foldedByJob[job].map((entry) => (
                        <NavLink
                          key={`${entry.to}-folded`}
                          to={entry.to}
                          end
                          className="nav-link nav-child nav-more-link"
                          title={entry.reason || 'Folded on this org’s own usage numbers'}
                          onClick={closeSidebarOnMobile}
                        >
                          <span>{entry.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
