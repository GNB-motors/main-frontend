import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import PhotoImportService from '@/services/PhotoImportService';
import safeText from '@/utils/redactSensitive';
import DriverTimelineChart from './DriverTimelineChart';
import { buildTimeline, groupByTruck } from './driverChartModel';

const DECISION_LABEL = {
  confirm: 'Confirmed',
  reject: 'Rejected',
  edit: 'Changed',
};

/**
 * Who was driving, when — read off the photos and shown as a timeline per
 * truck. Nothing here is a fact until a person says so: every period is a
 * suggestion with a ✓ and a ✗ next to it, and a note where the register and
 * the document on the photo did not agree.
 */
export default function DriverChartDialog({ open, onOpenChange, batchId }) {
  const [activeBatchId, setActiveBatchId] = useState(batchId || '');
  const [periods, setPeriods] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    let alive = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        let target = batchId || '';
        if (!target) {
          const batches = await PhotoImportService.listBatches({ signal: controller.signal });
          target = batches[0]?.batchId || batches[0]?._id || '';
        }
        if (!target) {
          if (alive) setPeriods([]);
          return;
        }
        const rows = await PhotoImportService.getDriverPeriods(target, {
          signal: controller.signal,
        });
        if (!alive) return;
        setActiveBatchId(target);
        setPeriods(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (alive && !controller.signal.aborted) {
          setError(err?.message || 'The driver predictions could not be loaded.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [open, batchId]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    const load = async () => {
      try {
        const rows = await PhotoImportService.listDrivers({ signal: controller.signal });
        setDrivers(Array.isArray(rows) ? rows : []);
      } catch {
        // No driver list means no "pick another driver" — the periods still show.
        setDrivers([]);
      }
    };
    load();
    return () => controller.abort();
  }, [open]);

  const decide = async (periodId, item) => {
    if (!activeBatchId) return;
    setSaving(true);
    setError('');
    try {
      await PhotoImportService.confirmDriverPeriods(
        activeBatchId,
        { items: [{ periodId, ...item }] },
        {},
      );
      setDecisions((prev) => ({
        ...prev,
        [periodId]: { action: item.action, ...item },
      }));
    } catch (err) {
      setError(err?.message || 'That decision could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const confirmAll = async () => {
    if (!activeBatchId) return;
    setSaving(true);
    setError('');
    try {
      await PhotoImportService.confirmDriverPeriods(activeBatchId, { all: true }, {});
      setDecisions((prev) => {
        const next = { ...prev };
        periods.forEach((period) => {
          next[period.periodId] = { action: 'confirm' };
        });
        return next;
      });
    } catch (err) {
      setError(err?.message || 'Those decisions could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const driverOptions = drivers
    .map((driver) => ({
      id: String(driver._id || driver.id || driver.userId || ''),
      name:
        [driver.firstName, driver.lastName].filter(Boolean).join(' ') || driver.name || 'Driver',
      phone: driver.mobileNumber || driver.phone || '',
    }))
    .filter((driver) => driver.id);

  const groups = groupByTruck(periods);
  const timeline = buildTimeline(periods);
  const chartRows = new Map(timeline.rows.map((row) => [row.periodId, row]));

  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange?.(next)}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Driver predictions</DialogTitle>
          <DialogDescription>
            Who the photos say was driving, and when. Confirm a period, reject it, or send it to
            somebody else.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="flex items-center gap-2 text-sm" role="status">
              <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Reading the photos…
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {safeText(error)}
            </p>
          ) : null}

          {!loading && !groups.length && !error ? (
            <p className="text-sm text-muted-foreground">
              No driver periods yet. Upload photos first and the reader will put them here.
            </p>
          ) : null}

          {groups.map((group) => {
            const rows = group.rows
              .map((row) => chartRows.get(row.periodId))
              .filter(Boolean)
              .map((row) => ({
                ...row,
                label: `${safeText(row.driverName)} · ${row.phone}`,
              }));
            return (
              <section key={group.vehicleId || group.plate} className="mb-8">
                <h3 className="mb-2 text-sm font-semibold">{safeText(group.plate)}</h3>
                <DriverTimelineChart rows={rows} base={timeline.base} span={timeline.span} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-2 font-medium">Driver</th>
                        <th className="p-2 font-medium">From</th>
                        <th className="p-2 font-medium">To</th>
                        <th className="p-2 font-medium">Photos</th>
                        <th className="p-2 font-medium">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => {
                        const decision = decisions[row.periodId];
                        const warnings = Array.isArray(row.warnings) ? row.warnings : [];
                        const isEditing = editor?.periodId === row.periodId;
                        return (
                          <tr key={row.periodId} className="border-b last:border-0 align-top">
                            <td className="p-2">
                              <span className="font-medium">{safeText(row.driverName)}</span>
                              {row.phone ? (
                                <span className="block text-xs text-muted-foreground">
                                  {row.phone}
                                </span>
                              ) : null}
                              {warnings.map((warning) => (
                                <p
                                  key={warning.code || warning.message}
                                  className="mt-1 flex items-start gap-1 text-xs text-amber-700"
                                >
                                  <AlertTriangle
                                    size={13}
                                    className="mt-0.5 shrink-0"
                                    aria-hidden="true"
                                  />
                                  {safeText(warning.message)}
                                </p>
                              ))}
                            </td>
                            <td className="p-2 text-xs">{safeText(row.from)}</td>
                            <td className="p-2 text-xs">{safeText(row.to) || 'ongoing'}</td>
                            <td className="p-2 text-xs">{row.photoCount ?? 0}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  variant={decision?.action === 'confirm' ? 'default' : 'outline'}
                                  aria-label={`Confirm ${safeText(row.driverName)}`}
                                  disabled={saving}
                                  onClick={() => decide(row.periodId, { action: 'confirm' })}
                                >
                                  <Check size={14} aria-hidden="true" /> Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant={
                                    decision?.action === 'reject' ? 'destructive' : 'outline'
                                  }
                                  aria-label={`Reject ${safeText(row.driverName)}`}
                                  disabled={saving}
                                  onClick={() => decide(row.periodId, { action: 'reject' })}
                                >
                                  <X size={14} aria-hidden="true" /> Reject
                                </Button>
                                <SearchableSelect
                                  id={`driver-${String(row.periodId).replace(/[^a-zA-Z0-9_-]/g, '')}`}
                                  aria-label={`Pick another driver for ${safeText(row.driverName)}`}
                                  value={decision?.driverUserId || ''}
                                  placeholder="Pick another driver"
                                  onValueChange={(value) =>
                                    decide(row.periodId, {
                                      action: 'edit',
                                      driverUserId: String(value),
                                    })
                                  }
                                >
                                  <option value="" disabled>
                                    Pick another driver
                                  </option>
                                  {driverOptions.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                      {driver.name}
                                      {driver.phone ? ` · ${driver.phone}` : ''}
                                    </option>
                                  ))}
                                </SearchableSelect>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  aria-label={`Edit dates for ${safeText(row.driverName)}`}
                                  onClick={() =>
                                    setEditor({
                                      periodId: row.periodId,
                                      from: row.from || '',
                                      to: row.to || '',
                                    })
                                  }
                                >
                                  <Pencil size={14} aria-hidden="true" /> Edit dates
                                </Button>
                              </div>

                              {isEditing ? (
                                <div className="mt-2 flex flex-wrap items-end gap-2">
                                  <label className="text-xs">
                                    <span className="block">From</span>
                                    <input
                                      type="date"
                                      aria-label={`From date for ${safeText(row.driverName)}`}
                                      value={editor.from}
                                      onChange={(event) =>
                                        setEditor((prev) => ({
                                          ...prev,
                                          from: event.target.value,
                                        }))
                                      }
                                      className="rounded border px-2 py-1 text-xs"
                                    />
                                  </label>
                                  <label className="text-xs">
                                    <span className="block">To</span>
                                    <input
                                      type="date"
                                      aria-label={`To date for ${safeText(row.driverName)}`}
                                      value={editor.to}
                                      onChange={(event) =>
                                        setEditor((prev) => ({
                                          ...prev,
                                          to: event.target.value,
                                        }))
                                      }
                                      className="rounded border px-2 py-1 text-xs"
                                    />
                                  </label>
                                  <Button
                                    size="sm"
                                    disabled={saving}
                                    onClick={() => {
                                      decide(row.periodId, {
                                        action: 'edit',
                                        from: editor.from,
                                        to: editor.to,
                                      });
                                      setEditor(null);
                                    }}
                                  >
                                    Save dates
                                  </Button>
                                </div>
                              ) : null}

                              {decision ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {DECISION_LABEL[decision.action] || 'Saved'}
                                </p>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange?.(false)}>
            Close
          </Button>
          <Button size="sm" disabled={saving || !groups.length} onClick={confirmAll}>
            {saving ? 'Saving…' : 'Confirm all'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
