import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Trash2, Pencil, MoreHorizontal, ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import './RolesPermissionsPage.css';
import { RoleService } from './RoleService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import LottieLoader from '../../components/LottieLoader.jsx';

// Flatten a catalog tree to all permission keys (parents + children).
const flattenCatalog = (catalog) => {
    const keys = [];
    catalog.forEach((m) => {
        keys.push(m.key);
        (m.children || []).forEach((c) => keys.push(c.key));
    });
    return keys;
};

// Custom pill toggle (matches the reference design — no MUI).
const Toggle = ({ checked, disabled, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`rp-toggle ${checked ? 'on' : ''}`}
        onClick={(e) => { e.stopPropagation(); onChange(); }}
    >
        <span className="rp-toggle-handle" />
    </button>
);

const RolesPermissionsPage = () => {
    const [themeColors] = useState(getThemeCSS());
    const [isLoading, setIsLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [draft, setDraft] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [sectionOpen, setSectionOpen] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleBase, setNewRoleBase] = useState('MANAGER');
    const [isCreating, setIsCreating] = useState(false);
    const [renameTarget, setRenameTarget] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const flatKeys = useMemo(() => flattenCatalog(catalog), [catalog]);

    const buildDraft = useCallback(
        (role, keys) => keys.reduce((acc, k) => ({ ...acc, [k]: role?.permissions?.[k] === true }), {}),
        [],
    );

    const fetchRoles = useCallback(async (selectId) => {
        try {
            setIsLoading(true);
            const data = await RoleService.getRoles();
            const fetchedRoles = (data.roles || []).filter((r) => r.baseRole !== 'OWNER');
            const fetchedCatalog = data.catalog || [];
            const keys = flattenCatalog(fetchedCatalog);
            setRoles(fetchedRoles);
            setCatalog(fetchedCatalog);
            setExpanded(
                fetchedCatalog.reduce((acc, m) => (m.children?.length ? { ...acc, [m.key]: true } : acc), {}),
            );
            const toSelect = fetchedRoles.find((r) => r._id === selectId) || fetchedRoles[0] || null;
            setSelectedRoleId(toSelect ? toSelect._id : null);
            setDraft(toSelect ? buildDraft(toSelect, keys) : {});
            setIsDirty(false);
        } catch (err) {
            toast.error(err.detail || err.message || 'Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    }, [buildDraft]);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const selectedRole = useMemo(
        () => roles.find((r) => r._id === selectedRoleId) || null,
        [roles, selectedRoleId],
    );

    const selectRole = (role) => {
        if (isDirty && !window.confirm('You have unsaved changes. Switch roles without saving?')) return;
        setSelectedRoleId(role._id);
        setDraft(buildDraft(role, flatKeys));
        setIsDirty(false);
        setOpenMenuId(null);
    };

    const toggleModule = (mod) => {
        setDraft((prev) => {
            const v = !prev[mod.key];
            const next = { ...prev, [mod.key]: v };
            (mod.children || []).forEach((c) => { next[c.key] = v; });
            return next;
        });
        setIsDirty(true);
    };

    const toggleChild = (child, mod) => {
        setDraft((prev) => {
            const v = !prev[child.key];
            const next = { ...prev, [child.key]: v };
            if (v) next[mod.key] = true;
            else if (!(mod.children || []).some((c) => c.key !== child.key && next[c.key])) next[mod.key] = false;
            return next;
        });
        setIsDirty(true);
    };

    const toggleExpand = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

    const handleSave = async () => {
        if (!selectedRole) return;
        try {
            setIsSaving(true);
            await RoleService.updateRole(selectedRole._id, { permissions: draft });
            toast.success(`"${selectedRole.name}" permissions updated`);
            await fetchRoles(selectedRole._id);
        } catch (err) {
            toast.error(err.detail || err.message || 'Failed to save permissions');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (!selectedRole) return;
        setDraft(buildDraft(selectedRole, flatKeys));
        setIsDirty(false);
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        const trimmed = newRoleName.trim();
        if (!trimmed) { toast.error('Please enter a role name'); return; }
        try {
            setIsCreating(true);
            const emptyPerms = flatKeys.reduce((acc, k) => ({ ...acc, [k]: false }), {});
            const created = await RoleService.createRole(trimmed, newRoleBase, emptyPerms);
            toast.success(`Role "${trimmed}" created`);
            setIsAddOpen(false);
            setNewRoleName('');
            setNewRoleBase('MANAGER');
            await fetchRoles(created._id);
        } catch (err) {
            toast.error(err.detail || err.message || 'Failed to create role');
        } finally {
            setIsCreating(false);
        }
    };

    const handleRename = async (e) => {
        e.preventDefault();
        const trimmed = renameValue.trim();
        if (!trimmed) { toast.error('Please enter a name'); return; }
        try {
            setIsRenaming(true);
            await RoleService.updateRole(renameTarget._id, { name: trimmed });
            toast.success('Role renamed');
            setRenameTarget(null);
            await fetchRoles(renameTarget._id);
        } catch (err) {
            toast.error(err.detail || err.message || 'Failed to rename role');
        } finally {
            setIsRenaming(false);
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

    if (isLoading) {
        return (
            <div className="rp-page" style={themeColors}>
                <LottieLoader isLoading size="medium" message="Loading roles..." overlay={false} />
            </div>
        );
    }

    return (
        <div className="rp-page" style={themeColors}>
            <div className="rp-header">
                <h3>Roles &amp; permissions</h3>
                <p>Control what each employee role can access across your fleet portal.</p>
            </div>

            <div className="rp-card">
                {/* Left rail — roles + add */}
                <div className="rp-rail">
                    <div className="rp-rail-scroll">
                        {roles.length === 0 && <div className="rp-rail-empty">No roles yet</div>}
                        {roles.map((role) => (
                            <div className="rp-role-row" key={role._id}>
                                <button
                                    className={`rp-role ${role._id === selectedRoleId ? 'active' : ''}`}
                                    onClick={() => selectRole(role)}
                                >
                                    <span className="rp-role-name">{role.name}</span>
                                    {!role.isCustom && <span className="rp-role-badge">Default</span>}
                                </button>
                                {role.isCustom && (
                                    <button
                                        className="rp-role-more"
                                        title="Role options"
                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === role._id ? null : role._id); }}
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                )}
                                {openMenuId === role._id && (
                                    <>
                                        <div className="rp-menu-backdrop" onClick={() => setOpenMenuId(null)} />
                                        <div className="rp-menu">
                                            <button onClick={() => { setRenameTarget(role); setRenameValue(role.name); setOpenMenuId(null); }}>
                                                <Pencil size={15} /> Rename
                                            </button>
                                            <div className="rp-menu-divider" />
                                            <button className="danger" onClick={() => { setDeleteTarget(role); setOpenMenuId(null); }}>
                                                <Trash2 size={15} /> Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <button className="rp-fab" title="Add role" onClick={() => setIsAddOpen(true)}>
                        <Plus size={22} />
                    </button>
                </div>

                {/* Right — permissions */}
                <div className="rp-content">
                    {!selectedRole ? (
                        <div className="rp-empty">
                            <ShieldCheck size={28} />
                            <span>Select a role to set its permissions</span>
                        </div>
                    ) : (
                        <div className="rp-section">
                            <button className="rp-section-head" onClick={() => setSectionOpen((o) => !o)}>
                                <span className="rp-section-title">Fleet portal</span>
                                {sectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {sectionOpen && (
                                <div className="rp-section-body">
                                    {catalog.map((mod) => {
                                        const hasChildren = mod.children?.length > 0;
                                        if (!hasChildren) {
                                            return (
                                                <div className="rp-perm" key={mod.key}>
                                                    <div className="rp-perm-text">
                                                        <div className="rp-perm-title">{mod.label}</div>
                                                        {mod.description && <div className="rp-perm-desc">{mod.description}</div>}
                                                    </div>
                                                    <Toggle checked={!!draft[mod.key]} onChange={() => toggleModule(mod)} />
                                                </div>
                                            );
                                        }
                                        const isOpen = !!expanded[mod.key];
                                        return (
                                            <div className="rp-group" key={mod.key}>
                                                <div className="rp-group-head">
                                                    <button className="rp-group-collapse" onClick={() => toggleExpand(mod.key)}>
                                                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        <span className="rp-group-title">{mod.label}</span>
                                                    </button>
                                                    <Toggle checked={!!draft[mod.key]} onChange={() => toggleModule(mod)} />
                                                </div>
                                                {isOpen && (
                                                    <div className="rp-group-children">
                                                        {mod.children.map((child) => (
                                                            <div className="rp-perm rp-perm-child" key={child.key}>
                                                                <div className="rp-perm-text">
                                                                    <div className="rp-perm-title">{child.label}</div>
                                                                    {child.description && <div className="rp-perm-desc">{child.description}</div>}
                                                                </div>
                                                                <Toggle checked={!!draft[child.key]} onChange={() => toggleChild(child, mod)} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {selectedRole && (
                <div className="rp-pagefooter">
                    <button className="rp-btn-cancel" onClick={handleCancel} disabled={!isDirty || isSaving}>Cancel</button>
                    <button className="rp-btn-save" onClick={handleSave} disabled={!isDirty || isSaving}>
                        {isSaving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            )}

            {/* Add Role Modal */}
            {isAddOpen && (
                <div className="roles-modal-overlay" onClick={() => !isCreating && setIsAddOpen(false)}>
                    <div className="roles-modal" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleCreateRole}>
                            <div className="roles-modal-header">
                                <h4>Add new role</h4>
                                <button type="button" className="roles-modal-close" onClick={() => setIsAddOpen(false)} disabled={isCreating}><X size={16} /></button>
                            </div>
                            <div className="roles-modal-body">
                                <label className="roles-modal-label" htmlFor="newRoleName">Role name</label>
                                <input id="newRoleName" type="text" className="roles-modal-input" placeholder="Enter a name for the role" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} autoFocus />
                                <label className="roles-modal-label" htmlFor="newRoleBase" style={{ marginTop: 16 }}>Base access level</label>
                                <select id="newRoleBase" className="roles-modal-input" value={newRoleBase} onChange={(e) => setNewRoleBase(e.target.value)}>
                                    <option value="MANAGER">Manager (Dashboard access)</option>
                                    <option value="FIELD_AGENT">Field Agent (Limited access)</option>
                                    <option value="DRIVER">Driver (App access)</option>
                                </select>
                                <p className="roles-modal-hint">Turn on the sections this role can access after creating it.</p>
                            </div>
                            <div className="roles-modal-footer">
                                <button type="button" className="roles-btn-secondary" onClick={() => setIsAddOpen(false)} disabled={isCreating}>Cancel</button>
                                <button type="submit" className="roles-btn-primary" disabled={isCreating}>{isCreating ? 'Saving…' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {renameTarget && (
                <div className="roles-modal-overlay" onClick={() => !isRenaming && setRenameTarget(null)}>
                    <div className="roles-modal" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleRename}>
                            <div className="roles-modal-header">
                                <h4>Rename role</h4>
                                <button type="button" className="roles-modal-close" onClick={() => setRenameTarget(null)} disabled={isRenaming}><X size={16} /></button>
                            </div>
                            <div className="roles-modal-body">
                                <label className="roles-modal-label" htmlFor="renameInput">Role name</label>
                                <input id="renameInput" type="text" className="roles-modal-input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
                            </div>
                            <div className="roles-modal-footer">
                                <button type="button" className="roles-btn-secondary" onClick={() => setRenameTarget(null)} disabled={isRenaming}>Cancel</button>
                                <button type="submit" className="roles-btn-primary" disabled={isRenaming}>{isRenaming ? 'Saving…' : 'Save'}</button>
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
                            <button type="button" className="roles-modal-close" onClick={() => setDeleteTarget(null)} disabled={isDeleting}><X size={16} /></button>
                        </div>
                        <div className="roles-modal-body">
                            <p className="roles-modal-warning-text">
                                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This can't be undone.
                                If any employee is currently assigned this role, you'll need to reassign them first.
                            </p>
                        </div>
                        <div className="roles-modal-footer">
                            <button type="button" className="roles-btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</button>
                            <button type="button" className="roles-btn-primary" style={{ background: '#dc2626' }} onClick={handleConfirmDelete} disabled={isDeleting}>
                                {isDeleting ? 'Deleting…' : 'Delete role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesPermissionsPage;
