import { useCallback, useState } from 'react';
import { Button } from '../../components/ui/button';
import SearchableSelect from '../../components/SearchableDropdown/SearchableSelect';
import billPhotoService from '../../services/billPhotoService';
import useApi from '../../hooks/useApi';
import { candidateRows } from './billPhotoModel';
import { isOdometerCapture, linkFor, pairTruck, pairsById } from './billPairModel';
import { BillRow, statusOf } from './BillRow';
import './BillsTable.css';

export { BillThumbnail } from './BillRow';

/** Rows that are still on their way to the server. */
const BUSY_STATUS = ['hashing', 'queued', 'sending'];

export default function BillsTable({
  rows = [],
  vehicles = [],
  queue,
  onSaved,
  onUnavailable,
  via,
}) {
  const [choices, setChoices] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const matched = useCallback(
    (id, suggestion) => setSuggestions((old) => ({ ...old, [id]: suggestion })),
    [],
  );

  const sentRows = rows.filter((row) => row.status === 'sent');
  const sentIdsKey = sentRows.map((row) => row.capture?.id || row.id).join(',');
  const uploading = rows.some((row) => BUSY_STATUS.includes(row.status));
  const hasOdometer = sentRows.some((row) => isOdometerCapture(row.capture || row));
  const hasSlip = sentRows.some((row) => !isOdometerCapture(row.capture || row));
  // One fetch after the uploads are done is enough: the server pairs the
  // slips and the odometer photos while it answers the list.
  const { data } = useApi(
    (signal) =>
      billPhotoService.listBillCaptures({
        source: 'office',
        status: 'pending',
        limit: 200,
        signal,
      }),
    [sentIdsKey, refresh],
    { enabled: !uploading && hasOdometer && hasSlip },
  );
  const pairs = pairsById(data?.captures);

  const captureOf = (row) => row.capture || row;
  const pairOf = (capture) => pairs.get(capture?.id) || null;
  const slipPairOf = (capture) => {
    const pair = pairOf(capture);
    return pair?.role === 'SLIP' ? pair : null;
  };
  const selection = (capture) => {
    const pair = slipPairOf(capture);
    const suggestion = suggestions[capture.id] || capture.suggestion;
    return (
      choices[capture.id] ??
      (capture.vehicleHint ||
        (suggestion?.decision === 'AUTO' ? candidateRows(suggestion)[0]?.registrationNumber : '') ||
        pairTruck(pair) ||
        '')
    );
  };
  const captures = rows
    .filter((row) => !row.status || row.status === 'sent')
    .map((row) => row.capture || row);
  // An odometer photo is never confirmed on its own: it travels with its slip.
  const selected = captures.filter(
    (capture) => !isOdometerCapture(capture) && selection(capture).trim(),
  );
  // The slips of this batch that no odometer photo is paired with yet.
  const unpairedSlips = rows
    .map((row, index) => ({ row, index, capture: captureOf(row) }))
    .filter(
      ({ row, capture }) =>
        row.status === 'sent' && !isOdometerCapture(capture) && !pairOf(capture),
    )
    .map(({ capture, index }) => ({
      id: capture.id,
      label: `#${index + 1} · ${capture.ocr?.litres ?? '—'} L`,
    }));

  /** Take the odometer photo off this slip: "not this one". */
  const unpair = async (slipCaptureId) => {
    setError('');
    try {
      await billPhotoService.unpairBill(slipCaptureId);
      setRefresh((count) => count + 1);
    } catch {
      setError('Could not take the odometer photo off this bill. Please try again.');
    }
  };
  /** Match an odometer photo to a slip of this batch. */
  const pairWith = async (slipCaptureId, odometerCaptureId) => {
    if (!slipCaptureId) return;
    setError('');
    try {
      await billPhotoService.pairBills({
        slipCaptureId,
        odometerCaptureId,
        verdict: 'pair',
      });
      setRefresh((count) => count + 1);
    } catch {
      setError('Could not match the odometer photo to that bill. Please try again.');
    }
  };
  /** The truck cell of an odometer photo: with which bill it goes. */
  const odometerCellFor = (capture) => {
    const pair = pairOf(capture);
    const slipIndex = pair?.slipCaptureId
      ? rows.findIndex((row) => captureOf(row).id === pair.slipCaptureId)
      : -1;
    if (slipIndex >= 0) return <p>Goes with bill #{slipIndex + 1}</p>;
    // Paired with a bill from an earlier upload, which waits in Approvals.
    if (pair?.slipCaptureId) return <p>Goes with an earlier bill (in Approvals)</p>;
    return (
      <>
        <p>Odometer photo, not matched to a bill yet</p>
        <label className="bp-truck-pick">
          <span className="bp-truck-pick__label">Goes with bill</span>
          <SearchableSelect
            className="bp-truck-select"
            aria-label="Goes with bill"
            value=""
            onChange={(event) => pairWith(event.target.value, capture.id)}
          >
            <option value="">Search bills…</option>
            {unpairedSlips.map((slip) => (
              <option key={slip.id} value={slip.id}>
                {slip.label}
              </option>
            ))}
          </SearchableSelect>
        </label>
      </>
    );
  };
  const save = async () => {
    setSaving(true);
    setError('');
    setErrors({});
    try {
      await billPhotoService.saveBillLinks(
        selected.map((capture) => linkFor(capture, selection(capture), slipPairOf(capture), via)),
      );
      setChoices({});
      // The queue drops the slip and the odometer photo it travels with.
      const saved = selected.flatMap((capture) => {
        const pair = slipPairOf(capture);
        return pair?.odometerCaptureId ? [capture.id, pair.odometerCaptureId] : [capture.id];
      });
      onSaved?.(saved);
    } catch (err) {
      if (statusOf(err) === 404) {
        onUnavailable?.();
        return;
      }
      const details = err?.body?.errors ?? err?.response?.data?.errors;
      if (statusOf(err) === 422 && Array.isArray(details)) {
        const mapped = {};
        details.forEach((item) => {
          const id = item.captureId || selected[item.index]?.id;
          if (id) mapped[id] = item.errors || ['Please check this bill'];
        });
        setErrors(mapped);
        setError('No bills were saved. Please check the highlighted bills.');
      } else setError('Could not save bills. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      {rows.length > 0 && (
        <div className="bills-table-wrap">
          <table className="bills-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Details</th>
                <th>Photo</th>
                <th>Truck</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const capture = captureOf(row);
                const odometer = isOdometerCapture(capture);
                const pair = odometer ? null : slipPairOf(capture);
                // The odometer photo of this pair, when it is part of this batch.
                const odometerRow = pair
                  ? rows.find((other) => captureOf(other).id === pair.odometerCaptureId)
                  : null;
                return (
                  <BillRow
                    key={row.id}
                    row={row}
                    index={index}
                    vehicles={vehicles}
                    choice={choices[capture.id]}
                    onChoice={(value) => setChoices((old) => ({ ...old, [capture.id]: value }))}
                    errors={errors[capture.id]}
                    onMatched={matched}
                    onUnavailable={onUnavailable}
                    queue={queue}
                    pair={pair}
                    pairFile={odometerRow?.file}
                    onUnpair={pair ? () => unpair(pair.slipCaptureId) : undefined}
                    odometerCell={odometer ? odometerCellFor(capture) : undefined}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {rows.length > 0 && (
        <Button className="bp-confirm-btn" disabled={saving || !selected.length} onClick={save}>
          Confirm {selected.length} bills
        </Button>
      )}
    </>
  );
}
