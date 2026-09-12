import { useState } from 'react';
import { toast } from 'react-toastify';
import { updateAccount } from '../Profile/FleetEdgeAccountService';
import { getToken } from '../../utils/session.js';

export default function RenameForm({ account, onSuccess, onClose }) {
  const [name, setName] = useState(account.friendlyName || '');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      await updateAccount(token, account._id, { friendlyName: name.trim() });
      toast.success('Name updated');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Friendly Name</label>
        <input
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3">
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
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
