import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '../../../components/ui/DataTable';
import { BdReportService, BD_REPORT_MANAGER_ROLES } from '../../../services/BdReportService';
import { getUserRole, getOrgId } from '../../../utils/session';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { yesterdayIST } from './bdReportDays';
import './BdReport.css';

/**
 * BD oil & DEF report (GF, spec 2).
 *
 * One row per day per kind: the newest first, with the file name, the row
 * count, the number of rows that still need a check and a download button.
 * "Build now" is for manager+ only — the backend enforces who may build; the
 * button is only hidden so a driver does not press a button that must fail.
 */

const KINDS = [
  { id: 'OIL', label: 'Oil' },
  { id: 'DEF', label: 'DEF' },
];

/** A count the backend did not report stays unknown — it is never 0. */
const count = (value) => (typeof value === 'number' ? value.toLocaleString('en-IN') : '—');

/** Newest day first; the newest build of a day first within the day. */
const newestFirst = (rows) =>
  [...rows].sort((a, b) => {
    const byDay = String(b?.day || '').localeCompare(String(a?.day || ''));
    if (byDay !== 0) return byDay;
    return String(b?.createdAt || '').localeCompare(String(a?.createdAt || ''));
  });

/** Save the downloaded blob under the name the server asked for. */
const saveFile = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const BdReport = () => {
  const [kind, setKind] = useState('OIL');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buildDay, setBuildDay] = useState(() => yesterdayIST());
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // A late answer of an older kind must never land on the screen.
  const requestRef = useRef(0);
  // The kind on screen, readable without waiting for a re-render: a build that
  // finishes later must know whether its kind is still the one being shown.
  const kindRef = useRef(kind);
  // The organization the rows on screen belong to. Another tab that signs in
  // to a different organization changes the stored one: the storage event
  // tells this tab, and the state change re-renders the report.
  const [orgId, setOrgIdState] = useState(() => getOrgId());
  const orgRef = useRef(null);
  useEffect(() => {
    const sync = () => setOrgIdState(getOrgId());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const canBuild = useMemo(() => BD_REPORT_MANAGER_ROLES.includes(getUserRole()), []);

  const load = useCallback(async (targetKind) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const orgAtRequest = getOrgId();
    setLoading(true);
    try {
      const rows = await BdReportService.list(targetKind);
      if (requestRef.current !== requestId) return;
      // The organization changed while we waited: the answer is not ours.
      if (getOrgId() !== orgAtRequest) return;
      setReports(newestFirst(rows));
      setError(null);
    } catch (err) {
      if (requestRef.current !== requestId) return;
      if (getOrgId() !== orgAtRequest) return;
      setError(err.message || 'Could not load the BD reports.');
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The rows of the previous kind go at once: they must not stay
    // downloadable under the new kind while it loads or if it fails.
    if (kindRef.current !== kind) {
      setReports([]);
      setError(null);
      setBuildError(null);
    }
    kindRef.current = kind;
    load(kind);
  }, [kind, load]);

  // The organization changed while the report was open: the rows on screen
  // belong to the previous organization, so they go and the new ones are read.
  useEffect(() => {
    if (orgRef.current === null) {
      orgRef.current = orgId;
      return;
    }
    if (orgRef.current === orgId) return;
    orgRef.current = orgId;
    setReports([]);
    setError(null);
    setBuildError(null);
    setNotice(null);
    load(kindRef.current);
  }, [orgId, load]);

  const onBuild = async () => {
    if (building) return;
    const buildKind = kind;
    const orgAtBuild = getOrgId();
    setBuilding(true);
    setBuildError(null);
    try {
      await BdReportService.build({ day: buildDay, kind: buildKind });
      // Only a confirmed build of the kind on screen refreshes the list.
      if (kindRef.current !== buildKind) return;
      if (getOrgId() !== orgAtBuild) return;
      await load(kindRef.current);
    } catch (err) {
      // A failure of a build whose kind or organization is no longer on
      // screen is not this view's error.
      if (kindRef.current !== buildKind) return;
      if (getOrgId() !== orgAtBuild) return;
      setBuildError(err.message || 'Could not build the report.');
    } finally {
      setBuilding(false);
    }
  };

  // Download is always today's truth: whoever may build gets the day rebuilt
  // from the current fills first, so fixes made since the stored copy show up.
  // A failed rebuild never falls back to the old file, which would look fresh.
  // The stored copy (and its history) stays the record of what was sent.
  const onDownload = async (row) => {
    setDownloadingId(row._id);
    setNotice(null);
    try {
      let fileId = row._id;
      if (canBuild) {
        const built = await BdReportService.build({ day: row.day, kind: row.kind });
        fileId = built.id || built._id || row._id;
      }
      const { blob, fileName } = await BdReportService.download(fileId, {
        fallbackName: row.fileName,
      });
      saveFile(blob, fileName || `${row.kind}-${row.day}.xlsx`);
    } catch (err) {
      setNotice(err.message || 'Could not download the report.');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      key: 'day',
      label: 'Day',
      render: (row) => row.day || '—',
    },
    {
      key: 'fileName',
      label: 'File',
      render: (row) => row.fileName || '—',
    },
    {
      key: 'rows',
      label: 'Rows',
      align: 'right',
      render: (row) => count(row.rows),
    },
    {
      key: 'flagged',
      label: 'Needs a check',
      render: (row) => {
        // A count the backend did not report stays unknown — it is never 0.
        if (typeof row.flagged !== 'number') return '—';
        if (row.flagged <= 0) return '0';
        return <span className="bd-flagged">{row.flagged} rows need a check</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Built',
      render: (row) => (row.createdAt ? formatDateTimeIST(row.createdAt) : '—'),
    },
    {
      key: 'actions',
      label: 'File',
      render: (row) => (
        <button
          type="button"
          className="pshell-btn"
          onClick={() => onDownload(row)}
          disabled={downloadingId === row._id}
        >
          {downloadingId === row._id ? (canBuild ? 'Building…' : 'Downloading…') : 'Download'}
        </button>
      ),
    },
  ];

  return (
    <section className="bd-report" aria-label="BD oil and DEF report">
      <header className="bd-report__head">
        <div>
          <h2>BD oil &amp; DEF report</h2>
          <p>One file per day per kind. Download it, or build yesterday now.</p>
        </div>
        <div className="bd-report__kinds" role="group" aria-label="Report kind">
          {KINDS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`bd-kind${kind === entry.id ? ' bd-kind--active' : ''}`}
              aria-pressed={kind === entry.id}
              onClick={() => setKind(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </header>

      {canBuild ? (
        <div className="bd-report__build">
          <label htmlFor="bd-report-day">Day (IST)</label>
          <input
            id="bd-report-day"
            type="date"
            aria-label="Day (IST)"
            value={buildDay}
            onChange={(e) => setBuildDay(e.target.value)}
          />
          <button
            type="button"
            className="pshell-btn pshell-btn--primary"
            onClick={onBuild}
            disabled={building || !buildDay}
          >
            {building ? 'Building…' : 'Build now'}
          </button>
        </div>
      ) : null}

      {buildError ? (
        <p className="bd-report__error" role="alert">
          {buildError}
        </p>
      ) : null}

      {notice ? (
        <p className="bd-report__error" role="alert">
          {notice}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={reports}
        rowKey={(row) => row._id}
        loading={loading}
        error={error}
        onRetry={() => load(kind)}
        emptyTitle="No report built yet."
        emptyHint="Build a day to see it here."
      />
    </section>
  );
};

export default BdReport;
