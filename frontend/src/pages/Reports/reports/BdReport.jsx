import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '../../../components/ui/DataTable';
import { BdReportService, BD_REPORT_MANAGER_ROLES } from '../../../services/BdReportService';
import { getUserRole } from '../../../utils/session';
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

  const canBuild = useMemo(() => BD_REPORT_MANAGER_ROLES.includes(getUserRole()), []);

  const load = useCallback(async (targetKind) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    try {
      const rows = await BdReportService.list(targetKind);
      if (requestRef.current !== requestId) return;
      setReports(newestFirst(rows));
      setError(null);
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err.message || 'Could not load the BD reports.');
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(kind);
  }, [kind, load]);

  const onBuild = async () => {
    if (building) return;
    setBuilding(true);
    setBuildError(null);
    try {
      await BdReportService.build({ day: buildDay, kind });
      // Only a confirmed build refreshes the list.
      await load(kind);
    } catch (err) {
      setBuildError(err.message || 'Could not build the report.');
    } finally {
      setBuilding(false);
    }
  };

  const onDownload = async (row) => {
    setDownloadingId(row._id);
    setNotice(null);
    try {
      const { blob, fileName } = await BdReportService.download(row._id, {
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
      render: (row) =>
        typeof row.flagged === 'number' && row.flagged > 0 ? (
          <span className="bd-flagged">{row.flagged} rows need a check</span>
        ) : (
          '—'
        ),
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
          {downloadingId === row._id ? 'Downloading…' : 'Download'}
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
