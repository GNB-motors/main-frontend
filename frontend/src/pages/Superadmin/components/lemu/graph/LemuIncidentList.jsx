import React, { useState } from 'react';
import { ChevronRight, Zap } from 'lucide-react';
import { formatIncidentAge } from './incidentRank';

/* Ranked incident list (I4) — the COMPANION to the on-canvas urgency
   treatment, never a replacement for it (owner, 2026-09-16: the dense graph
   is the point). The canvas makes the worst incident unmistakable; this
   panel exists so nothing is missed when a node is occluded, filtered out of
   the hop window, or buried in the hairball. Rows are the same ranked
   incident objects the canvas draws from (incidentRank.rankIncidents), so
   list order and on-canvas loudness can never disagree. Clicking a row
   selects the node and flies the camera to it when it is in the current
   view. */

const shortName = (id) => String(id || '').replace(/^\w+:/, '');

const LemuIncidentList = ({ incidents = [], onFocusNode }) => {
  /* Collapsible like the dead-surfaces panel, but a real alarm: it starts
     OPEN. Dismissing it never dismisses the incident — the canvas keeps
     pulsing until the error resolves upstream. */
  const [open, setOpen] = useState(true);
  if (!incidents.length) return null;

  return (
    <section className="lemu-graph3d__incidents lemu-graph3d__panel" aria-label="Ranked incidents">
      <button
        type="button"
        className="lemu-graph3d__incidents-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronRight
          size={13}
          className={
            open
              ? 'lemu-graph3d__incidents-caret lemu-graph3d__incidents-caret--open'
              : 'lemu-graph3d__incidents-caret'
          }
          aria-hidden="true"
        />
        <Zap size={13} aria-hidden="true" />
        Incidents <b>{incidents.length}</b>
      </button>
      {open && (
        <ol className="lemu-graph3d__incidents-body">
          {incidents.map((incident, rank) => (
            <li key={incident.fingerprint || incident.nodeId}>
              <button
                type="button"
                className="lemu-graph3d__incident-row"
                title={`${incident.severity} · ${incident.occurrences} occurrence(s) · unresolved ${formatIncidentAge(incident.ageMs)}`}
                onClick={() => onFocusNode?.(incident.nodeId)}
              >
                <span
                  className={`lemu-graph3d__incident-sev lemu-graph3d__incident-sev--${String(incident.severity || 'error').toLowerCase()}`}
                >
                  {incident.severity || 'ERROR'}
                </span>
                <span className="lemu-graph3d__incident-rank">#{rank + 1}</span>
                <span className="lemu-graph3d__incident-label">{shortName(incident.nodeId)}</span>
                <span className="lemu-graph3d__incident-meta">
                  ×{incident.occurrences} · {formatIncidentAge(incident.ageMs)}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default LemuIncidentList;
