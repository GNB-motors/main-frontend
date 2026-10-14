import { useState } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import { SettingsService } from './SettingsService';
import { Card, LoadError, SectionHead, Skeleton } from './settingsAtoms';

const MIN = 1;
const MAX = 1440;

const USED_BY = ['Idling console', 'Daily digest', 'Driver scores', 'Mileage Report export'];

/**
 * Org idle threshold: a stop with the engine on counts as idling once it
 * lasts this many minutes (20 by default). The idling console, daily digest,
 * driving score and the Mileage Report export all use it.
 */
export const IdleThresholdSetting = ({ canEdit }) => {
  const { data, error, refetch } = useApi(
    (signal) => SettingsService.getFuelSettings({ signal }),
    [],
  );
  // What the last save returned; until then the loaded settings are the truth.
  const [savedNow, setSavedNow] = useState(null);
  const saved = savedNow?.idleThresholdMin ?? data?.idleThresholdMin ?? null;
  // 'DEFAULT' until someone in the org saves a value; older APIs omit it.
  const source = savedNow ? savedNow.idleThresholdSource : (data?.idleThresholdSource ?? null);
  const [draft, setDraft] = useState(null);
  const value = draft ?? (saved == null ? '' : String(saved));
  const [saving, setSaving] = useState(false);

  const n = Number(value);
  const valid = Number.isInteger(n) && n >= MIN && n <= MAX;

  const save = async (e) => {
    e.preventDefault();
    if (!valid || n === saved) return;
    setSaving(true);
    try {
      const res = await SettingsService.updateIdleThreshold(n);
      const v = res.idleThresholdMin ?? n;
      setSavedNow({ idleThresholdMin: v, idleThresholdSource: res.idleThresholdSource ?? 'ORG' });
      setDraft(null);
      toast.success(`Idling now counts after ${v} min`);
    } catch (err) {
      toast.error(err?.message || 'Could not save the idle setting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionHead
        id="stx-sec-idling"
        title="Idling"
        desc="A stop with the engine running counts as idling once it lasts this long."
      />
      <Card title="Idle threshold">
        {saved == null && error ? (
          <LoadError message="Could not load the idle threshold." onRetry={refetch} />
        ) : saved == null ? (
          <Skeleton rows={1} />
        ) : canEdit ? (
          <form className="stx-inline-form" onSubmit={save}>
            <label htmlFor="idle-threshold" className="stx-label">
              Count as idling after
            </label>
            <div className="stx-input-unit">
              <input
                id="idle-threshold"
                aria-label="Idle threshold in minutes"
                type="number"
                min={MIN}
                max={MAX}
                step={1}
                value={value}
                onChange={(e) => setDraft(e.target.value)}
                className="stx-input stx-input--num"
              />
              <span>min</span>
            </div>
            <button
              type="submit"
              disabled={!valid || saving || n === saved}
              className="stx-btn stx-btn--primary"
            >
              Save
            </button>
            {!valid && value !== '' ? (
              <span className="stx-field-error">Whole minutes, 1 to 1440.</span>
            ) : null}
          </form>
        ) : (
          <p className="stx-readonly">
            Counts as idling after <strong>{saved} min</strong>. Ask an owner or manager to change
            it.
          </p>
        )}
        {saved != null && source === 'DEFAULT' ? (
          <p className="stx-hint">
            <span className="stx-badge">Default</span>
            Nobody in your organisation has changed this yet.
          </p>
        ) : null}
        <div className="stx-used-by">
          <span className="stx-used-by-label">Used by</span>
          {USED_BY.map((u) => (
            <span key={u} className="stx-chip">
              {u}
            </span>
          ))}
        </div>
      </Card>
    </>
  );
};
