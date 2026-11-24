import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import ChevronIcon from '../pages/Trip/assets/ChevronIcon';
import UkoLogo from '../assets/uko-logo.png';
import { applyThemeToRoot } from '../utils/colorTheme';
import { clearAuthData } from '../utils/authUtils';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext.jsx';
import useApprovalBadges from '../hooks/useApprovalBadges';
import { getProfileField, getUserRole, readNavigationProfile } from '../utils/session';
import { useOrganization } from '../contexts/FeatureFlagsContext.jsx';
import NavHint from './redesign/NavHint';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  SIDE_NAV_GROUPS,
  isGroupActive,
  getNavGroupId,
  computeVisibleNav,
} from '../utils/sideNavUtils.js';
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
  const { canAccess, isEnabled, failed, retry, profile } = useFeatureFlags();
  const { organization } = useOrganization();
  const role = getUserRole();
  // Desktop expansion is handled by CSS hover, independently of the mobile drawer.
  const isDesktop = useMediaQuery('(min-width: 993px)');
  const isRailCollapsed = isDesktop && !isSidebarHovered;

  const logoSrc = !logoFailed && organization?.logoUrl ? organization.logoUrl : UkoLogo;
  const logoAlt = organization?.companyName || getProfileField('company_name') || 'Company logo';

  useEffect(() => {
    setLogoFailed(false);
  }, [organization?.logoUrl]);

  // No usage profile: the menu is never folded by usage, every entry stays in
  // its own section. App Usage reports screen-open counts at /usage.
  const { items: navItems } = useMemo(() => {
    const snapshot = failed && !profile ? readNavigationProfile() : null;
    if (!snapshot) return computeVisibleNav(canAccess, role, null, isEnabled);
    const entitled = (key) => snapshot.flags?.[key] === true;
    const granted = (key) => !key || (entitled(key) && snapshot.permissions?.[key] === true);
    return computeVisibleNav(granted, role, null, entitled);
  }, [canAccess, role, isEnabled, failed, profile]);

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

  // Restore the original active-route accordion behavior.
  useEffect(() => {
    if (activeGroupId) setOpenGroupId(activeGroupId);
  }, [activeGroupId]);

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

  // Page selection closes the mobile drawer; desktop stays open until hover ends.
  const closeSidebarOnMobile = () => {
    if (!isDesktop) setSidebarOpen(false);
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
        <NavHint key={item.to} hint={item.hint} label={item.label} collapsed={isRailCollapsed}>
          <NavLink
            to={item.to}
            end={item.end}
            className="nav-link"
            aria-label={item.label}
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
        </NavHint>
      );
    }

    // type === 'group' (collapsible dropdown)
    // Children already satisfy the feature, module and role access checks.
    const visibleChildren = item.children || [];
    const groupId = getNavGroupId(item);
    const isOpen = openGroupId === groupId;
    return (
      <div className="nav-section" key={groupId}>
        <NavHint hint={item.hint} label={item.label} collapsed={isRailCollapsed}>
          <button
            className={`nav-link nav-parent ${isOpen ? 'active-parent' : ''}`}
            onClick={() => toggleGroup(groupId)}
            aria-label={item.label}
            aria-expanded={isOpen}
          >
            <div className="nav-parent-left">
              <Icon size={20} />
              <span>{item.label}</span>
              {item.badgeKey === 'approvalsTotal' && approvalsCount + billApprovalsCount > 0 && (
                <span
                  className="erp-badge warning"
                  style={{ fontSize: '11px', padding: '2px 7px' }}
                >
                  {approvalsCount + billApprovalsCount}
                </span>
              )}
            </div>
            <ChevronIcon size={16} className={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
          </button>
        </NavHint>
        <div
          className={`nav-children ${isOpen ? 'open' : ''}`}
          inert={!isOpen || isRailCollapsed}
          aria-hidden={!isOpen || isRailCollapsed}
        >
          <div className="nav-children-inner">
            {visibleChildren.map((child) => (
              <NavHint
                key={`${child.to}-${child.label}`}
                hint={child.hint}
                label={child.label}
                collapsed={isRailCollapsed}
              >
                <NavLink
                  to={child.to}
                  end={child.end}
                  className="nav-link nav-child"
                  onClick={closeSidebarOnMobile}
                >
                  <span>{child.label}</span>
                </NavLink>
              </NavHint>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    // Hover tracks the desktop rail without changing the mobile drawer state.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- hover only tracks presentation
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
        {/* The account could not be read: say so, and offer the retry. Without
            this the rail silently collapses to a few icons and looks broken. */}
        {failed ? (
          <div className="nav-banner" role="status">
            <span className="nav-banner__text">Couldn&apos;t load your account</span>
            <span className="nav-banner__sep" aria-hidden="true">
              &middot;
            </span>
            <button type="button" className="nav-banner__retry" onClick={retry}>
              Retry
            </button>
          </div>
        ) : null}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(renderNavItem)}
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
