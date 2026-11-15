import { useCallback, useState } from 'react';
import { Button } from '../../components/ui/button';
import billPhotoService from '../../services/billPhotoService';
import { candidateRows } from './billPhotoModel';
import { BillRow, statusOf } from './BillRow';
import './BillsTable.css';

export { BillThumbnail } from './BillRow';

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
  const matched = useCallback(
    (id, suggestion) => setSuggestions((old) => ({ ...old, [id]: suggestion })),
    [],
  );
  const captures = rows
    .filter((row) => !row.status || row.status === 'sent')
    .map((row) => row.capture || row);
  const selection = (capture) =>
    choices[capture.id] ??
    (capture.vehicleHint ||
      ((suggestions[capture.id] || capture.suggestion)?.decision === 'AUTO'
        ? candidateRows(suggestions[capture.id] || capture.suggestion)[0]?.registrationNumber
        : '') ||
      '');
  const selected = captures.filter((capture) => selection(capture).trim());
  const save = async () => {
    setSaving(true);
    setError('');
    setErrors({});
    try {
      await billPhotoService.saveBillLinks(
        selected.map((capture) => ({
          captureId: capture.id,
          registrationNumber: selection(capture),
          reason: null,
          via,
        })),
      );
      setChoices({});
      onSaved?.(selected.map((capture) => capture.id));
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
                const capture = row.capture || row;
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
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {rows.length > 0 && (
        <Button
          className="bp-confirm-btn"
          disabled={saving || !selected.length}
          onClick={save}
        >
          Confirm {selected.length} bills
        </Button>
      )}
    </>
  );
}
