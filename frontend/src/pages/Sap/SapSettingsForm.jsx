import { useState } from 'react';
import { SlidersHorizontal, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../components/ui/button';
import useMutation from '../../hooks/useMutation';
import SapService from '../../services/SapService';
import { BASIS_POLICY_LABEL, DIRECTION_LABEL } from './sapModel';
export default function SapSettingsForm({ settings, onSaved, canEdit }) {
  const [form, setForm] = useState({
    tolerancePct: settings.tolerancePct ?? 10,
    directionPolicy: settings.directionPolicy ?? 'DIRECTED',
    basisPolicy: settings.basisPolicy ?? 'DECLARED',
    minKmForVerdict: settings.minKmForVerdict ?? 10,
  });
  const m = useMutation(SapService.saveSettings);
  const submit = async (e) => {
    e.preventDefault();
    if (!canEdit || m.loading) return;
    try {
      await m.mutate({
        ...form,
        tolerancePct: Number(form.tolerancePct),
        minKmForVerdict: Number(form.minKmForVerdict),
      });
      toast.success('SAP updated — trips refresh shortly');
      onSaved();
    } catch (err) {
      toast.error(err?.message || 'Could not save settings');
    }
  };
  return (
    <form className="sap-card" onSubmit={submit}>
      <div className="sap-card-heading">
        <SlidersHorizontal aria-hidden="true" />
        <div>
          <h2>Comparison settings</h2>
          <p>How a route&apos;s GPS distance is compared with its SAP.</p>
        </div>
      </div>
      <label>
        Tolerance (%)
        <input
          required
          type="number"
          aria-label="Tolerance (%)"
          min="1"
          max="50"
          step="any"
          disabled={!canEdit || m.loading}
          value={form.tolerancePct}
          onChange={(e) => setForm({ ...form, tolerancePct: e.target.value })}
        />
        <span className="sap-field-hint">Trips within this percentage are marked within SAP.</span>
      </label>
      <label>
        Routes
        <select
          aria-label="Routes"
          disabled={!canEdit || m.loading}
          value={form.directionPolicy}
          onChange={(e) => setForm({ ...form, directionPolicy: e.target.value })}
        >
          {Object.entries(DIRECTION_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        One way or round trip
        <select
          aria-label="One way or round trip"
          disabled={!canEdit || m.loading}
          value={form.basisPolicy}
          onChange={(e) => setForm({ ...form, basisPolicy: e.target.value })}
        >
          {Object.entries(BASIS_POLICY_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label>
        Minimum trip km for a verdict
        <input
          required
          type="number"
          aria-label="Minimum trip km for a verdict"
          min="0"
          max="100"
          step="any"
          disabled={!canEdit || m.loading}
          value={form.minKmForVerdict}
          onChange={(e) => setForm({ ...form, minKmForVerdict: e.target.value })}
        />
        <span className="sap-field-hint">
          Shorter trips keep their distance without a comparison verdict.
        </span>
      </label>
      <div className="sap-notice">
        <Info size={16} aria-hidden="true" />
        <span>Saved changes apply to existing trips as they refresh.</span>
      </div>
      {canEdit && (
        <div className="sap-card-footer">
          <Button type="submit" disabled={m.loading}>
            {m.loading ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      )}
    </form>
  );
}
