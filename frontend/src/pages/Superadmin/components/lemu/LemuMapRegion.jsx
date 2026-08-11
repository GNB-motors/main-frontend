import React from 'react';
import { Box, LayoutGrid, Power } from 'lucide-react';

/* Region wrapper for the System map. CODE / DATA / SCHEDULE are surface kinds,
   not semantic grouping of concerns. */
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

const LemuMapRegion = ({ kind, children, count }) => {
  const Icon = REGION_ICON[kind];
  return (
    <section className={`lemu-region lemu-region--${kind}`} aria-label={REGION_HEADING[kind]}>
      <div className="lemu-region__head">
        <Icon size={14} className="lemu-region__icon" />
        <h3 className="lemu-region__title">{REGION_HEADING[kind]}</h3>
        {typeof count === 'number' && <span className="lemu-region__count">{count}</span>}
      </div>
      <div className="lemu-region__body">{children}</div>
    </section>
  );
};

export default LemuMapRegion;
