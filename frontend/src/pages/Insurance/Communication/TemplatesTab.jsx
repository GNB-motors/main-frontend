import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { InsuranceService } from '../InsuranceService';
import Modal from '../components/Modal';
import SignatureEditor from './components/SignatureEditor';
import EmailPreview from './components/EmailPreview';

const fieldCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none';
const labelCls = 'mb-1 block text-xs font-semibold text-slate-600';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function TemplateEditor({ initial, settings, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    subject: initial?.subject || '',
    bodyHtml: initial?.bodyHtml || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error('Name and subject are required');
      return;
    }
    setSaving(true);
    try {
      if (initial?._id) await InsuranceService.updateTemplate(initial._id, form);
      else await InsuranceService.createTemplate(form);
      toast.success('Template saved');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={initial?._id ? 'Edit template' : 'New template'} onClose={onClose} maxWidth="max-w-4xl">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Template Name *</label>
            <input className={fieldCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Renewal Reminder" />
          </div>
          <div>
            <label className={labelCls}>Subject *</label>
            <input className={fieldCls} value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="e.g. {{PolicyNumber}} renews soon" />
          </div>
          <div>
            <label className={labelCls}>Body</label>
            <SignatureEditor value={form.bodyHtml} onChange={(html) => set('bodyHtml', html)} placeholder="Hi {{CustomerName}}, …" minHeight={200} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={save} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save template'}
            </button>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Live preview</div>
          <EmailPreview
            mode="template"
            fromName={settings?.fromName}
            fromEmail={settings?.fromEmail}
            logoUrl={settings?.logo?.url}
            subject={form.subject}
            bodyHtml={form.bodyHtml}
            signatureHtml={settings?.signatureHtml}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // template object | {} for new | null

  const load = () => {
    setLoading(true);
    Promise.all([InsuranceService.listTemplates(), InsuranceService.getSettings()])
      .then(([tpls, s]) => {
        setTemplates(tpls);
        setSettings(s);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load templates'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (tpl) => {
    if (!window.confirm(`Delete template "${tpl.name}"?`)) return;
    try {
      await InsuranceService.deleteTemplate(tpl._id);
      toast.success('Template deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">Reusable messages with {'{{placeholders}}'} merged at send time.</p>
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus size={15} /> New Template
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Template Name</th>
              <th className="px-4 py-3 font-semibold">Subject</th>
              <th className="px-4 py-3 font-semibold">Last Modified</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-5 w-full animate-pulse rounded bg-slate-100" /></td></tr>
              ))
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center">
                  <FileText size={22} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">No templates yet</p>
                  <p className="mt-1 text-xs text-slate-400">Create reusable emails like “Renewal Reminder” or “Quote Sent”.</p>
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{t.name}</td>
                  <td className="px-4 py-3 text-slate-600">{t.subject}</td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(t.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(t)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => remove(t)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <TemplateEditor
          initial={editing._id ? editing : null}
          settings={settings}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
