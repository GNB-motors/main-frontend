import { useState } from 'react';
import { toast } from 'react-toastify';
import { MapPin, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useActiveBranch } from '../../contexts/BranchContext.jsx';
import { BranchService } from '../../services/branchService';
import { SectionHeader } from './profileAtoms';

/**
 * Owners/managers can add operating locations (branches) here. A new location
 * immediately shows up in the header action-bar switcher, where you can switch
 * to it — all location-scoped screens then operate against the selected location.
 */
export const LocationsManager = ({ canManage }) => {
  const { branches, loading, refresh } = useActiveBranch();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setName('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await BranchService.createBranch({ name: trimmed });
      await refresh(); // reload the switcher + this list
      setName('');
      setModalOpen(false);
      toast.success(`Location "${trimmed}" added`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.detail || 'Could not add location');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(41,64,211,0.08)]">
      <SectionHeader icon={MapPin} title="Locations" />

      {loading ? (
        <p className="text-sm text-slate-400">Loading locations…</p>
      ) : (branches?.length ?? 0) === 0 ? (
        <p className="text-sm italic text-slate-400">
          No locations yet. Add one below — it will appear in the location switcher in the top bar.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {branches.map((b) => (
            <li
              key={b._id}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <MapPin size={13} className="text-blue-500" />
              {b.name}
              {b.isDefault && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-500">
                  default
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setName('');
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={15} />
            Add location
          </button>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        Added locations appear in the switcher in the top action bar, where you can switch between
        them. Records you create while a location is selected belong to that location; in “All
        locations” they are enterprise-wide.
      </p>

      {/* Add-location modal (same flow as the header switcher). */}
      <Dialog
        open={modalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) closeModal();
        }}
      >
        <DialogContent className="max-w-md p-0">
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Add location</DialogTitle>
              <DialogDescription>
                Create a new operating location for your enterprise.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-4">
              <label htmlFor="profile-new-location" className="mb-2 block text-sm font-medium">
                Location name
              </label>
              <input
                id="profile-new-location"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chennai"
                maxLength={80}
                autoFocus
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />
                {submitting ? 'Adding…' : 'Add location'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
