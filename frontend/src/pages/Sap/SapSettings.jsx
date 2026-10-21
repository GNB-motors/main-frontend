import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import SapService from '../../services/SapService';
import SapRequestState from './SapRequestState';
import { canEditSap, sheetCsv } from './sapModel';
import { getUserRole } from '../../utils/session';
const METRICS = [
  'rows',
  'lanes',
  'withConflictingSap',
  'notInSap',
  'written',
  'unchanged',
  'superseded',
  'vanished',
];
function ImportResult({ result }) {
  return (
    <div className="sap-box">
      <h3>Sheet preview</h3>
      <dl className="sap-row">
        {METRICS.map((key) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>
              <strong>{result[key] ?? '—'}</strong>
            </dd>
          </div>
        ))}
      </dl>
      {['skipped', 'rejectedNumericLabels', 'possibleDuplicates'].map((key) => (
        <details key={key}>
          <summary>
            {key} ({result[key]?.length || 0})
          </summary>
          <ul>
            {(result[key] || []).map((item, i) => (
              <li key={i}>
                {typeof item === 'string'
                  ? item
                  : Object.entries(item)
                      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                      .join(' · ')}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
function SettingsForm({ settings, onSaved, canEdit }) {
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
    <form className="sap-box" onSubmit={submit}>
      <h3>Comparison settings</h3>
      <div className="sap-row">
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
        </label>
        <label>
          Several SAP values
          <select
            disabled={!canEdit || m.loading}
            value={form.multiValuePolicy}
            onChange={(e) => setForm({ ...form, multiValuePolicy: e.target.value })}
          >
            <option value="NEAREST">Nearest</option>
            <option value="MAX">Maximum</option>
            <option value="MIN">Minimum</option>
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
        </label>
      </div>
      <p className="sap-muted">
        Nearest: when a lane lists several SAP values, compare with the one closest to the trip.
      </p>
      {canEdit && (
        <button className="sap-btn" type="submit" disabled={m.loading}>
          {m.loading ? 'Saving…' : 'Save settings'}
        </button>
      )}
    </form>
  );
}
export default function SapSettings() {
  const q = useApi((signal) => SapService.settings({ signal }), []);
  const canEdit = canEditSap(getUserRole());
  const [csv, setCsv] = useState(null);
  const [preview, setPreview] = useState(null);
  const [reading, setReading] = useState(false);
  const sequence = useRef(0);
  const fileInput = useRef(null);
  const m = useMutation(SapService.importSheet);
  const busy = reading || m.loading;
  const choose = async (file) => {
    const seq = ++sequence.current;
    setCsv(null);
    setPreview(null);
    if (!file) return;
    setReading(true);
    try {
      const text = await sheetCsv(file);
      if (text.length > 900000)
        throw new Error('The sheet is too large. Choose a CSV under 900,000 characters.');
      if (seq === sequence.current) setCsv(text);
    } catch (err) {
      toast.error(err?.message || 'Could not read sheet');
    } finally {
      if (seq === sequence.current) setReading(false);
    }
  };
  const upload = async (dryRun) => {
    if (!canEdit || busy || !csv || (!dryRun && !preview)) return;
    try {
      const result = await m.mutate({ csv, dryRun });
      if (dryRun) setPreview(result);
      else {
        toast.success('SAP updated — trips refresh shortly');
        setCsv(null);
        setPreview(null);
        if (fileInput.current) fileInput.current.value = '';
      }
    } catch (err) {
      setPreview(null);
      toast.error(err?.message || 'Could not import sheet');
    }
  };
  return (
    <section className="sap-panel">
      <h2>SAP settings and upload</h2>
      <SapRequestState query={q}>
        {q.data && (
          <SettingsForm
            key={JSON.stringify(q.data)}
            settings={q.data}
            canEdit={canEdit}
            onSaved={q.refetch}
          />
        )}
      </SapRequestState>
      {canEdit && (
        <div className="sap-box">
          <h3>Upload SAP sheet</h3>
          <p>
            Choose CSV or XLSX with headers FROM, TO, SAP. For a workbook, only the first sheet is
            imported.
          </p>
          <label>
            Sheet file
            <input
              type="file"
              aria-label="Sheet file"
              ref={fileInput}
              accept=".csv,.xlsx"
              disabled={busy}
              onChange={(e) => choose(e.target.files?.[0])}
            />
          </label>
          <button
            className="sap-btn"
            type="button"
            disabled={busy || !csv}
            onClick={() => upload(true)}
          >
            {busy ? 'Working…' : 'Preview import'}
          </button>
          {preview && (
            <>
              <ImportResult result={preview} />
              <p>
                Confirming applies this sheet, including any superseded or vanished lanes shown
                above.
              </p>
              <button
                className="sap-btn sap-btn--primary"
                type="button"
                disabled={busy || !csv}
                onClick={() => upload(false)}
              >
                Confirm import
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
