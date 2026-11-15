import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  Inbox,
  Info,
  Link2,
  ListChecks,
  RefreshCw,
  Save,
  Truck,
  UploadCloud,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PageShell from '@/components/ui/PageShell';
import KpiCard from '@/components/ui/KpiCard';
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

const RESOLVER_LABEL = {
  MOBILE: 'Mobile number',
  EMAIL: 'Email',
  USER_ID: 'User ID',
  REGISTRATION: 'Registration number',
  CHASSIS: 'Chassis number',
  VEHICLE_ID: 'Vehicle ID',
};

const ENTITY_META = {
  ASSIGNMENTS: {
    tab: 'Assignments',
    full: 'Driver ↔ vehicle assignments',
    icon: Link2,
    desc: 'Link each driver to a vehicle for a date range (half-open intervals).',
  },
  DRIVERS: {
    tab: 'Drivers',
    full: 'Drivers',
    icon: Users,
    desc: 'Create or update driver records from a sheet.',
  },
  VEHICLE_MASTER: {
    tab: 'Vehicles',
    full: 'Vehicle master fields',
    icon: Truck,
    desc: 'Set vehicle master fields — model, tank capacity, expected mileage and more.',
  },
};

const STEPS = [
  { title: 'Pick a type', note: 'Drivers, driver ↔ vehicle assignments, or vehicle fields.' },
  { title: 'Upload a CSV', note: 'The header row is read instantly in your browser.' },
  { title: 'Map the columns', note: 'You declare each column and how references match.' },
  { title: 'Dry-run, then apply', note: 'The preview writes nothing — only Apply writes.' },
];

// Radix Select forbids an empty item value, so "ignore" rides a sentinel that is
// mapped back to '' (dropped) before anything reaches the server.
const IGNORE = '__ignore__';

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

/** One line in the summary rail's readiness checklist. */
const CheckItem = ({ done, children }) => (
  <li className="flex items-start gap-2 text-sm">
    {done ? (
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
    ) : (
      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
    )}
    <span className={done ? '' : 'text-muted-foreground'}>{children}</span>
  </li>
);

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
  const [dragging, setDragging] = useState(false);

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

  const resetForEntity = (key) => {
    setEntity(key);
    setReport(null);
    setAssignments({});
    setResolvers({});
  };

  const acceptFile = async (picked) => {
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

  const onFile = (e) => acceptFile(e.target.files?.[0] || null);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const picked = e.dataTransfer?.files?.[0];
    if (picked) acceptFile(picked);
  };

  const clearFile = () => {
    setFile(null);
    setHeaders([]);
    setAssignments({});
    setReport(null);
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

  const setColumnField = (header, field) => {
    setAssignments((prev) => {
      const next = { ...prev };
      // One field, one column: re-mapping it clears the column that had it, so
      // the server never sees MAPPING_FIELD_TWICE.
      Object.keys(next).forEach((k) => {
        if (next[k] === field) delete next[k];
      });
      if (field) next[header] = field;
      else delete next[header];
      return next;
    });
  };

  const isMapped = (name) => Object.values(assignments).includes(name);
  const missingRequired = fields.filter((f) => f.required && !isMapped(f.name));
  const missingResolvers = refFields.filter((f) => !resolvers[f.name]);
  const mappedCount = Object.keys(mapping).length;
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

  const counts = report?.counts || {};
  const EntityIcon = ENTITY_META[entity].icon;

  return (
    <PageShell
      title="Data Imports"
      subtitle="Bulk-create drivers, driver ↔ vehicle assignments or vehicle master fields from a CSV. Always dry-run first — the preview writes nothing."
    >
      <div className="space-y-5 di-imports">
        {/* guide — balanced four-step band */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                ✧ Data imports guide
              </span>
              <span className="text-xs text-muted-foreground">
                The dry-run validates and writes nothing — only Apply writes.
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {s.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* workspace — flow on the left, live summary + actions on the right */}
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {/* set up the import — type + file */}
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Set up the import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={entity} onValueChange={resetForEntity}>
                <TabsList className="grid w-full grid-cols-3">
                  {Object.entries(ENTITY_META).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <TabsTrigger key={key} value={key} className="gap-1.5">
                        <Icon className="h-4 w-4" />
                        {meta.tab}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
              <p className="text-sm text-muted-foreground">{ENTITY_META[entity].desc}</p>

              {!file ? (
                // Click-to-upload is the accessible path (native label + input below);
                // the drag-and-drop on this container is an optional enhancement.
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`rounded-xl border-2 border-dashed transition-colors ${
                    dragging
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <input
                    id="data-import-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onFile}
                    className="hidden"
                    aria-label="CSV file"
                  />
                  <label
                    htmlFor="data-import-file"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 px-6 py-16 text-center"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UploadCloud className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium">
                      Click to choose a CSV, or drag it here
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Only the header row is read in your browser; the file uploads when you
                      dry-run.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <FileSpreadsheet className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {headers.length} column{headers.length === 1 ? '' : 's'} detected
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFile} aria-label="Remove file">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* map the columns */}
          {headers.length > 0 && (
            <Card className="lg:col-span-3 lg:row-start-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <EntityIcon className="h-4 w-4 text-muted-foreground" />
                  Map the columns
                  <Badge variant={mappedCount ? 'secondary' : 'outline'} className="ml-auto">
                    {mappedCount} of {headers.length} mapped
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">Column in your file</TableHead>
                        <TableHead>Maps to</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {headers.map((h) => {
                        const current = assignments[h] || '';
                        return (
                          <TableRow key={h}>
                            <TableCell className="font-mono text-xs">{h}</TableCell>
                            <TableCell>
                              <Select
                                value={current || IGNORE}
                                onValueChange={(val) =>
                                  setColumnField(h, val === IGNORE ? '' : val)
                                }
                              >
                                <SelectTrigger className="h-9 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={IGNORE}>— ignore this column —</SelectItem>
                                  {fields.map((f) => (
                                    <SelectItem
                                      key={f.name}
                                      value={f.name}
                                      disabled={Object.entries(assignments).some(
                                        ([k, v]) => k !== h && v === f.name,
                                      )}
                                    >
                                      {f.label}
                                      {f.required ? ' (required)' : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {refFields.length > 0 && (
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="mb-3 text-sm font-medium">
                      How should each reference be matched?
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {refFields.map((f) => (
                        <div key={f.name} className="space-y-1.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            {f.label}
                          </span>
                          <Select
                            value={resolvers[f.name] || undefined}
                            onValueChange={(val) =>
                              setResolvers((prev) => ({ ...prev, [f.name]: val }))
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Choose how to match…" />
                            </SelectTrigger>
                            <SelectContent>
                              {REF_RESOLVERS[f.subject].map((r) => (
                                <SelectItem key={r} value={r}>
                                  {RESOLVER_LABEL[r] || r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* summary */}
          <Card className="flex flex-col lg:col-span-1 lg:col-start-3 lg:row-start-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Import summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-5">
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="truncate text-right font-medium">{ENTITY_META[entity].full}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">File</dt>
                  <dd className="truncate text-right font-medium">
                    {file ? file.name : 'No file yet'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Columns mapped</dt>
                  <dd className="text-right font-medium tabular-nums">
                    {mappedCount} / {headers.length || 0}
                  </dd>
                </div>
              </dl>

              {headers.length > 0 ? (
                <div className="border-t pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Before you can import
                  </p>
                  <ul className="space-y-1.5">
                    {fields
                      .filter((f) => f.required)
                      .map((f) => (
                        <CheckItem key={f.name} done={isMapped(f.name)}>
                          Map a column to {f.label}
                        </CheckItem>
                      ))}
                    {refFields.map((f) => (
                      <CheckItem key={`${f.name}-res`} done={Boolean(resolvers[f.name])}>
                        Match {f.label.toLowerCase()}
                        {resolvers[f.name]
                          ? ` by ${(RESOLVER_LABEL[resolvers[f.name]] || resolvers[f.name]).toLowerCase()}`
                          : ''}
                      </CheckItem>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="border-t pt-3 text-sm text-muted-foreground">
                  Choose a type and upload a CSV to begin.
                </p>
              )}

              <div className="mt-auto space-y-2 border-t pt-3">
                <Button
                  className="w-full"
                  onClick={runPreview}
                  disabled={!canPreview || busy !== null}
                >
                  {busy === 'preview' ? 'Checking…' : 'Dry run'}
                </Button>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={runApply}
                  disabled={!canPreview || !report || report.dryRun === false || busy !== null}
                >
                  {busy === 'apply' ? 'Writing…' : 'Apply this file'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-1.5"
                  onClick={saveMapping}
                  disabled={!canPreview || busy !== null}
                >
                  <Save className="h-4 w-4" /> Save this mapping
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The dry run writes nothing; Apply runs the exact plan it showed.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* report */}
        {report && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {report.dryRun ? (
                  <Info className="h-5 w-5 text-blue-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                {report.dryRun ? 'Dry run — nothing was written' : 'Applied'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <KpiCard
                  title="Rows read"
                  value={counts.rowsRead ?? 0}
                  accent="#475569"
                  icon={<ListChecks size={18} />}
                />
                <KpiCard
                  title="Ready"
                  value={counts.rowsReady ?? 0}
                  accent="#10b981"
                  icon={<CheckCircle2 size={18} />}
                />
                <KpiCard
                  title="Rejected"
                  value={counts.rowsRejected ?? 0}
                  accent="#d97706"
                  icon={<AlertTriangle size={18} />}
                />
                <KpiCard
                  title="Conflicts"
                  value={counts.rowsConflicted ?? 0}
                  accent="#dc2626"
                  icon={<XCircle size={18} />}
                />
                {!report.dryRun && (
                  <KpiCard
                    title="Written"
                    value={counts.assignmentsCreated ?? counts.rowsReady ?? 0}
                    accent="#2563eb"
                    icon={<Save size={18} />}
                  />
                )}
              </div>

              {report.mappingErrors?.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs">
                  <p className="mb-1 font-semibold text-red-800">This file was refused:</p>
                  <ul className="list-inside list-disc space-y-0.5 text-red-700">
                    {report.mappingErrors.map((e, i) => (
                      <li key={i}>
                        <span className="font-mono">{e.code}</span> — {e.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.conflicts?.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs">
                  <p className="mb-1 font-semibold text-red-800">
                    {counts.rowsConflicted} row(s) clash with an interval already on record. Nothing
                    was overwritten — these need a person:
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
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
                  <p className="mb-1 font-semibold text-amber-800">
                    {counts.rowsRejected} row(s) refused, with reasons:
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

              {report.unmappedColumns?.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                  <p className="mb-1 font-semibold">
                    {report.unmappedColumns.length} column(s) you did not map — ignored, not
                    dropped:
                  </p>
                  <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                    {report.unmappedColumns.map((c) => (
                      <li key={c.header}>
                        <span className="font-mono">{c.header}</span> — {c.rowsWithValue} row(s) had
                        a value
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.preview?.length > 0 && (
                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-xs font-semibold">First rows that would be written:</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {report.preview.map((p) => (
                      <li key={p.line}>
                        <span className="font-mono">line {p.line}</span>:{' '}
                        {String(p.from).slice(0, 10)} →{' '}
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

        {/* applied runs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Applied imports
              <Button
                variant="ghost"
                size="sm"
                onClick={loadRuns}
                aria-label="Refresh runs"
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRuns ? (
              <Skeleton className="h-16 w-full" />
            ) : runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
                  <Inbox className="h-7 w-7" />
                </span>
                <p className="text-sm font-medium">No imports applied yet</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  A dry run never appears here — apply a file and the run is recorded with its
                  counts.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead className="text-right">Written</TableHead>
                      <TableHead className="text-right">Rejected</TableHead>
                      <TableHead className="text-right">Conflicts</TableHead>
                      <TableHead className="text-right">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>
                          <Badge variant="secondary">
                            {ENTITY_META[r.entity]?.full || r.entity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.fileName}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.counts?.rowsReady ?? 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-amber-700">
                          {r.counts?.rowsRejected ?? 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-red-700">
                          {r.counts?.rowsConflicted ?? 0}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {r.appliedAt ? new Date(r.appliedAt).toLocaleString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};

export default DataImportsPage;
