import React from 'react';
import LemuStatusChip from './LemuStatusChip';

/* Render a node's status word and chip. */
const LemuNodeStatus = ({ state, reason, stale }) => (
  <div className="lemu-node-status">
    <LemuStatusChip state={state} />
    {reason && <div className="lemu-node-status__reason">{reason}</div>}
    {stale && <div className="lemu-node-status__stale">Numbers frozen at {stale} — newest bucket is old.</div>}
  </div>
);

export default LemuNodeStatus;
