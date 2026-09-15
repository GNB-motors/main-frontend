import { useState } from 'react';
import { toast } from 'react-toastify';
import { createAccount } from '../Profile/FleetEdgeAccountService';
import { getToken } from '../../utils/session.js';

export default function AddAccountForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    externalAccountId: '',
    friendlyName: '',
    clientId: '',
    clientSecret: '',
    baseUrl: '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      await createAccount(token, {
        externalAccountId: form.externalAccountId.trim(),
        friendlyName: form.friendlyName.trim() || undefined,
        credentials: {
          clientId: form.clientId.trim(),
          clientSecret: form.clientSecret,
          baseUrl: form.baseUrl.trim(),
        },
      });
      toast.success('Account created and credentials validated');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            External Account ID *
          </label>
          <input
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            value={form.externalAccountId}
            onChange={(e) => setForm((f) => ({ ...f, externalAccountId: e.target.value }))}
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Friendly Name</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="e.g. Mumbai Fleet"
            value={form.friendlyName}
            onChange={(e) => setForm((f) => ({ ...f, friendlyName: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Client ID *</label>
          <input
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            value={form.clientId}
            onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Client Secret *</label>
          <input
            required
            type="password"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            value={form.clientSecret}
            onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Base URL *</label>
          <input
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="https://cvp.api.example.com"
            value={form.baseUrl}
            onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        Credentials are validated live against FleetEdge before saving.
      </p>
      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Validating…' : 'Add Account'}
        </button>
      </div>
    </form>
  );
}
