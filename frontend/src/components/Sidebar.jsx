import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import ChevronIcon from '../pages/Trip/assets/ChevronIcon';
import UkoLogo from '../assets/uko-logo.png';
import { applyThemeToRoot } from '../utils/colorTheme';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext.jsx';
import { SIDE_NAV_ITEMS, SIDE_NAV_GROUPS, isGroupActive } from '../utils/sideNavUtils.js';
import './Sidebar.css';


const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    // Per-group open state, keyed by the group's feature-flag key.
    const [openGroups, setOpenGroups] = useState({});
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const { isEnabled } = useFeatureFlags();

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

    // Auto-expand any group whose child route is currently active.
    useEffect(() => {
        setOpenGroups((prev) => {
            const next = { ...prev };
            let changed = false;
            SIDE_NAV_GROUPS.forEach((group) => {
                if (isGroupActive(group, location.pathname) && !next[group.key]) {
                    next[group.key] = true;
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [location.pathname]);

    // Auto-close dropdowns when sidebar is not hovered on desktop, unless the
    // group's own route is active.
    useEffect(() => {
        if (!isSidebarHovered && window.innerWidth > 992) {
            const timer = setTimeout(() => {
                setOpenGroups((prev) => {
                    const next = { ...prev };
                    SIDE_NAV_GROUPS.forEach((group) => {
                        if (!isGroupActive(group, location.pathname)) {
                            next[group.key] = false;
                        }
                    });
                    return next;
                });
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isSidebarHovered, location.pathname]);

    const toggleGroup = (key) => {
        setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => {
        // Clear user tokens here in a real application
        localStorage.removeItem('authToken'); // Clear token on logout
        // Clear individual profile fields on logout
        localStorage.removeItem('profile_id');
        localStorage.removeItem('profile_owner_email');
        localStorage.removeItem('profile_company_name');
        localStorage.removeItem('profile_gstin');
        localStorage.removeItem('primaryThemeColor');
        navigate('/login');
    };

    // When a nav link is clicked on mobile, close the sidebar.
    const closeSidebarOnMobile = () => {
        if (window.innerWidth <= 992) {
            setSidebarOpen(false);
        }
    };

    // Render one item from the SIDE_NAV_ITEMS config.
    const renderNavItem = (item) => {
        // `key: null` => always visible. Otherwise gate on the feature flag.
        if (item.key && !isEnabled(item.key)) return null;

        const Icon = item.icon;

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
                </NavLink>
            );
        }

        // type === 'group' (collapsible dropdown)
        const isOpen = !!openGroups[item.key];
        return (
            <div className="nav-section" key={item.key}>
                <button
                    className={`nav-link nav-parent ${isOpen ? 'active-parent' : ''}`}
                    onClick={() => toggleGroup(item.key)}
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
                    {item.children.map((child) => (
                        <NavLink
                            key={child.to}
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
        );
    };

    return (
        <aside
            className="sidebar"
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
        >
            <div className="sidebar-content">
                <div className="sidebar-header">
                    <img src={UkoLogo} alt="Uko Logo" className="logo-img" />
                </div>
                <nav className="sidebar-nav">
                    {SIDE_NAV_ITEMS.map(renderNavItem)}
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
