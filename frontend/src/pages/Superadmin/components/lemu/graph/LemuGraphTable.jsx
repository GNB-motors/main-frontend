import React, { useMemo } from 'react';
import { KIND_LABEL, nodeAppearance } from './graphTheme';

/* The accessible equivalent of the canvas (plan Task 10, spec §4.6): a real
   <table> over the SAME filtered `visible` graph the canvas renders, so what a
   screen reader or keyboard user reaches is exactly what the 3D view shows.
   Rows are sorted by kind, then ops desc. Name cells are buttons wired to the
   tab's node-select handler, so the drawer gating matches clicking a sphere. */

/* nodeAppearance's ring vocabulary is renderer-facing; the table says the
   quiet part out loud. solid = code-layer node nobody measures yet — the
   correct non-claim (P1) — so it reads "structural", never "healthy". */
const RING_TEXT = { solid: 'structural', hollow: 'declared', fault: 'unreachable' };

/* ISO short form: `2026-09-03 14:22`. '—' when the node has no lastSeen. */
const shortIso = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 16).replace('T', ' ');
};

const LemuGraphTable = ({ graph, onSelectNode }) => {
  const rows = useMemo(
    () => [...graph.nodes].sort(
      (a, b) => a.kind.localeCompare(b.kind)
        || (b.ops || 0) - (a.ops || 0)
        || a.label.localeCompare(b.label),
    ),
    [graph.nodes],
  );

  return (
    <div className="lemu-graph3d__table" role="region" aria-label="Knowledge graph nodes" tabIndex={0}>
      <table>
        <caption>Knowledge graph nodes</caption>
        <thead>
          <tr>
            <th scope="col">Kind</th>
            <th scope="col">Name</th>
            <th scope="col">State</th>
            <th scope="col">Ops</th>
            <th scope="col">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((node) => {
            const { ring } = nodeAppearance(node, {});
            return (
              <tr key={node.id}>
                <td className="lemu-graph3d__table-kind">{KIND_LABEL[node.kind] || node.kind}</td>
                <td>
                  <button
                    type="button"
                    className="lemu-graph3d__table-name"
                    onClick={() => onSelectNode(node.id)}
                  >
                    {node.label}
                  </button>
                </td>
                <td>{RING_TEXT[ring] || ring}</td>
                <td className="lemu-graph3d__table-num">
                  {node.ops
                    ? node.ops.toLocaleString()
                    : <span className="lemu-graph3d__table-none">no traffic in 24h</span>}
                </td>
                <td className="lemu-graph3d__table-num">{shortIso(node.lastSeen)}</td>
              </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <td colSpan={5} className="lemu-graph3d__table-none">
                No nodes match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LemuGraphTable;
