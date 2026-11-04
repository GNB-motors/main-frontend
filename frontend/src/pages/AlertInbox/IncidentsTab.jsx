import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/button.jsx';
import {
  assignIncident,
  acknowledgeIncident,
  getIncidentSummary,
  getIncidents,
  resolveIncident,
} from '../../services/AlertInboxService.js';
import {
  INCIDENT_STATUSES,
  STATUS_LABEL,
  TYPE_LABEL,
  assignmentNameError,
  filterIncidents,
  incidentSeverity,
  incidentTime,
  resolutionNoteError,
  severityOptions,
} from './incidentsModel.js';

/**
 * The incident board.
 *
 * Every row is a driver's SOS report and the work it caused. The board reads
 * the list and the headline counts, and it writes the three steps a person can
 * take: take ownership, send someone, close it with what happened.
 *
 * Each write updates its row in place (the list is not refetched — the row the
 * dispatcher just changed is the row they are looking at) and then refreshes
 * the counts, because the counts are what the next shift reads.
 */
export default function IncidentsTab() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryKnown, setSummaryKnown] = useState(false);
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [pending, setPending] = useState(new Set());
  const [assignFor, setAssignFor] = useState(null);
  const [assignName, setAssignName] = useState('');
  const [assignPhone, setAssignPhone] = useState('');
  const [resolveFor, setResolveFor] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const mounted = useRef(true);

  const refreshSummary = useCallback(async (signal) => {
    try {
      const data = await getIncidentSummary({ signal });
      if (mounted.current) {
        setSummary(data);
        setSummaryKnown(true);
      }
    } catch {
      if (mounted.current) setSummaryKnown(false);
    }
  }, []);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getIncidents({ status, limit: 50, signal });
      if (mounted.current) {
        setRows(result.items);
        setPagination(result.pagination);
      }
    } catch (err) {
      if (mounted.current) setError(err?.message || 'Could not load incidents. Try again.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    load(controller.signal);
    refreshSummary(controller.signal);
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [load, refreshSummary]);

  const items = useMemo(() => filterIncidents(rows, { status, severity }), [rows, status, severity]);
  const severities = useMemo(() => severityOptions(rows), [rows]);

  /** Run one write: update the row, then refresh the counts. */
  const run = async (id, call, optimistic, message) => {
    setPending((current) => new Set(current).add(id));
    setActionError(null);
    try {
      const updated = await call();
      if (!mounted.current) return;
      setRows((current) =>
        current.map((row) => (row._id === id ? { ...row, ...optimistic, ...(updated || {}) } : row)),
      );
      setAnnouncement(message);
      await refreshSummary();
    } catch (err) {
      if (mounted.current) {
        setActionError(err?.message || 'Could not update this incident. Try again.');
      }
    } finally {
      if (mounted.current) {
        setPending((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    }
  };

  const ackIncident = (row) =>
    run(
      row._id,
      () => acknowledgeIncident(row._id),
      { status: 'ACKNOWLEDGED' },
      'Incident acknowledged.',
    );

  const submitAssignment = (row) => {
    const nameError = assignmentNameError(assignName);
    if (nameError) {
      setActionError(nameError);
      return;
    }
    const body = { assignedToName: assignName.trim() };
    if (assignPhone.trim()) body.assignedToPhone = assignPhone.trim();
    run(
      row._id,
      () => assignIncident(row._id, body),
      { status: 'MECHANIC_ASSIGNED' },
      `Sent to ${body.assignedToName}.`,
    ).then(() => {
      setAssignFor(null);
      setAssignName('');
      setAssignPhone('');
    });
  };

  const submitResolution = (row) => {
    const noteError = resolutionNoteError(resolveNote);
    if (noteError) {
      setActionError(noteError);
      return;
    }
    run(
      row._id,
      () => resolveIncident(row._id, { resolutionNote: resolveNote.trim() }),
      { status: 'RESOLVED' },
      'Incident resolved.',
    ).then(() => {
      setResolveFor(null);
      setResolveNote('');
    });
  };

  const stat = (label, value) => (
    <div className="ai-stat" key={label}>
      <div>
        <span>{label}</span>
        <strong>{summaryKnown ? (value ?? '—') : '—'}</strong>
      </div>
    </div>
  );

  return (
    <>
      <div className="ai-summary" aria-label="Incident counts">
        {stat('Open', summary?.OPEN)}
        {stat('Acknowledged', summary?.ACKNOWLEDGED)}
        {stat('Mechanic assigned', summary?.MECHANIC_ASSIGNED)}
        {stat('Resolved', summary?.RESOLVED)}
        {stat('Truck unknown', summary?.unpaired)}
      </div>

      <section className="ai-panel" aria-label="Incident board" aria-busy={loading}>
        <div className="ai-toolbar">
          <select
            aria-label="Incident status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {INCIDENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </select>
          <select
            aria-label="Incident severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            <option value="">All severities</option>
            {severities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
            <option value="unspecified">Not stated</option>
          </select>
        </div>

        {error || actionError ? (
          <div role="alert" className="ai-error">
            {error || actionError}
            {error ? (
              <button type="button" onClick={() => load()}>
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="ai-empty">
            <h2>No incidents here</h2>
            <p>
              {status || severity
                ? 'Try another filter.'
                : 'Nothing has been reported by the drivers yet.'}
            </p>
          </div>
        ) : null}

        <ul className="ai-list">
          {items.map((row) => {
            const severityOfRow = incidentSeverity(row);
            const isPending = pending.has(row._id);
            return (
              <li key={row._id} className="ai-row">
                <span className={`ai-priority${severityOfRow ? ` ai-priority--${severityOfRow}` : ''}`}>
                  {TYPE_LABEL[row.type] || row.type || 'Incident'}
                </span>
                <div className="ai-row-main">
                  <h2>{row.incidentNumber || 'Incident'}</h2>
                  <p className="ai-ask">{row.report?.note || 'The driver reported this incident.'}</p>
                  <div className="ai-meta">
                    <span>{row.truck?.registrationNumber || 'Truck unknown'}</span>
                    <span>{STATUS_LABEL[row.status] || row.status}</span>
                    {row.driver?.name ? <span>{row.driver.name}</span> : null}
                    {row.report?.receivedAt ? (
                      <span>{incidentTime(row.report.receivedAt)}</span>
                    ) : null}
                    {row.pairingHeadline ? <span>{row.pairingHeadline}</span> : null}
                  </div>

                  {assignFor === row._id ? (
                    <div className="ai-form">
                      <input
                        aria-label="Who is going to the truck"
                        placeholder="Who is going to the truck?"
                        value={assignName}
                        onChange={(event) => setAssignName(event.target.value)}
                      />
                      <input
                        aria-label="Contact number"
                        placeholder="Contact number (optional)"
                        value={assignPhone}
                        onChange={(event) => setAssignPhone(event.target.value)}
                      />
                      <Button size="sm" onClick={() => submitAssignment(row)} disabled={isPending}>
                        {isPending ? 'Saving…' : 'Send'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAssignFor(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : null}

                  {resolveFor === row._id ? (
                    <div className="ai-form">
                      <input
                        aria-label="What happened"
                        placeholder="What happened?"
                        value={resolveNote}
                        onChange={(event) => setResolveNote(event.target.value)}
                      />
                      <Button size="sm" onClick={() => submitResolution(row)} disabled={isPending}>
                        {isPending ? 'Saving…' : 'Close incident'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setResolveFor(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="ai-row-actions">
                  {row.status === 'OPEN' ? (
                    <Button size="sm" variant="ghost" disabled={isPending} onClick={() => ackIncident(row)}>
                      {isPending ? 'Saving…' : 'Acknowledge'}
                    </Button>
                  ) : null}
                  {row.status === 'ACKNOWLEDGED' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAssignFor(row._id);
                        setResolveFor(null);
                      }}
                    >
                      Send someone
                    </Button>
                  ) : null}
                  {row.status === 'ACKNOWLEDGED' || row.status === 'MECHANIC_ASSIGNED' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setResolveFor(row._id);
                        setAssignFor(null);
                      }}
                    >
                      Close
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {pagination ? (
          <div className="ai-footer">
            Showing {items.length} of {pagination.total ?? items.length} incidents.
          </div>
        ) : null}
      </section>
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </>
  );
}
