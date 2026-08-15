import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Preferred group order; unlisted groups sort alphabetically after these.
const GROUP_ORDER = ['Overview', 'Reports', 'Fleet', 'Employees', 'Finance', 'CRM', 'ERP', 'General'];

/* Binary pill toggle (reuses FeatureFlags switch styling). */
const Toggle = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className="ff-switch"
    onClick={onChange}
  >
    <span className="ff-switch__thumb" />
  </button>
);

/* Group-level tri-state checkbox: all / none / mixed. */
const GroupCheck = ({ state, onToggle, disabled }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'mixed';
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="rbac-group__check"
      checked={state === 'all'}
      disabled={disabled}
      onChange={onToggle}
      onClick={(e) => e.stopPropagation()}
      aria-label="Toggle all permissions in this group"
    />
  );
};

/**
 * Renders a permission catalog as collapsible groups with per-leaf toggles.
 *
 * Props:
 *  - catalog:  [{ key, group, label, description }]
 *  - granted:  Set<string>  (currently-effective keys)
 *  - baseline: Set<string> | null  (enterprise default — when provided, leaves
 *              that differ from it show an "Override" chip; matching ones show
 *              "Inherited". null = no inheritance annotations, e.g. view mode.)
 *  - readOnly: bool
 *  - onToggleKey(key), onToggleGroup(items, allOn)
 */
const PermissionTreeView = ({ catalog = [], granted, baseline = null, readOnly = false, onToggleKey, onToggleGroup }) => {
  const [collapsed, setCollapsed] = useState(new Set());

  const groups = useMemo(() => {
    const byGroup = new Map();
    catalog.forEach((p) => {
      const g = p.group || 'General';
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(p);
    });
    const entries = [...byGroup.entries()].map(([group, items]) => ({
      group,
      items: items.sort((a, b) => (a.label || a.key).localeCompare(b.label || b.key)),
    }));
    entries.sort((a, b) => {
      const ai = GROUP_ORDER.indexOf(a.group);
      const bi = GROUP_ORDER.indexOf(b.group);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.group.localeCompare(b.group);
    });
    return entries;
  }, [catalog]);

  const toggleCollapse = (group) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const groupState = (items) => {
    const on = items.filter((p) => granted.has(p.key)).length;
    if (on === 0) return 'none';
    if (on === items.length) return 'all';
    return 'mixed';
  };

  const sourceChip = (key) => {
    if (!baseline) return null;
    const overridden = granted.has(key) !== baseline.has(key);
    if (overridden) return <span className="ac-chip ac-chip--override">Override</span>;
    return <span className="ac-chip ac-chip--inherited">Inherited</span>;
  };

  return (
    <>
      {groups.map(({ group, items }) => {
        const isCollapsed = collapsed.has(group);
        const onCount = items.filter((p) => granted.has(p.key)).length;
        return (
          <div className="rbac-group" key={group}>
            <div className="rbac-group__head" onClick={() => toggleCollapse(group)}>
              <span className="rbac-group__title">
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                {group}
                <span className="rbac-group__count">{onCount}/{items.length}</span>
              </span>
              <GroupCheck
                state={groupState(items)}
                onToggle={() => onToggleGroup && onToggleGroup(items, items.every((p) => granted.has(p.key)))}
                disabled={readOnly}
              />
            </div>
            {!isCollapsed && items.map((p) => (
              <div className="rbac-perm" key={p.key}>
                <div>
                  <div className="rbac-perm__label">
                    {p.label || p.key} {sourceChip(p.key)}
                  </div>
                  <div className="rbac-perm__desc">{p.description || <span className="rbac-perm__key">{p.key}</span>}</div>
                </div>
                <Toggle
                  checked={granted.has(p.key)}
                  onChange={() => onToggleKey && onToggleKey(p.key)}
                  disabled={readOnly}
                  label={`Toggle ${p.label || p.key}`}
                />
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};

export default PermissionTreeView;
