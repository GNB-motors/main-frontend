import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Lock, ShieldCheck, X, CornerDownRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { PermissionRegistryService } from '../PermissionRegistryService.jsx';

const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none';
const label = 'mb-1 block text-xs font-semibold text-slate-600';

// Add module / sub-permission modal.
function AddModal({ topLevel, onClose, onAdded }) {
  const [form, setForm] = useState({ key: '', label: '', description: '', parentKey: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,63}$/.test(form.key.trim())) {
      toast.error('Key must start with a letter and contain only letters/numbers (no spaces, dots or dashes)');
      return;
    }
    if (!form.label.trim()) { toast.error('Label is required'); return; }
    setSaving(true);
    try {
      await PermissionRegistryService.addEntry({
        key: form.key.trim(),
        label: form.label.trim(),
        description: form.description.trim() || undefined,
        parentKey: form.parentKey || undefined,
      });
      toast.success('Permission added');
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add permission');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-800">Add permission</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div>
            <label className={label}>Type</label>
            <select className={field} value={form.parentKey} onChange={(e) => set('parentKey', e.target.value)}>
              <option value="">Top-level module</option>
              {topLevel.map((m) => <option key={m.key} value={m.key}>Sub-permission of “{m.label}”</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Key *</label>
            <input className={`${field} font-mono`} value={form.key} onChange={(e) => set('key', e.target.value)} placeholder="e.g. geofenceReports" />
            <p className="mt-1 text-[11px] text-slate-400">Stored on roles and checked in code — keep it stable. Letters/numbers only.</p>
          </div>
          <div>
            <label className={label}>Label *</label>
            <input className={field} value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="e.g. Geofence Reports" />
          </div>
          <div>
            <label className={label}>Description</label>
            <input className={field} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Shown under the toggle (optional)" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Adding…' : 'Add permission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PermissionsRegistryPage() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCatalog(await PermissionRegistryService.getCatalog());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const topLevel = useMemo(() => catalog.map((m) => ({ key: m.key, label: m.label })), [catalog]);

  const remove = async (key, name) => {
    if (!window.confirm(`Remove permission "${name}"? Roles that granted it will simply stop showing it.`)) return;
    try {
      await PermissionRegistryService.removeEntry(key);
      toast.success('Permission removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const Row = ({ node, child }) => (
    <div className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 ${child ? '' : 'shadow-sm'}`}>
      <div className="flex min-w-0 items-center gap-2">
        {child && <CornerDownRight size={14} className="shrink-0 text-slate-300" />}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{node.label}</span>
            <span className="font-mono text-[11px] text-slate-400">{node.key}</span>
          </div>
          {node.description ? <div className="truncate text-xs text-slate-400">{node.description}</div> : null}
        </div>
      </div>
      {node.seed ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
          <Lock size={11} /> Built-in
        </span>
      ) : (
        <button onClick={() => remove(node.key, node.label)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Remove">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800"><ShieldCheck size={20} className="text-indigo-600" /> Permission catalog</h1>
          <p className="mt-0.5 text-sm text-slate-500">Modules and sub-permissions that owners can grant to roles. Built-in entries are locked; anything you add appears in every org's Roles &amp; Permissions screen.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={15} /> Add permission
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : (
        <div className="space-y-3">
          {catalog.map((mod) => (
            <div key={mod.key} className="space-y-2">
              <Row node={mod} />
              {mod.children?.length > 0 && (
                <div className="ml-5 space-y-2 border-l border-dashed border-slate-200 pl-4">
                  {mod.children.map((c) => <Row key={c.key} node={c} child />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal topLevel={topLevel} onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}
