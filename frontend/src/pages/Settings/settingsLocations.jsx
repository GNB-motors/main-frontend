import { useState } from 'react';
import { toast } from 'react-toastify';
import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
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
import { getUserRole } from '../../utils/session.js';
import { Card, SectionHead, Skeleton } from './settingsAtoms';

const INITIAL_FORM = { name: '', city: '', state: '', address: '' };

/**
 * Operating locations (branches) on Settings.
 * Authorized users can view, add, edit, and delete operating locations.
 */
export const LocationsManager = ({ canManage }) => {
  const { branches, loading, refresh } = useActiveBranch();
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(null); // null | { kind: 'add' } | { kind: 'edit', branch } | { kind: 'delete', branch }
  const [formData, setFormData] = useState(INITIAL_FORM);

  const userRole = (getUserRole() || '').toUpperCase();
  const isAuthorized = canManage || ['OWNER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setFormData(INITIAL_FORM);
  };

  const openAddModal = () => {
    if (!isAuthorized) return;
    setFormData(INITIAL_FORM);
    setModal({ kind: 'add' });
  };

  const openEditModal = (branch) => {
    if (!isAuthorized) return;
    setFormData({
      name: branch.name || '',
      city: branch.city || '',
      state: branch.state || '',
      address: branch.address || '',
    });
    setModal({ kind: 'edit', branch });
  };

  const openDeleteModal = (branch) => {
    if (!isAuthorized) return;
    if (branch.isDefault) {
      toast.error('The default location cannot be deleted');
      return;
    }
    setModal({ kind: 'delete', branch });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAuthorized) {
      toast.error('You do not have permission to manage locations');
      return;
    }
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error('Location name cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        city: formData.city.trim(),
        state: formData.state.trim(),
        address: formData.address.trim(),
      };

      if (modal?.kind === 'edit') {
        await BranchService.updateBranch(modal.branch._id, payload);
        toast.success(`Location "${trimmedName}" updated successfully`);
      } else {
        await BranchService.createBranch(payload);
        toast.success(`Location "${trimmedName}" added`);
      }

      await refresh();
      closeModal();
    } catch (err) {
      const actionName = modal?.kind === 'edit' ? 'update' : 'add';
      toast.error(
        err?.response?.data?.message || err?.detail || `Could not ${actionName} location`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthorized) {
      toast.error('You do not have permission to delete locations');
      return;
    }
    const branchToDelete = modal?.branch;
    if (!branchToDelete) return;

    setSubmitting(true);
    try {
      await BranchService.deleteBranch(branchToDelete._id);
      await refresh();
      toast.success(`Location "${branchToDelete.name}" deleted successfully`);
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.detail || 'Could not delete location');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormModalOpen = modal?.kind === 'add' || modal?.kind === 'edit';
  const isEdit = modal?.kind === 'edit';

  const count = branches?.length ?? 0;

  return (
    <>
      <SectionHead
        id="stx-sec-locations"
        title="Locations"
        desc="The branches and depots you run trucks from. Each one appears in the location switcher in the top bar."
        action={
          isAuthorized ? (
            <button type="button" onClick={openAddModal} className="stx-btn stx-btn--primary">
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              Add location
            </button>
          ) : null
        }
      />

      <Card
        title="Your locations"
        aside={loading ? null : <span className="stx-count">{count}</span>}
        foot="Records you create while a location is selected belong to that location. In “All locations” they are enterprise-wide."
        flush
      >
        {loading ? (
          <Skeleton rows={3} />
        ) : count === 0 ? (
          <div className="stx-empty">
            <MapPin size={20} aria-hidden="true" />
            <p className="stx-empty-title">No locations yet</p>
            <p className="stx-empty-hint">
              {isAuthorized
                ? 'Add your first branch or depot. It will appear in the location switcher.'
                : 'Ask an owner or manager to add one.'}
            </p>
          </div>
        ) : (
          <ul className="stx-rows">
            {branches.map((b) => (
              <li key={b._id} className="stx-row">
                <span className="stx-row-icon" aria-hidden="true">
                  <MapPin size={16} />
                </span>
                <div className="stx-row-main">
                  <div className="stx-row-title">
                    <span className="stx-row-name">{b.name}</span>
                    {b.isDefault ? <span className="stx-badge">Default</span> : null}
                  </div>
                  {b.address || b.city || b.state ? (
                    <p className="stx-row-sub">
                      {[b.address, b.city, b.state].filter(Boolean).join(', ')}
                    </p>
                  ) : null}
                </div>

                {isAuthorized ? (
                  <div className="stx-row-actions">
                    <button
                      type="button"
                      onClick={() => openEditModal(b)}
                      className="stx-icon-btn"
                      title="Edit location"
                      aria-label={`Edit location ${b.name}`}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteModal(b)}
                      disabled={b.isDefault}
                      className="stx-icon-btn stx-icon-btn--danger"
                      title={b.isDefault ? 'Cannot delete default location' : 'Delete location'}
                      aria-label={`Delete location ${b.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Add / Edit Location Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md p-0">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Edit location' : 'Add location'}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? 'Update operating location details for your enterprise.'
                  : 'Create a new operating location for your enterprise.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 px-6 py-4">
              <div>
                <label
                  htmlFor="location-name-input"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Location name <span className="text-red-500">*</span>
                </label>
                <input
                  id="location-name-input"
                  name="locationName"
                  aria-label="Location name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder={isEdit ? 'e.g. Chennai Hub' : 'e.g. Chennai'}
                  maxLength={80}
                  disabled={submitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="location-city-input"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    City
                  </label>
                  <input
                    id="location-city-input"
                    name="locationCity"
                    aria-label="City"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData((f) => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Chennai"
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label
                    htmlFor="location-state-input"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    State
                  </label>
                  <input
                    id="location-state-input"
                    name="locationState"
                    aria-label="State"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData((f) => ({ ...f, state: e.target.value }))}
                    placeholder="e.g. Tamil Nadu"
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="location-address-input"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Address
                </label>
                <input
                  id="location-address-input"
                  name="locationAddress"
                  aria-label="Address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
                  placeholder="e.g. 10 Warehouse Rd"
                  disabled={submitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>
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
                disabled={submitting || !formData.name.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEdit ? null : <Plus size={15} />}
                {submitting
                  ? isEdit
                    ? 'Saving…'
                    : 'Adding…'
                  : isEdit
                    ? 'Save changes'
                    : 'Add location'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Location Confirmation Modal */}
      <Dialog open={modal?.kind === 'delete'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this location? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="rounded-lg border border-red-100 bg-red-50/70 p-3 text-sm text-slate-700">
              <span className="font-semibold text-red-700">Location:</span> {modal?.branch?.name}
              {(modal?.branch?.city || modal?.branch?.state) && (
                <span className="text-slate-500">
                  {' '}
                  ({[modal.branch.city, modal.branch.state].filter(Boolean).join(', ')})
                </span>
              )}
            </div>
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
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />
              {submitting ? 'Deleting…' : 'Delete location'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
