import React, { useCallback, useEffect, useState } from 'react';
import { Box, ChevronDown, LayoutGrid, Power } from 'lucide-react';
import { getPref, setPref } from '../../../../utils/session.js';

/* Region wrapper for the System map. CODE / DATA / SCHEDULE are surface kinds,
   not semantic grouping of concerns.

   Each region collapses. The data surface alone runs to 129 rows, which buries
   everything below it, so the open/closed choice is remembered per region via
   utils/session.js prefs. Storage is best-effort: an unreadable value means
   the region renders open. */
const REGION_HEADING = {
  code: 'Code surface',
  data: 'Data surface',
  schedule: 'Schedule surface',
};

const REGION_ICON = {
  code: Box,
  data: LayoutGrid,
  schedule: Power,
};

const storageKey = (kind) => `lemu.region.${kind}.collapsed`;

const readCollapsed = (kind) => getPref(storageKey(kind)) === '1';

const LemuMapRegion = ({ kind, children, count }) => {
  const Icon = REGION_ICON[kind];
  const [collapsed, setCollapsed] = useState(() => readCollapsed(kind));

  useEffect(() => {
    // storage is best-effort — the toggle still works for this session
    setPref(storageKey(kind), collapsed ? '1' : '0');
  }, [kind, collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const bodyId = `lemu-region-body-${kind}`;

  return (
    <section
      className={`lemu-region lemu-region--${kind}${collapsed ? ' lemu-region--collapsed' : ''}`}
      aria-label={REGION_HEADING[kind]}
    >
      <button
        type="button"
        className="lemu-region__head lemu-region__head--toggle"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls={bodyId}
        title={collapsed ? `Expand ${REGION_HEADING[kind]}` : `Collapse ${REGION_HEADING[kind]}`}
      >
        <Icon size={14} className="lemu-region__icon" />
        <h3 className="lemu-region__title">{REGION_HEADING[kind]}</h3>
        {typeof count === 'number' && <span className="lemu-region__count">{count}</span>}
        <ChevronDown size={15} className="lemu-region__chevron" aria-hidden="true" />
      </button>
      <div className="lemu-region__body" id={bodyId} hidden={collapsed}>
        {children}
      </div>
    </section>
  );
};

export default LemuMapRegion;
