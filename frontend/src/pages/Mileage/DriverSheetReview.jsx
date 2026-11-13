import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import PhotoImportService from '../../services/PhotoImportService';
import './WhatsappExportDialog.css';

const LOAD_ERROR = 'Could not load driver suggestions. Try again.';
const SAVE_ERROR = 'Could not save. Try again.';

const rowId = (row) => row?._id || row?.id || '';

const driverSheetService = {
  confirm: (ids) => PhotoImportService.confirmDriverSheetSuggestions(ids),
  dismiss: (ids) => PhotoImportService.dismissDriverSheetSuggestions(ids),
};

/** The pending driver names found in the uploaded sheet. */
export default function DriverSheetReview({ open, onOpenChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [rowErrors, setRowErrors] = useState({});
  const [working, setWorking] = useState(() => new Set());
  const [lastAction, setLastAction] = useState(null);
  // The pending read of the suggestions, so closing the dialog aborts it.
  const loadRequest = useRef(null);

  const loadRows = useCallback(async (keepIds = []) => {
    loadRequest.current?.abort();
    const controller = new AbortController();
    loadRequest.current = controller;
    setLoading(true);
    setLoadError('');
    try {
      const data = await PhotoImportService.getDriverSheetSuggestions({
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const next = Array.isArray(data) ? data : [];
      setRows((current) => {
        const kept = current.filter(
          (row) => keepIds.includes(rowId(row)) && !next.some((item) => rowId(item) === rowId(row)),
        );
        return [...next, ...kept];
      });
    } catch {
      if (!controller.signal.aborted) setLoadError(LOAD_ERROR);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    // A dialog opened for a new chat starts without the last chat's errors.
    setSaveError('');
    setRowErrors({});
    setLastAction(null);
    loadRows();
    return () => loadRequest.current?.abort();
  }, [open, loadRows]);

  const save = useCallback(
    async (ids, action) => {
      const wanted = [...new Set(ids.filter(Boolean))];
      if (!wanted.length) return;
      setWorking(new Set(wanted));
      setSaveError('');
      setRowErrors({});
      try {
        const failed = new Map();
        if (action === 'confirm') {
          const answer = await driverSheetService.confirm(wanted);
          const confirmed = new Set(Array.isArray(answer?.confirmed) ? answer.confirmed : []);
          for (const item of Array.isArray(answer?.failed) ? answer.failed : []) {
            const id = item?.id || item?._id;
            if (id) failed.set(id, item?.message || 'Could not save. Try again.');
          }
          wanted.forEach((id) => {
            if (!confirmed.has(id) && !failed.has(id)) failed.set(id, 'Could not save. Try again.');
          });
        } else {
          const answer = await driverSheetService.dismiss(wanted);
          for (const item of Array.isArray(answer?.failed) ? answer.failed : []) {
            const id = item?.id || item?._id;
            if (id) failed.set(id, item?.message || 'Could not save. Try again.');
          }
        }

        const failedIds = [...failed.keys()];
        if (failedIds.length) {
          setRows((current) => current.filter((row) => failedIds.includes(rowId(row))));
          setRowErrors(Object.fromEntries(failed));
          setSaveError(SAVE_ERROR);
          setLastAction({ ids: failedIds, action });
        } else {
          setRows((current) => current.filter((row) => !wanted.includes(rowId(row))));
          setLastAction(null);
        }
        await loadRows(failedIds);
      } catch {
        setSaveError(SAVE_ERROR);
        setLastAction({ ids: wanted, action });
      } finally {
        setWorking(new Set());
      }
    },
    [loadRows],
  );

  const missingIds = useMemo(
    () =>
      rows
        .filter((row) => row?.kind === 'MISSING' && row?.status === 'PENDING')
        .map(rowId)
        .filter(Boolean),
    [rows],
  );

  const retry = () => {
    if (lastAction) save(lastAction.ids, lastAction.action);
    else loadRows();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bp-dialog wxp-driver-dialog">
        <DialogHeader className="bp-dialog-head">
          <DialogTitle>Driver list from the chat</DialogTitle>
          <DialogDescription>
            Check the driver names in the sheet against the names used in the app.
          </DialogDescription>
        </DialogHeader>
        <div className="bp-dialog-body wxp-driver-body">
          {loading ? <p className="wxp-note">Loading driver list…</p> : null}
          {loadError ? (
            <div className="wxp-driver-error" role="alert">
              <span>{loadError}</span>
              <Button size="sm" variant="outline" onClick={() => loadRows()}>
                Retry
              </Button>
            </div>
          ) : null}
          {saveError ? (
            <div className="wxp-driver-error" role="alert">
              <span>{saveError}</span>
              <Button size="sm" variant="outline" onClick={retry}>
                Retry
              </Button>
            </div>
          ) : null}
          {!loading && !loadError && !rows.length ? (
            <p className="wxp-note">No driver suggestions to review.</p>
          ) : null}
          {rows.length ? (
            <div className="wxp-driver-table-wrap">
              <table className="wxp-driver-table">
                <thead>
                  <tr>
                    <th scope="col">Truck</th>
                    <th scope="col">Driver from sheet</th>
                    <th scope="col">Driver in app</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const id = rowId(row);
                    const busy = working.has(id);
                    return (
                      <tr key={id}>
                        <td>{row?.plate || row?.vehicleId || '—'}</td>
                        <td>
                          <span>{row?.driverName || '—'}</span>
                          {row?.phone || row?.sheetDate ? (
                            <small>
                              {[row?.phone, row?.sheetDate].filter(Boolean).join(' · ')}
                            </small>
                          ) : null}
                        </td>
                        <td>{row?.appDriverName || '—'}</td>
                        <td>
                          <div className="wxp-driver-actions">
                            <Button
                              size="xs"
                              disabled={busy}
                              onClick={() => save([id], 'confirm')}
                            >
                              {busy ? 'Confirming…' : 'Confirm'}
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={busy}
                              onClick={() => save([id], 'dismiss')}
                            >
                              Dismiss
                            </Button>
                          </div>
                          {rowErrors[id] ? (
                            <small className="wxp-driver-row-error">{rowErrors[id]}</small>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        <div className="bp-dialog-foot">
          <Button
            size="sm"
            disabled={!missingIds.length || working.size > 0}
            onClick={() => save(missingIds, 'confirm')}
          >
            Confirm all missing
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpenChange?.(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
