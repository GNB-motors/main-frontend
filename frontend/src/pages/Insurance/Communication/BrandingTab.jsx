import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import DropZone from '../../../components/DropZone/DropZone';
import { InsuranceService } from '../InsuranceService';
import SignatureEditor from './components/SignatureEditor';
import EmailPreview from './components/EmailPreview';

const fieldCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none';
const labelCls = 'mb-1 block text-xs font-semibold text-slate-600';

export default function BrandingTab() {
  const [form, setForm] = useState({ fromName: '', fromEmail: '', signatureHtml: '', logo: { url: null } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    InsuranceService.getSettings()
      .then((s) => setForm({
        fromName: s.fromName || '',
        fromEmail: s.fromEmail || '',
        signatureHtml: s.signatureHtml || '',
        logo: s.logo || { url: null },
      }))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load branding'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { logo } = await InsuranceService.uploadLogo(file);
      set('logo', logo);
      toast.success('Logo uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    try {
      await InsuranceService.deleteLogo();
      set('logo', { url: null });
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove logo');
    }
  };

  const save = async () => {
    if (form.fromEmail && !/^\S+@\S+\.\S+$/.test(form.fromEmail)) {
      toast.error('Enter a valid From email');
      return;
    }
    setSaving(true);
    try {
      await InsuranceService.saveSettings({
        fromName: form.fromName,
        fromEmail: form.fromEmail,
        signatureHtml: form.signatureHtml,
      });
      toast.success('Branding saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* form */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">Company logo</h3>
          <p className="mt-0.5 text-xs text-slate-400">Shown in the footer of every outbound email.</p>
          <div className="mt-3">
            {form.logo?.url ? (
              <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-3">
                <img src={form.logo.url} alt="Logo" className="max-h-14 w-auto object-contain" />
                <button onClick={removeLogo} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            ) : (
              <DropZone onDrop={(files) => handleLogo(files[0])} acceptedFormats={['image/*']} maxFiles={1} label={uploading ? 'Uploading…' : 'Upload company logo'} isCompact />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">Sender details</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>From Name</label>
              <input className={fieldCls} value={form.fromName} onChange={(e) => set('fromName', e.target.value)} placeholder="GNB Edge Insurance" />
            </div>
            <div>
              <label className={labelCls}>From Email</label>
              <input className={fieldCls} value={form.fromEmail} onChange={(e) => set('fromEmail', e.target.value)} placeholder="hello@company.com" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">Email signature</h3>
          <p className="mt-0.5 mb-3 text-xs text-slate-400">Appended to every email. Use “Insert field” to add personalised values.</p>
          <SignatureEditor value={form.signatureHtml} onChange={(html) => set('signatureHtml', html)} placeholder="Best regards, {{AgentName}} …" />
        </div>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save branding'}
          </button>
        </div>
      </div>

      {/* live preview */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <ImageIcon size={13} /> Live preview
        </div>
        <EmailPreview
          mode="branding"
          fromName={form.fromName}
          fromEmail={form.fromEmail}
          logoUrl={form.logo?.url}
          signatureHtml={form.signatureHtml}
        />
      </div>
    </div>
  );
}
