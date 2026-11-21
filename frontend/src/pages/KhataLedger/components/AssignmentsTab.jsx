import { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Pencil, Plus, Trash2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import KhataLedgerService from '../KhataLedgerService';
import AssignmentFormModal from './AssignmentFormModal';
import {
  KhataCard,
  KhataEmpty,
  KhataPager,
  KhataPill,
  KhataSearch,
  KhataSectionHead,
  KhataTableSkeleton,
} from './khataUi';
import { formatDate, getDriverName, getVehicleLabel, initialsOf, plural } from '../utils';
import './khataTrips.css';

const STATUS = {
  ACTIVE: ['Active', 'ok'],
  INACTIVE: ['Inactive', 'neutral'],
  ENDED: ['Ended', 'neutral'],
};

const named = (label) => (label && label !== '-' ? label : null);

/** A yes/no question about one assignment, on the shared dialog. */
function ConfirmAssignment({ target, title, children, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="khata-dialog khata-dialog--confirm">
        <div className="khata-dialog-head">
          <div>
            <DialogTitle className="khata-dialog-title">{title}</DialogTitle>
            <DialogDescription className="khata-dialog-desc">{children}</DialogDescription>
          </div>
        </div>
        <div className="khata-dialog-foot">
          <button type="button" className="khata-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`khata-btn ${danger ? 'khata-btn--danger' : 'khata-btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const AssignmentsTab = ({ vehicles = [], drivers = [] }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [endTarget, setEndTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = searchInput.trim();
      if (nextSearch !== search) {
        setSearch(nextSearch);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const data = await KhataLedgerService.getAssignmentPage(
          { page, limit: 20, includePast: true, ...(search && { search }) },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, data.meta.totalPages);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setAssignments(data.results);
        setMeta(data.meta);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err?.response?.status === 404) {
          setAssignments([]);
          setMeta({ total: 0, totalPages: 1 });
        } else {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to load assignments');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [page, search, refreshKey]);

  const refreshAssignments = () => setRefreshKey((key) => key + 1);

  const handleEnd = async () => {
    if (!endTarget) return;
    try {
      await KhataLedgerService.endAssignment(endTarget._id);
      toast.success('Assignment ended');
      setEndTarget(null);
      refreshAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to end assignment');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await KhataLedgerService.deleteAssignment(deleteTarget._id);
      toast.success('Assignment deleted');
      setDeleteTarget(null);
      refreshAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete assignment');
    }
  };

  const isOngoing = (assignment) => {
    if (!assignment.endDate) return true;
    return new Date(assignment.endDate) >= new Date();
  };

  const enrichedAssignments = assignments.map((a) => {
    const dId = a.driverId?._id || a.driverId;
    const vId = a.vehicleId?._id || a.vehicleId;
    const driver = drivers.find((d) => d._id === dId) || a.driverId;
    const vehicle = vehicles.find((v) => v._id === vId) || a.vehicleId;

    return {
      ...a,
      driverName: named(getDriverName(driver)) || a.driverName || 'Unknown driver',
      vehicleLabel: named(getVehicleLabel(vehicle)) || a.vehicleNumber || 'Unknown vehicle',
      ongoing: isOngoing(a),
    };
  });

  const openNew = () => {
    setEditingAssignment(null);
    setModalOpen(true);
  };

  const totalPages = Math.max(1, meta.totalPages);

  return (
    <>
      <KhataSectionHead
        title="Driver and vehicle assignments"
        subtitle="Which driver is on which vehicle, and for which dates."
        actions={
          <button type="button" className="khata-btn khata-btn--primary" onClick={openNew}>
            <Plus size={15} aria-hidden="true" />
            Add assignment
          </button>
        }
      />
      <div className="khata-note">
        <AlertCircle size={16} aria-hidden="true" />
        <p>
          <b>Past entries stay as they are.</b> Adding, editing or ending an assignment only changes
          who future transactions are attributed to.
        </p>
      </div>

      <KhataCard
        flush
        title={
          <>
            Assignments
            {!loading ? (
              <span className="khata-count">{plural(meta.total, 'assignment')}</span>
            ) : null}
          </>
        }
        actions={
          <KhataSearch
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search driver or vehicle"
            label="Search driver or vehicle"
          />
        }
      >
        {loading ? (
          <KhataTableSkeleton />
        ) : enrichedAssignments.length === 0 ? (
          <KhataEmpty
            icon={Calendar}
            title={search ? 'No assignments match this search' : 'No assignments yet'}
            action={
              search ? null : (
                <button type="button" className="khata-btn khata-btn--tinted" onClick={openNew}>
                  Add the first assignment
                </button>
              )
            }
          >
            {search
              ? 'Try another driver name or registration number.'
              : 'Assign a driver to a vehicle so fuel and expenses are attributed to the right person.'}
          </KhataEmpty>
        ) : (
          <Table className="khata-table">
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Effective period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="is-end">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedAssignments.map((a) => {
                // An ACTIVE row whose end date has passed is over, whatever its status says.
                const statusKey =
                  !a.ongoing && (!a.status || a.status === 'ACTIVE')
                    ? 'ENDED'
                    : a.status || 'ACTIVE';
                const [statusLabel, statusTone] = STATUS[statusKey] || [statusKey, 'neutral'];
                const who = `${a.driverName} on ${a.vehicleLabel}`;
                return (
                  <TableRow key={a._id}>
                    <TableCell>
                      <span className="khata-entity">
                        <span className="khata-avatar" aria-hidden="true">
                          {initialsOf(a.driverName)}
                        </span>
                        <span className="khata-cell-main">{a.driverName}</span>
                      </span>
                    </TableCell>
                    <TableCell className="is-code">{a.vehicleLabel}</TableCell>
                    <TableCell className="is-secondary is-date">
                      {formatDate(a.startDate)} – {a.endDate ? formatDate(a.endDate) : 'Present'}
                    </TableCell>
                    <TableCell>
                      <KhataPill tone={statusTone}>{statusLabel}</KhataPill>
                    </TableCell>
                    <TableCell className="is-secondary">
                      {a.notes ? (
                        <span className="khata-truncate">{a.notes}</span>
                      ) : (
                        <span className="khata-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="is-end">
                      <span className="khata-cell-actions">
                        {a.ongoing ? (
                          <button
                            type="button"
                            className="khata-icon-btn"
                            title="End assignment"
                            aria-label={`End assignment of ${who}`}
                            onClick={() => setEndTarget(a)}
                          >
                            <XCircle size={15} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="khata-icon-btn"
                          title="Edit"
                          aria-label={`Edit assignment of ${who}`}
                          onClick={() => {
                            setEditingAssignment(a);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="khata-icon-btn khata-icon-btn--danger"
                          title="Delete"
                          aria-label={`Delete assignment of ${who}`}
                          onClick={() => setDeleteTarget(a)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {!loading && (enrichedAssignments.length > 0 || totalPages > 1) ? (
          <nav aria-label="Assignment pagination">
            <KhataPager
              summary={plural(meta.total, 'assignment')}
              page={page}
              totalPages={totalPages}
              onPage={setPage}
              disabled={loading}
            />
          </nav>
        ) : null}
      </KhataCard>

      <AssignmentFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAssignment(null);
        }}
        onSaved={() => {
          setPage(1);
          refreshAssignments();
        }}
        editingAssignment={editingAssignment}
        vehicles={vehicles}
        drivers={drivers}
      />

      <ConfirmAssignment
        target={endTarget}
        title="End assignment"
        confirmLabel="End assignment"
        onConfirm={handleEnd}
        onCancel={() => setEndTarget(null)}
      >
        {endTarget
          ? `End ${endTarget.driverName} on ${endTarget.vehicleLabel} today? Later transactions on this vehicle will no longer be attributed to this driver.`
          : null}
      </ConfirmAssignment>

      <ConfirmAssignment
        target={deleteTarget}
        title="Delete assignment"
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        {deleteTarget
          ? `Remove the assignment of ${deleteTarget.driverName} on ${deleteTarget.vehicleLabel}? Past transactions are not changed.`
          : null}
      </ConfirmAssignment>
    </>
  );
};

export default AssignmentsTab;
