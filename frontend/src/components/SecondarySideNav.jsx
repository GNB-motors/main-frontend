import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import './SecondarySideNav.css';

/**
 * SecondarySideNav — a persistent, always-expanded inner rail that lists the
 * sections of one module (e.g. Reports). It sits beside the primary icon rail
 * and, unlike the primary rail, does NOT hover-expand — it's a fixed-width column
 * with independently collapsible groups (no accordion).
 *
 * items: array of nodes, each either
 *   - a group:     { id, label, children: [{ id, label }] }
 *   - a flat item: { id, label }            (top-level, no group wrapper)
 *
 * Props:
 *   activeOption          currently-selected leaf/flat id (external source of truth)
 *   onSelect(id)          called when a leaf or flat row is chosen
 *   variant               'reports' | 'collapse' | 'large' (width variants)
 *   filterHeader          optional node pinned above the list (first <li>, fixed)
 *   filterHeaderHeight    px height of the filter block; couples to the first
 *                         group's padding-top (default 118)
 *   strictRenderListBody  escape hatch: caller markup that replaces the whole list
 *   scrollId              dom id on the scroll wrapper (hover-reveals the scrollbar)
 */
const isGroup = (node) => Array.isArray(node?.children) && node.children.length > 0;

const SecondarySideNav = ({
  items = [],
  activeOption,
  onSelect,
  variant,
  className = '',
  filterHeader = null,
  filterHeaderHeight = 118,
  strictRenderListBody = null,
  scrollId = 'secondary-side-nav',
  style,
}) => {
  // Selection is external (activeOption) but mirrored locally so deep links and
  // back/forward highlight the right row the instant they change.
  const [selected, setSelected] = useState(activeOption);
  useEffect(() => { setSelected(activeOption); }, [activeOption]);

  // Each group tracks its OWN open state, defaults open, toggles independently.
  const [openGroups, setOpenGroups] = useState({});
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      items.forEach((n) => { if (isGroup(n) && next[n.id] === undefined) next[n.id] = true; });
      return next;
    });
  }, [items]);

  const select = (id) => {
    setSelected(id);
    onSelect?.(id);
  };

  const groupIsActive = (g) => g.id === selected || g.children.some((c) => c.id === selected);

  const onHeaderClick = (g) => {
    const currentlyOpen = openGroups[g.id] !== false;
    setOpenGroups((prev) => ({ ...prev, [g.id]: !currentlyOpen }));
    // Opening a group navigates to its first child rather than leaving an empty
    // pane — unless one of its children is already the active selection.
    if (!currentlyOpen && g.children.length && !g.children.some((c) => c.id === selected)) {
      select(g.children[0].id);
    }
  };

  const firstGroupId = items.find((n) => isGroup(n))?.id;

  const listBody = strictRenderListBody ?? (
    <ul className="ssn-list">
      {filterHeader && (
        <li className="ssn-filter" style={{ height: filterHeaderHeight }}>
          {filterHeader}
        </li>
      )}

      {items.map((node) => {
        if (!isGroup(node)) {
          return (
            <li key={node.id} className="ssn-flat-wrap">
              <button
                type="button"
                className={`ssn-flat ${selected === node.id ? 'active' : ''}`}
                onClick={() => select(node.id)}
              >
                {node.label}
              </button>
            </li>
          );
        }

        const open = openGroups[node.id] !== false;
        const padForFilter = filterHeader && node.id === firstGroupId;
        return (
          <li
            key={node.id}
            className={`ssn-group ${groupIsActive(node) ? 'active' : ''}`}
            style={padForFilter ? { paddingTop: filterHeaderHeight } : undefined}
          >
            <button
              type="button"
              className="ssn-group__header"
              onClick={() => onHeaderClick(node)}
              aria-expanded={open}
            >
              <span>{node.label}</span>
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {open && (
              <ul className="ssn-children">
                {node.children.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      className={`ssn-child ${selected === child.id ? 'active' : ''}`}
                      onClick={() => select(child.id)}
                    >
                      {child.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`secondary-side-nav ${variant ? `ssn--${variant}` : ''} ${className}`.trim()}
      style={style}
    >
      <div id={scrollId} className="ssn-scroll">
        {listBody}
      </div>
    </aside>
  );
};

export default SecondarySideNav;
