import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, AlertCircle, Calendar, User, Truck, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import KhataLedgerService from '../KhataLedgerService';
import AssignmentFormModal from './AssignmentFormModal';
import { formatDate, getDriverName, getVehicleLabel } from '../utils';

const STATUS_COLORS = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  ENDED: 'bg-amber-100 text-amber-700',
};

const AssignmentsTab = ({ vehicles = [], drivers = [] }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [endTarget, setEndTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const data = await KhataLedgerService.getAssignments(params);
      setAssignments(data.results || data.items || data || []);
    } catch (err) {
      if (err?.response?.status === 404) {
        setAssignments([]);
      } else {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to load assignments');
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleEnd = async () => {
    if (!endTarget) return;
    try {
      await KhataLedgerService.endAssignment(endTarget._id);
      toast.success('Assignment ended');
      setEndTarget(null);
      fetchAssignments();
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
      fetchAssignments();
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
      driverName: getDriverName(driver) || a.driverName || 'Unknown',
      vehicleLabel: getVehicleLabel(vehicle) || a.vehicleNumber || 'Unknown',
      ongoing: isOngoing(a),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Driver-Truck Assignments</h2>
          <p className="text-sm text-muted-foreground">Manage which driver is assigned to which truck over time</p>
        </div>
        <button
          onClick={() => {
            setEditingAssignment(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: 'var(--primary-color, #4f46e5)' }}
        >
          <Plus size={18} />
          Add Assignment
        </button>
      </div>

      <Card className="border-l-4 border-l-amber-400">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle size={18} className="mt-0.5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-foreground">Historical entries stay unchanged</p>
            <p className="text-sm text-muted-foreground">
              Creating, editing, or ending an assignment only affects future transactions. Past ledger entries keep their original driver/vehicle attribution.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1" style={{ minWidth: 200 }}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none"
                placeholder="Search driver or vehicle..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : enrichedAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Calendar size={40} className="opacity-30" />
              <p className="text-sm">No assignments found</p>
              <button
                onClick={() => {
                  setEditingAssignment(null);
                  setModalOpen(true);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--primary-color, #4f46e5)' }}
              >
                Add your first assignment
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Effective Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedAssignments.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted-foreground" />
                        <span className="font-medium">{a.driverName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-muted-foreground" />
                        <span>{a.vehicleLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {formatDate(a.startDate)} — {a.endDate ? formatDate(a.endDate) : 'Present'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[a.status] || STATUS_COLORS.ACTIVE}`}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate text-sm text-muted-foreground">{a.notes || '-'}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingAssignment(a);
                            setModalOpen(true);
                          }}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        {a.ongoing && (
                          <button
                            onClick={() => setEndTarget(a)}
                            className="rounded p-1.5 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                            title="End assignment"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AssignmentFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAssignment(null);
        }}
        onSaved={fetchAssignments}
        editingAssignment={editingAssignment}
        vehicles={vehicles}
        drivers={drivers}
      />

      {endTarget && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setEndTarget(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">End Assignment</h3>
            <p className="mt-2 text-sm text-gray-600">
              End the assignment for <strong>{endTarget.driverName}</strong> on <strong>{endTarget.vehicleLabel}</strong>? This will set the effective end date to today.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setEndTarget(null)} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleEnd}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                End Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete Assignment</h3>
            <p className="mt-2 text-sm text-gray-600">
              Remove the assignment for <strong>{deleteTarget.driverName}</strong> on <strong>{deleteTarget.vehicleLabel}</strong>? Historical transactions will not be affected.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsTab;
