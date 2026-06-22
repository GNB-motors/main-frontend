import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus, X, Trash2, Lock, ShieldCheck,
    Truck, Users, Route, Fuel, Wrench, FileText,
    BarChart3, Wallet, Settings as SettingsIcon,
    Grid, MapPin, BookOpen, User
} from 'lucide-react';
import { toast } from 'react-toastify';
import './RolesPermissionsPage.css';
import { RoleService } from './RoleService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import LottieLoader from '../../components/LottieLoader.jsx';
import { Switch } from '@mui/material';

// Icon per permission module key — falls back to ShieldCheck for any module
// added on the backend that the frontend hasn't been updated to map yet, so
// a new module never breaks this page, it just renders with a generic icon.
const MODULE_ICONS = {
    overview: Grid,
    reports: BarChart3,
    vehicles: Truck,
    vehicleActivity: Truck,
    employees: Users,
    locations: MapPin,
    fuelComparison: Fuel,
    fieldAgentFuel: Fuel,
    khataLedger: BookOpen,
    profile: User,
};

// Short, plain-language description per module — shown under each row so an
// Owner who isn't technical still understands exactly what they're granting.
const MODULE_DESCRIPTIONS = {
    overview: 'Dashboard overview and general stats',
    reports: 'Vehicle and fleet performance reports',
    vehicles: 'Fleet vehicles, documents and registration details',
    vehicleActivity: 'Refuel logs, mileage and model comparison',
    employees: 'Add, edit and manage employees and their roles',
    locations: 'Vehicle locations and map tracking',
    fuelComparison: 'Compare fuel prices and efficiency',
    fieldAgentFuel: 'Field agent specific fuel logs',
    khataLedger: 'Khata ledger, expenses and financial records',
    profile: 'User profile and personal settings',
};

const emptyPermissionsFor = (modules) =>
    modules.reduce((acc, m) => {
        acc[m.key] = { view: false, manage: false };
        return acc;
    }, {});

const RolesPermissionsPage = () => {
    const [themeColors] = useState(getThemeCSS());
    const [isLoading, setIsLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [draftPermissions, setDraftPermissions] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleBase, setNewRoleBase] = useState('MANAGER');
    const [isCreating, setIsCreating] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null); // role object or null
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchRoles = useCallback(async (selectId) => {
        try {
            setIsLoading(true);
            const data = await RoleService.getRoles();
            // The "Owner" default role is excluded here on purpose: it's never
            // assignable to an employee (the org's one Owner account always gets
            // full access regardless of what's stored against it — see
            // role.service.js resolvePermissions), so showing it as an editable
            // row would suggest toggling it does something when it doesn't.
            const fetchedRoles = (data.roles || []).filter((r) => r.baseRole !== 'OWNER');
            const fetchedModules = data.modules || [];
            setRoles(fetchedRoles);
            setModules(fetchedModules);

            const toSelect =
                fetchedRoles.find((r) => r._id === selectId) || fetchedRoles[0] || null;
            setSelectedRoleId(toSelect ? toSelect._id : null);
            
            if (toSelect) {
                const cleanPerms = {};
                fetchedModules.forEach(m => {
                    cleanPerms[m.key] = toSelect.permissions[m.key] || { view: false, manage: false };
                });
                setDraftPermissions(cleanPerms);
            } else {
                setDraftPermissions(null);
            }
            setIsDirty(false);
        } catch (err) {
            toast.error(err.detail || err.message || 'Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const selectedRole = useMemo(
        () => roles.find((r) => r._id === selectedRoleId) || null,
        [roles, selectedRoleId],
    );

    const handleSelectRole = (role) => {
        if (isDirty) {
            const confirmSwitch = window.confirm(
                'You have unsaved permission changes. Switch roles without saving?',
            );
            if (!confirmSwitch) return;
        }
        setSelectedRoleId(role._id);
        const cleanPerms = {};
        modules.forEach(m => {
            cleanPerms[m.key] = role.permissions[m.key] || { view: false, manage: false };
        });
        setDraftPermissions(cleanPerms);
        setIsDirty(false);
    };

    const handleToggle = (moduleKey, action) => {
        if (!draftPermissions) return;
        setDraftPermissions((prev) => {
            const current = prev[moduleKey] || { view: false, manage: false };
            const nextValue = !current[action];
            const next = { ...current, [action]: nextValue };
            // Manage implies view — can't grant write without read, and turning
            // off view should turn off manage too (mirrors backend normalisation
            // in role.service.js so the UI never shows a state the API would
            // silently correct on save).
            if (action === 'manage' && nextValue) next.view = true;
            if (action === 'view' && !nextValue) next.manage = false;
            return { ...prev, [moduleKey]: next };
        });
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        try {
            setIsSaving(true);
            await RoleService.updateRole(selectedRole._id, { permissions: draftPermissions });
            toast.success(`"${selectedRole.name}" permissions updated`);
            await fetchRoles(selectedRole._id);
        } catch (err) {
            toast.error(err.detail || err.message || 'Failed to save permissions');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        if (!selectedRole) return;
        const cleanPerms = {};
        modules.forEach(m => {
            cleanPerms[m.key] = selectedRole.permissions[m.key] || { view: false, manage: false };
        });
        setDraftPermissions(cleanPerms);
        setIsDirty(false);
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        const trimmed = newRoleName.trim();
        if (!trimmed) {
            toast.error('Please enter a role name');
            return;
        }
        try {
            setIsCreating(true);
            const created = await RoleService.createRole(trimmed, newRoleBase, emptyPermissionsFor(modules));
            toast.success(`Role "${trimmed}" created`);
            setIsAddModalOpen(false);
            setNewRoleName('');
            setNewRoleBase('MANAGER');
            await fetchRoles(created._id);
        } catch (err) {
            toast.error(err.detail || err.message || 'Failed to create role');
        } finally {
            setIsCreating(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            setIsDeleting(true);
            await RoleService.deleteRole(deleteTarget._id);
            toast.success(`Role "${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
            await fetchRoles();
        } catch (err) {
            toast.error(err.detail || err.message || 'Failed to delete role');
        } finally {
            setIsDeleting(false);
        }
    };

    const switchSx = {
        '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--primary-color, #4f46e5)' },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: 'var(--primary-color, #4f46e5)',
        },
    };

    if (isLoading) {
        return (
            <div className="roles-container" style={themeColors}>
                <LottieLoader isLoading={true} size="medium" message="Loading roles..." overlay={false} />
            </div>
        );
    }

    return (
        <div className="roles-container" style={themeColors}>
            <div className="roles-content-wrapper">
                <div className="roles-inner">
                    <div className="roles-header">
                        <div className="roles-header-text">
                            <h3>Roles &amp; Permissions</h3>
                            <p>Control what each employee can see and do across your fleet portal.</p>
                        </div>
                        <button className="roles-add-btn" onClick={() => setIsAddModalOpen(true)}>
                            <Plus size={16} />
                            <span>Add Role</span>
                        </button>
                    </div>

                    <div className="roles-layout">
                        {/* Left: role list */}
                        <div className="roles-frame">
                            <div className="roles-list-card">
                                {roles.length === 0 && (
                                    <div className="roles-list-empty">No roles yet</div>
                                )}
                                {roles.map((role) => (
                                    <button
                                        key={role._id}
                                        className={`role-list-item ${role._id === selectedRoleId ? 'active' : ''}`}
                                        onClick={() => handleSelectRole(role)}
                                    >
                                        <span className="role-list-item-name">{role.name}</span>
                                        {!role.isCustom && (
                                            <span className="role-list-item-badge">Default</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: permission panel */}
                        <div className="roles-frame">
                            <div className="roles-panel-card">
                                {!selectedRole || !draftPermissions ? (
                                    <div className="roles-panel-empty">
                                        <ShieldCheck size={28} />
                                        <span>Select a role to view its permissions</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="roles-panel-header">
                                            <div className="roles-panel-title-group">
                                                <div className="roles-panel-icon">
                                                    <ShieldCheck size={18} />
                                                </div>
                                                <div>
                                                    <div className="roles-panel-title">{selectedRole.name}</div>
                                                    <div className="roles-panel-subtitle">
                                                        {selectedRole.isCustom
                                                            ? 'Custom role'
                                                            : 'Default role — name is fixed, permissions are yours to set'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="roles-panel-actions">
                                                {selectedRole.isImmutable ? (
                                                    <span className="roles-immutable-chip">
                                                        <Lock size={11} /> Default
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="roles-icon-btn danger"
                                                        title="Delete role"
                                                        onClick={() => setDeleteTarget(selectedRole)}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="permission-modules">
                                            {modules.map((mod) => {
                                                const Icon = MODULE_ICONS[mod.key] || ShieldCheck;
                                                const perm = draftPermissions[mod.key] || { view: false, manage: false };
                                                return (
                                                    <div className="permission-module-row" key={mod.key}>
                                                        <div className="permission-module-info">
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <Icon size={15} color="var(--color-grey-400, #94a3b8)" />
                                                                <span className="permission-module-label">{mod.label}</span>
                                                            </div>
                                                            <span className="permission-module-desc">
                                                                {MODULE_DESCRIPTIONS[mod.key] || ''}
                                                            </span>
                                                        </div>
                                                        <div className="permission-module-toggles">
                                                            <div className="permission-toggle-group">
                                                                <span className="permission-toggle-label">View</span>
                                                                <Switch
                                                                    size="small"
                                                                    checked={!!perm.view}
                                                                    onChange={() => handleToggle(mod.key, 'view')}
                                                                    sx={switchSx}
                                                                />
                                                            </div>
                                                            <div className="permission-toggle-group">
                                                                <span className="permission-toggle-label">Manage</span>
                                                                <Switch
                                                                    size="small"
                                                                    checked={!!perm.manage}
                                                                    onChange={() => handleToggle(mod.key, 'manage')}
                                                                    sx={switchSx}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="roles-panel-footer">
                                            <button
                                                className="roles-btn-secondary"
                                                onClick={handleDiscard}
                                                disabled={!isDirty || isSaving}
                                            >
                                                Discard
                                            </button>
                                            <button
                                                className="roles-btn-primary"
                                                onClick={handleSave}
                                                disabled={!isDirty || isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save changes'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Role Modal */}
            {isAddModalOpen && (
                <div className="roles-modal-overlay" onClick={() => !isCreating && setIsAddModalOpen(false)}>
                    <div className="roles-modal" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleCreateRole}>
                            <div className="roles-modal-header">
                                <h4>Add new role</h4>
                                <button
                                    type="button"
                                    className="roles-modal-close"
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={isCreating}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="roles-modal-body">
                                <label className="roles-modal-label" htmlFor="newRoleName">
                                    Role name
                                </label>
                                <input
                                    id="newRoleName"
                                    type="text"
                                    className="roles-modal-input"
                                    placeholder="Enter name for the role here"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    autoFocus
                                />
                                <label className="roles-modal-label" htmlFor="newRoleBase" style={{ marginTop: '16px' }}>
                                    Base access level
                                </label>
                                <select
                                    id="newRoleBase"
                                    className="roles-modal-input"
                                    value={newRoleBase}
                                    onChange={(e) => setNewRoleBase(e.target.value)}
                                    style={{ marginBottom: '8px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                                >
                                    <option value="MANAGER">Manager (Dashboard access)</option>
                                    <option value="FIELD_AGENT">Field Agent (Limited access)</option>
                                    <option value="DRIVER">Driver (App access)</option>
                                </select>
                                <p className="roles-modal-hint">
                                    You can turn on access for each section after creating the role.
                                </p>
                            </div>
                            <div className="roles-modal-footer">
                                <button
                                    type="button"
                                    className="roles-btn-secondary"
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="roles-btn-primary" disabled={isCreating}>
                                    {isCreating ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirm modal */}
            {deleteTarget && (
                <div className="roles-modal-overlay" onClick={() => !isDeleting && setDeleteTarget(null)}>
                    <div className="roles-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="roles-modal-header">
                            <h4>Delete role</h4>
                            <button
                                type="button"
                                className="roles-modal-close"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="roles-modal-body">
                            <p className="roles-modal-warning-text">
                                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This
                                can't be undone. If any employee is currently assigned this role, you'll
                                need to reassign them first.
                            </p>
                        </div>
                        <div className="roles-modal-footer">
                            <button
                                type="button"
                                className="roles-btn-secondary"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="roles-btn-primary"
                                style={{ background: '#dc2626' }}
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesPermissionsPage;
