import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import billPhotoService from '../../services/billPhotoService';
import safeText from '../../utils/redactSensitive';
import { identity } from './office/officeBill';

const show = (v) => (v == null || v === '' ? 'Unknown' : String(v));
const time = (v) =>
  v && !Number.isNaN(Date.parse(v))
    ? new Date(v).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'Unknown';

/**
 * The log of one bill: who uploaded it, who confirmed it, and every change
 * made to the truck it belongs to.
 */
export function HistoryDrawer({ capture, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!capture) return undefined;
    const controller = new AbortController();
    setData(null);
    setError('');
    billPhotoService
      .getBillLinkHistory(capture.id, { signal: controller.signal })
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load the log.');
      });
    return () => controller.abort();
  }, [capture]);
  return (
    <Sheet
      open={Boolean(capture)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full !max-w-[460px] overflow-y-auto bg-[var(--rd-card)]">
        <SheetHeader>
          <SheetTitle>Bill log</SheetTitle>
          <SheetDescription>History for this bill</SheetDescription>
        </SheetHeader>
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p>Loading log…</p>}
        {data?.entries?.length === 0 && <p>No log entries yet.</p>}
        {data?.entries?.map((entry, i) => {
          const kind = String(entry.action || entry.type || entry.event || 'EDITED').toUpperCase();
          const label = kind.includes('UPLOAD')
            ? 'Uploaded'
            : kind.includes('CONFIRM')
              ? 'Confirmed'
              : 'Edited';
          return (
            <div key={`${entry.at}-${i}`} className="my-3 border-b border-[var(--rd-line)] pb-3">
              <strong>{label}</strong>
              <p>
                {identity(
                  entry.actor || entry.by,
                  entry.actorName || entry.byName,
                  entry.actorRole || entry.role,
                )}{' '}
                {'\u00b7'} {time(entry.at || entry.createdAt)}
              </p>
              {entry.fromRegistration && (
                <p>
                  {show(entry.fromRegistration)} {'\u2192'} {show(entry.toRegistration)}
                </p>
              )}
              {entry.reason && <p>Reason: {safeText(entry.reason)}</p>}
            </div>
          );
        })}
      </SheetContent>
    </Sheet>
  );
}


