import { ChevronDown, ChevronRight } from 'lucide-react';
import Toggle from './Toggle';
import GroupCheck from './GroupCheck';

const PermissionGroups = ({
  groups,
  collapsed,
  groupState,
  granted,
  toggleCollapse,
  toggleGroup,
  toggleKey,
  readOnly,
}) => (
  <>
    {groups.map(({ group, items }) => {
      const isCollapsed = collapsed.has(group);
      const state = groupState(items);
      const onCount = items.filter((p) => granted.has(p.key)).length;
      return (
        <div className="rbac-group" key={group}>
          <div
            className="rbac-group__head"
            role="button"
            tabIndex={0}
            onClick={() => toggleCollapse(group)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCollapse(group);
              }
            }}
          >
            <span className="rbac-group__title">
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              {group}
              <span className="rbac-group__count">
                {onCount}/{items.length}
              </span>
            </span>
            <GroupCheck state={state} onToggle={() => toggleGroup(items)} disabled={readOnly} />
          </div>
          {!isCollapsed &&
            items.map((p) => (
              <div className="rbac-perm" key={p.key}>
                <div>
                  <div className="rbac-perm__label">{p.label || p.key}</div>
                  <div className="rbac-perm__desc">
                    {p.description || <span className="rbac-perm__key">{p.key}</span>}
                  </div>
                </div>
                <Toggle
                  checked={granted.has(p.key)}
                  onChange={() => toggleKey(p.key)}
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

export default PermissionGroups;
