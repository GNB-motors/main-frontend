import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import ChevronIcon from '../pages/Trip/assets/ChevronIcon';
import UkoLogo from '../assets/uko-logo.png';
import { applyThemeToRoot } from '../utils/colorTheme';
import { clearAuthData } from '../utils/authUtils';
import { getToken, getOrgId } from '../utils/session.js';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext.jsx';
import { useOrganization } from '../contexts/FeatureFlagsContext.jsx';
import { SIDE_NAV_GROUPS, isGroupActive, getNavGroupId, getVisibleNavChildren, getVisibleNavItems } from '../utils/sideNavUtils.js';
import './Sidebar.css';


const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    // Accordion: at most one group open at a time, keyed by getNavGroupId().
    const [openGroupId, setOpenGroupId] = useState(null);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [approvalsCount, setApprovalsCount] = useState(0);
    const [billApprovalsCount, setBillApprovalsCount] = useState(0);
    // A broken/expired logo URL must not leave an empty header, so a load error
    // falls back to the default mark exactly like "no logo uploaded" does.
    const [logoFailed, setLogoFailed] = useState(false);
    // `canAccess` = org-entitled (feature flag) AND role-permitted (RBAC). A
    // module only appears when the user's assigned role grants it — so granting a
    // role e.g. CRM/insurance makes it visible to that user automatically.
    const { canAccess } = useFeatureFlags();
    const { organization } = useOrganization();

    const logoSrc = !logoFailed && organization?.logoUrl ? organization.logoUrl : UkoLogo;
    const logoAlt = organization?.companyName || 'Company logo';

    useEffect(() => {
        setLogoFailed(false);
    }, [organization?.logoUrl]);

    const navItems = useMemo(() => getVisibleNavItems(canAccess), [canAccess]);

    useEffect(() => {
        const authHeaders = () => {
            const token = getToken();
            if (!token) return null;
            const headers = { Authorization: `Bearer ${token}` };
            const orgId = getOrgId();
            if (orgId) headers['X-Org-Id'] = orgId;
            return headers;
        };

        const fetchApprovalsCount = async () => {
            try {
                const headers = authHeaders();
                if (!headers) return;
                const res = await fetch('/api/erp/approvals/summary', { headers });
                const data = await res.json();
                if (data.success) {
                    setApprovalsCount(data.data?.pendingCount || 0);
                }
            } catch {
                // ignore network error silently
            }
        };

        // Pending driver-bill count for the "Bill Approvals" badge (same endpoint the app uses).
        const fetchBillApprovalsCount = async () => {
            try {
                const headers = authHeaders();
                if (!headers) return;
                const res = await fetch('/api/app/v1/bills?status=PENDING&limit=1', { headers });
                const data = await res.json();
                setBillApprovalsCount(data?.data?.total || 0);
            } catch {
                // ignore network error silently
            }
        };

        fetchApprovalsCount();
        fetchBillApprovalsCount();
        const interval = setInterval(() => {
            fetchApprovalsCount();
            fetchBillApprovalsCount();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

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
                    <Icon size={20} /><span>{item.label}</span>
                    {item.badgeKey === 'approvalsCount' && approvalsCount > 0 && (
                      <span className="erp-badge warning" style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 7px' }}>
                        {approvalsCount}
                      </span>
                    )}
                    {item.badgeKey === 'billApprovalsCount' && billApprovalsCount > 0 && (
                      <span className="erp-badge warning" style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 7px' }}>
                        {billApprovalsCount}
                      </span>
                    )}
                </NavLink>
            );
        }

        // type === 'group' (collapsible dropdown)
        const visibleChildren = getVisibleNavChildren(item, canAccess);
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
                    </div>
                    <ChevronIcon
                        size={16}
                        className={`chevron-icon ${isOpen ? 'rotated' : ''}`}
                    />
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
        <aside
            className={`sidebar ${isSidebarOpen ? 'open' : ''} ${isErpRoute ? 'sidebar--erp' : ''}`}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
        >
            <div className="sidebar-content">
                <div className="sidebar-header">
                    <img
                        src={logoSrc}
                        alt={logoAlt}
                        className="logo-img"
                        onError={() => setLogoFailed(true)}
                    />
                </div>
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
