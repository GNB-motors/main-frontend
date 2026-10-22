import { useState } from 'react';
import { SlidersHorizontal, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../components/ui/button';
import useMutation from '../../hooks/useMutation';
import SapService from '../../services/SapService';
export default function SapSettingsForm({ settings, onSaved, canEdit }) {
  const [form, setForm] = useState({
    tolerancePct: settings.tolerancePct ?? 10,
    multiValuePolicy: settings.multiValuePolicy ?? 'NEAREST',
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
          <p>Choose how GPS distance is compared with your SAP reference.</p>
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
        Several SAP values
        <select
          aria-label="Several SAP values"
          disabled={!canEdit || m.loading}
          value={form.multiValuePolicy}
          onChange={(e) => setForm({ ...form, multiValuePolicy: e.target.value })}
        >
          <option value="NEAREST">Nearest to actual distance</option>
          <option value="MAX">Maximum SAP value</option>
          <option value="MIN">Minimum SAP value</option>
        </select>
        <span className="sap-field-hint">
          Used when the sheet lists more than one distance for a lane.
        </span>
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
