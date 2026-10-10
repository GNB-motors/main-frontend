import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Timer } from 'lucide-react';
import apiClient from '../../utils/axiosConfig';
import { SectionHeader } from './profileAtoms';

const MIN = 1;
const MAX = 1440;

/**
 * Org idle threshold: a stop with the engine on counts as idling once it
 * lasts this many minutes (20 by default). The idling console, daily brief,
 * driving score and the Mileage Report export all use it.
 */
export const IdleThresholdSetting = ({ canEdit }) => {
  const [saved, setSaved] = useState(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    apiClient
      .get('api/fuel-settings')
      .then((res) => {
        if (!live) return;
        const v = res.data?.data?.idleThresholdMin;
        setSaved(v);
        setValue(String(v));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const n = Number(value);
  const valid = Number.isInteger(n) && n >= MIN && n <= MAX;

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiClient.patch('api/fuel-settings', { idleThresholdMin: n });
      const v = res.data?.data?.idleThresholdMin ?? n;
      setSaved(v);
      setValue(String(v));
      toast.success(`Idling now counts after ${v} min`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the idle setting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(41,64,211,0.08)]">
      <SectionHeader icon={Timer} title="Idling" />
      <p className="mb-4 max-w-xl text-sm text-slate-500">
        A stop with the engine running counts as idling once it lasts this long. Used by the idling
        console, daily brief, driver scores and the Mileage Report export.
      </p>
      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="idle-threshold" className="text-sm font-medium text-slate-700">
            Count as idling after
          </label>
          <input
            id="idle-threshold"
            aria-label="Idle threshold in minutes"
            type="number"
            min={MIN}
            max={MAX}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-9 w-24 rounded-lg border border-slate-200 px-3 text-sm"
          />
          <span className="text-sm text-slate-500">min</span>
          <button
            type="button"
            onClick={save}
            disabled={!valid || saving || n === saved}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
          >
            Save
          </button>
          {!valid && value !== '' && (
            <span className="text-xs text-red-600">Whole minutes, 1 to 1440.</span>
          )}
        </div>
      ) : (
        saved != null && (
          <p className="text-sm text-slate-700">
            Counts as idling after <strong>{saved} min</strong>. Ask an owner or manager to change it.
          </p>
        )
      )}
    </div>
  );
};
