import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { listAccounts, updateAccount, deleteAccount } from '../Profile/FleetEdgeAccountService';
import { getToken, getUserRole } from '../../utils/session.js';
import { useConfirm } from '../../components/ui/confirmContext';
import PageShell from '../../components/ui/PageShell';
import StatusBadge from './fleetEdgeAccountsStatus';
import Modal from './fleetEdgeAccountsModal';
import AddAccountForm from './fleetEdgeAccountsAddForm';
import RenameForm from './fleetEdgeAccountsRenameForm';
import DiscoverPanel from './fleetEdgeAccountsDiscoverPanel';
import DriftTab from './fleetEdgeAccountsDrift';

export default function FleetEdgeAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts');
  // Modal is a discriminated union, never parallel booleans.
  const [modal, setModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const userRole = getUserRole() || '';
  const isOwner = ['OWNER', 'SUPER_ADMIN'].includes(userRole);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const data = await listAccounts(token);
      setAccounts(data);
    } catch {
      toast.error('Failed to load FleetEdge accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // PageShell owns its padding — drop .page-content's default padding while mounted.
  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const closeModal = () => setModal(null);

  const handleDelete = async (account) => {
    const ok = await confirm({
      title: `Delete account "${account.friendlyName || account.externalAccountId}"?`,
      body: 'Live data from this FleetEdge account stops flowing in.',
      confirmLabel: 'Delete account',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(account._id);
    try {
      const token = getToken();
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
      const token = getToken();
      await updateAccount(token, account._id, { status: newStatus });
      toast.success(`Account ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status change failed');
    }
  };

  return (
    <PageShell
      title="FleetEdge Accounts"
      subtitle="Manage the FleetEdge accounts supplying data to this organisation"
      count={activeTab === 'accounts' && !loading ? accounts.length : null}
      actions={
        isOwner ? (
          <button
            onClick={() => setModal({ kind: 'add' })}
            className="pshell-btn pshell-btn--primary flex items-center gap-2"
          >
            <Plus size={15} />
            Add PULL Account
          </button>
        ) : null
      }
      footer={
        activeTab === 'accounts' && !loading && accounts.length > 0
          ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`
          : null
      }
    >
      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {[
          ['accounts', 'Accounts'],
          ['drift', 'Drift Log'],
        ].map(([key, label]) => (
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

      {activeTab === 'accounts' &&
        (loading ? (
          <p className="py-12 text-center text-sm text-slate-400">Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-sm font-semibold text-slate-500">No FleetEdge accounts configured</p>
            <p className="mt-1 text-xs text-slate-400">
              Add a PULL account to start syncing vehicle data automatically
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account._id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${account.status === 'DISABLED' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold text-slate-800">
                        {account.friendlyName || account.externalAccountId}
                      </span>
                      <StatusBadge status={account.status} />
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        {account.source}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 font-mono">
                      {account.externalAccountId}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>
                        {account.vehicleCount} vehicle{account.vehicleCount !== 1 ? 's' : ''}
                      </span>
                      {account.lastSeenAt && (
                        <span>Last seen {new Date(account.lastSeenAt).toLocaleString()}</span>
                      )}
                      {account.status === 'AUTH_FAILED' && account.lastErrorMessage && (
                        <span className="text-red-500">
                          {account.lastErrorMessage.slice(0, 80)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => setModal({ kind: 'rename', account })}
                      title="Rename"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Pencil size={15} />
                    </button>
                    {isOwner && account.source === 'PULL' && (
                      <button
                        onClick={() => setModal({ kind: 'discover', account })}
                        title="Discover vehicles"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
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
        ))}

      {modal?.kind === 'add' && (
        <Modal title="Add PULL FleetEdge Account" onClose={closeModal}>
          <AddAccountForm
            onSuccess={() => {
              closeModal();
              load();
            }}
            onClose={closeModal}
          />
        </Modal>
      )}
      {modal?.kind === 'rename' && (
        <Modal title="Rename Account" onClose={closeModal}>
          <RenameForm
            account={modal.account}
            onSuccess={() => {
              closeModal();
              load();
            }}
            onClose={closeModal}
          />
        </Modal>
      )}
      {modal?.kind === 'discover' && (
        <Modal
          title={`Discover vehicles — ${modal.account.friendlyName || modal.account.externalAccountId}`}
          onClose={closeModal}
        >
          <DiscoverPanel account={modal.account} onClose={closeModal} />
        </Modal>
      )}
    </PageShell>
  );
}
