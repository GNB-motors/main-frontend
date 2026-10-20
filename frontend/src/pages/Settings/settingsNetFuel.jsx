import { useState } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import { SettingsService } from './SettingsService';
import { Card, LoadError, SectionHead, Skeleton } from './settingsAtoms';

const MIN = 0.5;
const MAX = 20;

/**
 * Standard mileage for the OIL & AVERAGE export: NET FUEL = NET Kms ÷ this
 * km/L, the 2.9 the owners' own OIL REPORT formula uses unless changed here.
 */
export const NetFuelSetting = ({ canEdit }) => {
  const { data, error, refetch } = useApi(
    (signal) => SettingsService.getFuelSettings({ signal }),
    [],
  );
  const [savedNow, setSavedNow] = useState(null);
  const saved = savedNow?.netFuelKmPerL ?? data?.netFuelKmPerL ?? null;
  const source = savedNow ? savedNow.netFuelKmPerLSource : (data?.netFuelKmPerLSource ?? null);
  const [draft, setDraft] = useState(null);
  const value = draft ?? (saved == null ? '' : String(saved));
  const [saving, setSaving] = useState(false);

  const n = Number(value);
  const valid =
    value !== '' && Number.isFinite(n) && n >= MIN && n <= MAX && Math.round(n * 100) === n * 100;

  const save = async (e) => {
    e.preventDefault();
    if (!valid || n === saved) return;
    setSaving(true);
    try {
      const res = await SettingsService.updateNetFuelKmPerL(n);
      const v = res.netFuelKmPerL ?? n;
      setSavedNow({ netFuelKmPerL: v, netFuelKmPerLSource: res.netFuelKmPerLSource ?? 'ORG' });
      setDraft(null);
      toast.success(`Oil report now uses ${v} km/L for NET FUEL`);
    } catch (err) {
      toast.error(err?.message || 'Could not save the standard mileage.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionHead
        id="stx-sec-net-fuel"
        title="Oil report"
        desc="NET FUEL in the Fuel Cycles Excel export is NET Kms divided by this mileage."
      />
      <Card title="Standard mileage">
        {saved == null && error ? (
          <LoadError message="Could not load the standard mileage." onRetry={refetch} />
        ) : saved == null ? (
          <Skeleton rows={1} />
        ) : canEdit ? (
          <form className="stx-inline-form" onSubmit={save}>
            <label htmlFor="net-fuel-kmpl" className="stx-label">
              NET FUEL = NET Kms ÷
            </label>
            <div className="stx-input-unit">
              <input
                id="net-fuel-kmpl"
                aria-label="Standard mileage in km per litre"
                type="number"
                min={MIN}
                max={MAX}
                step={0.01}
                value={value}
                onChange={(e) => setDraft(e.target.value)}
                className="stx-input stx-input--num"
              />
              <span>km/L</span>
            </div>
            <button
              type="submit"
              disabled={!valid || saving || n === saved}
              className="stx-btn stx-btn--primary"
            >
              Save
            </button>
            {!valid && value !== '' ? (
              <span className="stx-field-error">0.5 to 20 km/L, up to two decimals.</span>
            ) : null}
          </form>
        ) : (
          <p className="stx-readonly">
            NET FUEL uses <strong>{saved} km/L</strong>. Ask an owner or manager to change it.
          </p>
        )}
        {saved != null && source === 'DEFAULT' ? (
          <p className="stx-hint">
            <span className="stx-badge">Default</span>
            The OIL REPORT&apos;s own 2.9 km/L — nobody in your organisation has changed it.
          </p>
        ) : null}
      </Card>
    </>
  );
};
