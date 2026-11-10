import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileUp, Info, RefreshCw, Save, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageShell from '@/components/ui/PageShell';
import DataImportService from '@/services/DataImportService';

/**
 * The canonical field list, mirrored from the server's ENTITY_FIELDS so the
 * operator can be told what a column CAN mean. This is a menu to choose from,
 * not a default: nothing is pre-selected, and a column left on "ignore" is
 * reported back as unmapped rather than silently dropped.
 */
const FIELDS = {
  ASSIGNMENTS: [
    {
      name: 'driverRef',
      label: 'Driver reference',
      kind: 'REF',
      subject: 'DRIVER',
      required: true,
    },
    {
      name: 'vehicleRef',
      label: 'Vehicle reference',
      kind: 'REF',
      subject: 'VEHICLE',
      required: true,
    },
    { name: 'from', label: 'From (inclusive)', kind: 'DATE', required: true },
    { name: 'to', label: 'To (exclusive, blank = ongoing)', kind: 'DATE', required: false },
    { name: 'notes', label: 'Notes', kind: 'TEXT', required: false },
  ],
  DRIVERS: [
    {
      name: 'driverRef',
      label: 'Driver reference',
      kind: 'REF',
      subject: 'DRIVER',
      required: true,
    },
    { name: 'firstName', label: 'First name', kind: 'TEXT', required: false },
    { name: 'lastName', label: 'Last name', kind: 'TEXT', required: false },
    { name: 'email', label: 'Email', kind: 'TEXT', required: false },
    { name: 'location', label: 'Location', kind: 'TEXT', required: false },
  ],
  VEHICLE_MASTER: [
    {
      name: 'vehicleRef',
      label: 'Vehicle reference',
      kind: 'REF',
      subject: 'VEHICLE',
      required: true,
    },
    { name: 'model', label: 'Model', kind: 'TEXT', required: false },
    { name: 'axleClass', label: 'Axle class', kind: 'TEXT', required: false },
    {
      name: 'tankCapacityLitres',
      label: 'Tank capacity (litres)',
      kind: 'NUMBER',
      required: false,
    },
    { name: 'bodyType', label: 'Body type', kind: 'TEXT', required: false },
    { name: 'gvm', label: 'GVM', kind: 'TEXT', required: false },
    { name: 'expectedKmPerL', label: 'Expected km/l', kind: 'NUMBER', required: false },
  ],
};

const REF_RESOLVERS = {
  DRIVER: ['MOBILE', 'EMAIL', 'USER_ID'],
  VEHICLE: ['REGISTRATION', 'CHASSIS', 'VEHICLE_ID'],
};

const ENTITY_LABEL = {
  ASSIGNMENTS: 'Driver ↔ vehicle assignments',
  DRIVERS: 'Drivers',
  VEHICLE_MASTER: 'Vehicle master fields',
};

/** Read the header row client-side so the mapping table appears on file select. */
function readHeaderRow(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('could not read that file'));
    reader.onload = () => {
      const first = String(reader.result || '').split(/\r?\n/)[0] || '';
      resolve(
        first
          .split(',')
          .map((h) => h.replace(/^\uFEFF/, '').trim())
          .filter((h) => h !== ''),
      );
    };
    reader.readAsText(file.slice(0, 8192));
  });
}

const CountPill = ({ label, value, tone = 'neutral' }) => {
  const toneClass = {
    neutral: 'bg-gray-100 text-gray-700',
    good: 'bg-emerald-100 text-emerald-700',
    warn: 'bg-amber-100 text-amber-700',
    bad: 'bg-red-100 text-red-700',
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}
    >
      {label}: {value}
    </span>
  );
};

const DataImportsPage = () => {
  const [entity, setEntity] = useState('ASSIGNMENTS');
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [assignments, setAssignments] = useState({}); // header -> field name ('' = ignore)
  const [resolvers, setResolvers] = useState({}); // field -> resolver
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(null); // 'preview' | 'apply' | 'save' | null
  const [runs, setRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(true);

  const fields = FIELDS[entity];
  const refFields = fields.filter((f) => f.kind === 'REF');

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const res = await DataImportService.listRuns({ limit: 10 });
      setRuns(res?.data || []);
    } catch {
      setRuns([]);
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const onFile = async (e) => {
    const picked = e.target.files?.[0];
    setReport(null);
    setFile(picked || null);
    if (!picked) {
      setHeaders([]);
      setAssignments({});
      return;
    }
    try {
      setHeaders(await readHeaderRow(picked));
      setAssignments({});
    } catch (err) {
      toast.error(err.message);
      setFile(null);
      setHeaders([]);
    }
  };

  /** The mapping as the server wants it: ignore → dropped, blanks trimmed out. */
  const mapping = useMemo(() => {
    const out = {};
    headers.forEach((h) => {
      const field = assignments[h];
      if (field) out[h] = field;
    });
    return out;
  }, [headers, assignments]);

  const missingRequired = fields.filter(
    (f) => f.required && !Object.values(assignments).includes(f.name),
  );
  const missingResolvers = refFields.filter((f) => !resolvers[f.name]);
  const canPreview =
    Boolean(file) &&
    headers.length > 0 &&
    missingRequired.length === 0 &&
    missingResolvers.length === 0;

  const runPreview = async () => {
    setBusy('preview');
    try {
      const res = await DataImportService.preview({ file, entity, mapping, resolvers });
      setReport(res);
      toast.success(
        `Dry run complete — nothing was written. ${res.counts.rowsReady} row(s) would be written.`,
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Dry run failed');
    } finally {
      setBusy(null);
    }
  };

  const runApply = async () => {
    setBusy('apply');
    try {
      const res = await DataImportService.apply({ file, entity, mapping, resolvers });
      setReport(res);
      toast.success(`Applied. Run ${res.runId || ''} recorded.`);
      loadRuns();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Apply failed');
    } finally {
      setBusy(null);
    }
  };

  const saveMapping = async () => {
    setBusy('save');
    try {
      await DataImportService.saveMapping(entity, { headers, mapping, resolvers });
      toast.success('Mapping saved for this header row.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save that mapping');
    } finally {
      setBusy(null);
    }
  };

  const blockers = [
    ...missingRequired.map((f) => `map a column to ${f.label}`),
    ...missingResolvers.map((f) => `choose how to match ${f.label.toLowerCase()}`),
  ];

  return (
    <PageShell
      title="Data Imports"
      subtitle="Upload a CSV of drivers, driver↔vehicle assignments or vehicle master fields. Always dry-run first: the preview writes nothing."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" /> 1. What are you importing?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.keys(FIELDS).map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant={entity === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setEntity(key);
                    setReport(null);
                    setAssignments({});
                    setResolvers({});
                  }}
                >
                  {ENTITY_LABEL[key]}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Column meanings are yours to declare. Nothing here is inferred from a header name —
              the importer will not guess which column is the driver.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" /> 2. Choose the file
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="block w-full text-sm"
              aria-label="CSV file"
            />
            {file ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {file.name} · {headers.length} column(s)
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No file chosen.</p>
            )}
          </CardContent>
        </Card>

        {headers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>3. Say what each column means</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2 font-medium">Column in your file</th>
                      <th className="p-2 font-medium">Is it</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((h) => (
                      <tr key={h} className="border-b last:border-0">
                        <td className="p-2 font-mono text-xs">{h}</td>
                        <td className="p-2">
                          <select
                            value={assignments[h] || ''}
                            onChange={(e) => {
                              const field = e.target.value;
                              setAssignments((prev) => {
                                const next = { ...prev };
                                // One field, one column: re-mapping it clears the
                                // column that had it, so the server never sees
                                // MAPPING_FIELD_TWICE.
                                Object.keys(next).forEach((k) => {
                                  if (next[k] === field) delete next[k];
                                });
                                if (field) next[h] = field;
                                return next;
                              });
                            }}
                            className="w-full rounded border px-2 py-1 text-sm"
                          >
                            <option value="">— ignore this column —</option>
                            {fields.map((f) => (
                              <option
                                key={f.name}
                                value={f.name}
                                disabled={Boolean(
                                  assignments[h] !== f.name &&
                                  Object.entries(assignments).some(
                                    ([k, v]) => k !== h && v === f.name,
                                  ),
                                )}
                              >
                                {f.label}
                                {f.required ? ' (required)' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {refFields.length > 0 && (
                <div className="rounded border border-dashed p-3">
                  <p className="mb-2 text-xs font-medium">How should each reference be matched?</p>
                  <div className="flex flex-wrap gap-4">
                    {refFields.map((f) => (
                      <label key={f.name} className="flex flex-col gap-1 text-xs">
                        <span>{f.label}</span>
                        <select
                          value={resolvers[f.name] || ''}
                          onChange={(e) =>
                            setResolvers((prev) => ({ ...prev, [f.name]: e.target.value }))
                          }
                          className="rounded border px-2 py-1 text-sm"
                        >
                          <option value="">— choose —</option>
                          {REF_RESOLVERS[f.subject].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {blockers.length > 0 && (
                <p className="flex items-start gap-2 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Before you can dry run: {blockers.join('; ')}.</span>
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={runPreview} disabled={!canPreview || busy !== null} size="sm">
                  {busy === 'preview' ? 'Checking…' : 'Dry run (writes nothing)'}
                </Button>
                <Button
                  variant="outline"
                  onClick={runApply}
                  disabled={!canPreview || !report || report.dryRun === false || busy !== null}
                  size="sm"
                >
                  {busy === 'apply' ? 'Writing…' : 'Apply this file'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={saveMapping}
                  disabled={!canPreview || busy !== null}
                  size="sm"
                >
                  <Save className="h-4 w-4" /> Save this mapping
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {report && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {report.dryRun ? (
                  <Info className="h-5 w-5 text-blue-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                {report.dryRun ? 'Dry run — nothing was written' : 'Applied'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <CountPill label="rows read" value={report.counts.rowsRead} />
                <CountPill label="ready" value={report.counts.rowsReady} tone="good" />
                <CountPill label="rejected" value={report.counts.rowsRejected} tone="warn" />
                <CountPill label="conflicts" value={report.counts.rowsConflicted} tone="bad" />
                {!report.dryRun && (
                  <>
                    <CountPill
                      label="written"
                      value={report.counts.assignmentsCreated}
                      tone="good"
                    />
                    <CountPill label="intervals closed" value={report.counts.intervalsClosed} />
                  </>
                )}
              </div>

              {report.mappingErrors?.length > 0 && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-xs">
                  <p className="mb-1 font-semibold text-red-800">This file was refused:</p>
                  <ul className="list-inside list-disc text-red-700">
                    {report.mappingErrors.map((e, i) => (
                      <li key={i}>
                        <span className="font-mono">{e.code}</span> — {e.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.unmappedColumns?.length > 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs">
                  <p className="mb-1 font-semibold text-amber-800">
                    {report.unmappedColumns.length} column(s) you did not map — ignored, not
                    dropped:
                  </p>
                  <ul className="list-inside list-disc text-amber-700">
                    {report.unmappedColumns.map((c) => (
                      <li key={c.header}>
                        <span className="font-mono">{c.header}</span> — {c.rowsWithValue} row(s) had
                        a value in it
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.conflicts?.length > 0 && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-xs">
                  <p className="mb-1 font-semibold text-red-800">
                    {report.counts.rowsConflicted} row(s) clash with an interval already on record.
                    Nothing was overwritten — these need a person:
                  </p>
                  <ul className="space-y-1 text-red-700">
                    {report.conflicts.map((c, i) => (
                      <li key={i}>
                        <span className="font-mono">line {c.line}</span>{' '}
                        <span className="font-mono">{c.code}</span> — {c.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.rejected?.length > 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs">
                  <p className="mb-1 font-semibold text-amber-800">
                    {report.counts.rowsRejected} row(s) refused, with reasons:
                  </p>
                  <ul className="space-y-1 text-amber-700">
                    {report.rejected.map((r, i) => (
                      <li key={i}>
                        <span className="font-mono">line {r.line}</span>{' '}
                        <span className="font-mono">{r.code}</span> — {r.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.preview?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium">First rows that would be written:</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {report.preview.map((p) => (
                      <li key={p.line}>
                        line {p.line}: {String(p.from).slice(0, 10)} →{' '}
                        {p.to ? String(p.to).slice(0, 10) : 'ongoing'}
                        {p.supersedes?.length
                          ? ` (closes ${p.supersedes.length} earlier interval)`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Applied imports
              <Button variant="ghost" size="sm" onClick={loadRuns} aria-label="Refresh runs">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRuns ? (
              <Skeleton className="h-16 w-full" />
            ) : runs.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4" /> Nothing applied yet. A dry run never appears here.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {runs.map((r) => (
                  <li
                    key={r._id}
                    className="flex flex-wrap items-center gap-2 border-b pb-2 last:border-0"
                  >
                    <Badge variant="secondary">{ENTITY_LABEL[r.entity] || r.entity}</Badge>
                    <span className="font-mono">{r.fileName}</span>
                    <span className="text-muted-foreground">
                      {r.counts?.rowsReady ?? 0} written · {r.counts?.rowsRejected ?? 0} rejected ·{' '}
                      {r.counts?.rowsConflicted ?? 0} conflicts
                    </span>
                    <span className="ml-auto text-muted-foreground">
                      {new Date(r.appliedAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};

export default DataImportsPage;
