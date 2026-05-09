import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, RefreshCw, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  discoverVehicles,
  assignVehicles,
  getDrift,
} from '../Profile/FleetEdgeAccountService';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  DISABLED: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  AUTH_FAILED: 'bg-red-50 text-red-600 ring-1 ring-red-200',
};

const STATUS_ICONS = {
  ACTIVE: <CheckCircle size={12} />,
  DISABLED: <XCircle size={12} />,
  AUTH_FAILED: <AlertTriangle size={12} />,
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] || STATUS_STYLES.DISABLED}`}>
      {STATUS_ICONS[status]}
      {status}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function AddAccountForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({ externalAccountId: '', friendlyName: '', clientId: '', clientSecret: '', baseUrl: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
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
          <label className="mb-1 block text-xs font-semibold text-slate-600">External Account ID *</label>
          <input required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" value={form.externalAccountId} onChange={e => setForm(f => ({ ...f, externalAccountId: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Friendly Name</label>
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" placeholder="e.g. Mumbai Fleet" value={form.friendlyName} onChange={e => setForm(f => ({ ...f, friendlyName: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Client ID *</label>
          <input required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Client Secret *</label>
          <input required type="password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" value={form.clientSecret} onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Base URL *</label>
          <input required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" placeholder="https://cvp.api.example.com" value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} />
        </div>
      </div>
      <p className="text-[11px] text-slate-400">Credentials are validated live against FleetEdge before saving.</p>
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Validating…' : 'Add Account'}
        </button>
      </div>
    </form>
  );
}

function RenameForm({ account, onSuccess, onClose }) {
  const [name, setName] = useState(account.friendlyName || '');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
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
        <input required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function DiscoverPanel({ account, onClose }) {
  const [candidates, setCandidates] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const discover = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const list = await discoverVehicles(token, account._id);
      setCandidates(list);
      setSelected([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Discover failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { discover(); }, []);

  const toggle = (reg) => setSelected(s => s.includes(reg) ? s.filter(r => r !== reg) : [...s, reg]);

  const assign = async () => {
    if (!selected.length) return;
    setAssigning(true);
    try {
      const token = localStorage.getItem('authToken');
      // For /assign we need vehicleIds, but candidates are registrations.
      // Use a note to operator: they'll need to map regs to vehicle IDs.
      // For now, surface the list — OWNER can confirm via the vehicles page.
      toast.info(`Select vehicles on the Vehicles page and use reassign to tag them to this account. (${selected.length} registrations copied to clipboard)`);
      navigator.clipboard?.writeText(selected.join(', '));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Vehicles found in FleetEdge for this account that are not yet tagged in this org:</p>
      {loading && <p className="text-sm text-slate-400">Fetching from FleetEdge…</p>}
      {candidates !== null && !loading && (
        candidates.length === 0
          ? <p className="text-sm text-slate-400">All vehicles are already tagged.</p>
          : (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              {candidates.map(reg => (
                <label key={reg} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-2.5 hover:bg-slate-50">
                  <input type="checkbox" checked={selected.includes(reg)} onChange={() => toggle(reg)} className="h-4 w-4 rounded" />
                  <span className="text-sm font-mono text-slate-700">{reg}</span>
                </label>
              ))}
            </div>
          )
      )}
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
        {candidates?.length > 0 && (
          <button onClick={assign} disabled={!selected.length || assigning} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            Copy selected regs
          </button>
        )}
      </div>
    </div>
  );
}

function DriftTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    getDrift(token).then(d => setRows(d.drift || [])).catch(() => toast.error('Failed to load drift log')).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-8 text-center text-sm text-slate-400">Loading…</p>;
  if (!rows.length) return <p className="py-8 text-center text-sm text-slate-400">No mismatches detected.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Vehicle</th>
            <th className="px-4 py-3 text-left">From Account</th>
            <th className="px-4 py-3 text-left">Arriving Account</th>
            <th className="px-4 py-3 text-left">Detected At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(row => (
            <tr key={row._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.vehicleId?.registrationNumber || row.vehicleId?.fleetEdgeRegistration || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{row.fromAccount?.friendlyName || row.fromAccount?.externalAccountId || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{row.toAccount?.friendlyName || row.toAccount?.externalAccountId || '—'}</td>
              <td className="px-4 py-3 text-slate-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FleetEdgeAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts');
  const [showAdd, setShowAdd] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [discovering, setDiscovering] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const userRole = localStorage.getItem('userRole') || '';
  const isOwner = ['OWNER', 'SUPER_ADMIN'].includes(userRole);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const data = await listAccounts(token);
      setAccounts(data);
    } catch (err) {
      toast.error('Failed to load FleetEdge accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (account) => {
    if (!window.confirm(`Delete account "${account.friendlyName || account.externalAccountId}"?`)) return;
    setDeletingId(account._id);
    try {
      const token = localStorage.getItem('authToken');
      const res = await deleteAccount(token, account._id);
      toast.success(res.message || 'Account removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (account) => {
    const newStatus = account.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const token = localStorage.getItem('authToken');
      await updateAccount(token, account._id, { status: newStatus });
      toast.success(`Account ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status change failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">FleetEdge Accounts</h1>
            <p className="mt-0.5 text-sm text-slate-500">Manage the FleetEdge accounts supplying data to this organisation</p>
          </div>
          {isOwner && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              <Plus size={15} />
              Add PULL Account
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          {[['accounts', 'Accounts'], ['drift', 'Drift Log']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${activeTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'drift' && <DriftTab />}

        {activeTab === 'accounts' && (
          loading ? (
            <p className="py-12 text-center text-sm text-slate-400">Loading…</p>
          ) : accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <p className="text-sm font-semibold text-slate-500">No FleetEdge accounts configured</p>
              <p className="mt-1 text-xs text-slate-400">Add a PULL account to start syncing vehicle data automatically</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map(account => (
                <div key={account._id} className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${account.status === 'DISABLED' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">{account.friendlyName || account.externalAccountId}</span>
                        <StatusBadge status={account.status} />
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{account.source}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 font-mono">{account.externalAccountId}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>{account.vehicleCount} vehicle{account.vehicleCount !== 1 ? 's' : ''}</span>
                        {account.lastSeenAt && <span>Last seen {new Date(account.lastSeenAt).toLocaleString()}</span>}
                        {account.status === 'AUTH_FAILED' && account.lastErrorMessage && (
                          <span className="text-red-500">{account.lastErrorMessage.slice(0, 80)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => setRenaming(account)} title="Rename" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Pencil size={15} />
                      </button>
                      {isOwner && account.source === 'PULL' && (
                        <button onClick={() => setDiscovering(account)} title="Discover vehicles" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                          <RefreshCw size={15} />
                        </button>
                      )}
                      {isOwner && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(account)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${account.status === 'ACTIVE' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                          >
                            {account.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDelete(account)}
                            disabled={deletingId === account._id}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {showAdd && (
        <Modal title="Add PULL FleetEdge Account" onClose={() => setShowAdd(false)}>
          <AddAccountForm onSuccess={() => { setShowAdd(false); load(); }} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {renaming && (
        <Modal title="Rename Account" onClose={() => setRenaming(null)}>
          <RenameForm account={renaming} onSuccess={() => { setRenaming(null); load(); }} onClose={() => setRenaming(null)} />
        </Modal>
      )}
      {discovering && (
        <Modal title={`Discover vehicles — ${discovering.friendlyName || discovering.externalAccountId}`} onClose={() => setDiscovering(null)}>
          <DiscoverPanel account={discovering} onClose={() => setDiscovering(null)} />
        </Modal>
      )}
    </div>
  );
}
