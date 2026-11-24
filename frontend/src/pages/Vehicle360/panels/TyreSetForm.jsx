import { useId, useState } from 'react';
import FleetDataService from '@/services/FleetDataService';
import { toISTDateString } from '@/utils/dateUtils';

/** The first recorded set, using the same fields as the tyre ledger. */
export default function TyreSetForm({ vehicleId, registrationNumber, onSaved }) {
  const fieldId = useId();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      await FleetDataService.fitTyreSet({
        ...(vehicleId ? { vehicleId } : { registrationNumber }),
        fittedAt: `${fields.get('fittedAt')}T00:00:00+05:30`,
        fittedOdometer: Number(fields.get('fittedOdometer')),
        tyreCount: Number(fields.get('tyreCount')),
        totalCostInr: Number(fields.get('totalCostInr')),
        expectedLifeKm: Number(fields.get('expectedLifeKm')),
        ...(fields.get('brand') ? { brand: fields.get('brand').trim() } : {}),
      });
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save tyre details. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  if (saved) return <p role="status">Tyre details saved.</p>;
  return (
    <form onSubmit={submit} className="vtyres-set-form" aria-label="Add tyre details">
      <p>Record the fitted set to track its distance, cost and expected replacement.</p>
      <div className="vtyres-set-fields">
        <label htmlFor={`${fieldId}-fittedAt`}>
          Fitted on
          <input
            id={`${fieldId}-fittedAt`}
            aria-label="Fitted on"
            name="fittedAt"
            type="date"
            defaultValue={toISTDateString(new Date())}
            required
          />
        </label>
        <label htmlFor={`${fieldId}-fittedOdometer`}>
          Odometer at fitment (km)
          <input
            id={`${fieldId}-fittedOdometer`}
            aria-label="Odometer at fitment (km)"
            name="fittedOdometer"
            type="number"
            min="0"
            step="any"
            required
          />
        </label>
        <label htmlFor={`${fieldId}-tyreCount`}>
          Number of tyres
          <input
            id={`${fieldId}-tyreCount`}
            aria-label="Number of tyres"
            name="tyreCount"
            type="number"
            min="1"
            step="1"
            required
          />
        </label>
        <label htmlFor={`${fieldId}-totalCostInr`}>
          Total set cost (₹)
          <input
            id={`${fieldId}-totalCostInr`}
            aria-label="Total set cost (₹)"
            name="totalCostInr"
            type="number"
            min="0"
            step="any"
            required
          />
        </label>
        <label htmlFor={`${fieldId}-expectedLifeKm`}>
          Expected life (km)
          <input
            id={`${fieldId}-expectedLifeKm`}
            aria-label="Expected life (km)"
            name="expectedLifeKm"
            type="number"
            min="1"
            step="any"
            required
          />
        </label>
        <label htmlFor={`${fieldId}-brand`}>
          Brand (optional)
          <input
            id={`${fieldId}-brand`}
            aria-label="Brand (optional)"
            name="brand"
            maxLength="64"
          />
        </label>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <button className="vtyres-link" type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save tyre details'}
      </button>
    </form>
  );
}
