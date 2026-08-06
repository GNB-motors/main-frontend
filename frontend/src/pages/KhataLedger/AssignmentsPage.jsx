import React, { useState, useEffect, useCallback } from 'react';
import { CalendarRange, Edit2, Info, Link2, Plus, Trash2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import TableShimmer from '@/components/ui/TableShimmer';
import TripService from '../Trip/services/TripService';
import KhataLedgerService from './KhataLedgerService';
import LedgerPageHeader from './components/LedgerPageHeader';
import StatRow from './components/StatRow';
import FilterBar, { FilterSelect } from './components/FilterBar';
import PaginationFooter from './components/PaginationFooter';
import EmptyState from './components/EmptyState';
import ConfirmDialog from './components/ConfirmDialog';
import AssignmentFormModal from './components/AssignmentFormModal';
import {
  ASSIGNMENT_STATUS_STYLES,
  formatDate,
  formatNumber,
  getDriverName,
  getVehicleLabel,
} from './utils';

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [includePast, setIncludePast] = useState('');

  const [options, setOptions] = useState({ vehicles: [], drivers: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [endTarget, setEndTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          TripService.getVehicles({ limit: 200 }),
          TripService.getDrivers({ limit: 200 }),
        ]);
        setOptions({
          vehicles: vRes?.data || vRes?.results || vRes || [],
          drivers: dRes?.data || dRes?.results || dRes || [],
        });
      } catch {
        // Non-critical: the table still renders from populated refs.
      }
    };
    loadOptions();
  }, []);

  const fetchAssignments = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        // This endpoint has no text search — it filters by ids, so the UI offers
        // exactly that rather than a search box that would 400 on every keystroke.
        const params = { page, limit: 20 };
        if (driverId) params.driverId = driverId;
        if (vehicleId) params.vehicleId = vehicleId;
        if (includePast) params.includePast = true;

        const { results, meta: m } = await KhataLedgerService.getAssignments(params);
        setAssignments(results);
        setMeta({ page: m.page || 1, totalPages: m.totalPages || 1, total: m.total || 0 });
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Could not load assignments');
      } finally {
        setLoading(false);
      }
    },
    [driverId, vehicleId, includePast],
  );

  useEffect(() => {
    fetchAssignments(1);
  }, [fetchAssignments]);

  const handleEnd = async () => {
    try {
      await KhataLedgerService.endAssignment(endTarget._id);
      toast.success('Assignment ended');
      setEndTarget(null);
      fetchAssignments(meta.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not end that assignment');
    }
  };

  const handleDelete = async () => {
    try {
      await KhataLedgerService.deleteAssignment(deleteTarget._id);
      toast.success('Assignment deleted');
      setDeleteTarget(null);
      fetchAssignments(meta.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not delete that assignment');
    }
  };

  const rows = assignments.map((a) => ({
    ...a,
    driverName: getDriverName(a.driverId),
    vehicleLabel: getVehicleLabel(a.vehicleId),
    ongoing: !a.endDate || new Date(a.endDate) >= new Date(),
  }));

  const ongoingCount = rows.filter((r) => r.ongoing).length;
  const clearAll = () => {
    setDriverId('');
    setVehicleId('');
    setIncludePast('');
  };

  const activeFilters = [
    driverId && {
      key: 'driver',
      label: `Driver: ${getDriverName(options.drivers.find((d) => d._id === driverId))}`,
      onClear: () => setDriverId(''),
    },
    vehicleId && {
      key: 'vehicle',
      label: `Truck: ${getVehicleLabel(options.vehicles.find((v) => v._id === vehicleId))}`,
      onClear: () => setVehicleId(''),
    },
    includePast && { key: 'past', label: 'Including past', onClear: () => setIncludePast('') },
  ].filter(Boolean);

  const stats = [
    { label: 'Assignments shown', value: formatNumber(meta.total), context: includePast ? 'Including past' : 'Current and upcoming', accent: true },
    { label: 'Ongoing', value: formatNumber(ongoingCount), context: 'On this page' },
    { label: 'Trucks covered', value: formatNumber(new Set(rows.map((r) => r.vehicleLabel)).size), context: 'On this page' },
    { label: 'Drivers covered', value: formatNumber(new Set(rows.map((r) => r.driverName)).size), context: 'On this page' },
  ];

  return (
    <div className="space-y-5 p-1">
      <LedgerPageHeader
        title="Assignments"
        icon={Link2}
        description="Which driver is on which truck, and for what period."
      >
        <Button
          size="lg"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          style={{ backgroundColor: 'var(--primary-color, #4f46e5)', color: '#fff' }}
        >
          <Plus size={16} />
          Add Assignment
        </Button>
      </LedgerPageHeader>

      <StatRow items={stats} loading={loading} />

      <Card className="card-static border-l-4 border-l-amber-400">
        <CardContent className="flex items-start gap-3 p-4">
          <Info size={17} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-foreground">Past entries never change</p>
            <p className="text-sm text-muted-foreground">
              Adding, editing or ending an assignment only affects transactions recorded from now
              on. Entries already in the khata keep the driver and truck they were filed against.
            </p>
          </div>
        </CardContent>
      </Card>

      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        activeFilters={activeFilters}
        onClearAll={activeFilters.length ? clearAll : undefined}
        hideSearch
      >
        <FilterSelect
          label="Driver"
          value={driverId}
          onChange={setDriverId}
          allLabel="All drivers"
          options={options.drivers.map((d) => ({ value: d._id, label: getDriverName(d) }))}
        />
        <FilterSelect
          label="Truck"
          value={vehicleId}
          onChange={setVehicleId}
          allLabel="All trucks"
          options={options.vehicles.map((v) => ({ value: v._id, label: getVehicleLabel(v) }))}
        />
        <FilterSelect
          label="Period"
          value={includePast}
          onChange={setIncludePast}
          allLabel="Current and upcoming"
          options={[{ value: 'past', label: 'Include past assignments' }]}
        />
      </FilterBar>

      <Card className="card-static overflow-hidden p-0">
        <CardContent className="p-0">
          {loading ? (
            <TableShimmer columns={6} rows={6} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title={activeFilters.length ? 'No assignments match these filters' : 'No assignments yet'}
              hint={
                activeFilters.length
                  ? 'Clear a filter, or include past assignments to see ended ones.'
                  : 'Link a driver to a truck so fuel and expenses get attributed to both automatically.'
              }
              action={
                activeFilters.length ? (
                  <Button variant="outline" size="lg" onClick={clearAll}>
                    Clear all filters
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => {
                      setEditing(null);
                      setModalOpen(true);
                    }}
                    style={{ backgroundColor: 'var(--primary-color, #4f46e5)', color: '#fff' }}
                  >
                    <Plus size={16} />
                    Add Assignment
                  </Button>
                )
              }
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell className="whitespace-nowrap font-medium">{a.driverName}</TableCell>
                      <TableCell>
                        <span className="reg-plate">{a.vehicleLabel}</span>
                      </TableCell>
                      <TableCell className="num whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(a.startDate)} → {a.endDate ? formatDate(a.endDate) : 'ongoing'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                            ASSIGNMENT_STATUS_STYLES[a.status] || ASSIGNMENT_STATUS_STYLES.INACTIVE
                          }`}
                        >
                          {a.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm text-muted-foreground">{a.notes || '—'}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditing(a);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit assignment for ${a.driverName}`}
                          >
                            <Edit2 size={14} />
                          </Button>
                          {a.ongoing && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEndTarget(a)}
                              aria-label={`End assignment for ${a.driverName}`}
                              className="text-muted-foreground hover:bg-amber-50 hover:text-amber-700"
                            >
                              <XCircle size={14} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget(a)}
                            aria-label={`Delete assignment for ${a.driverName}`}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <PaginationFooter
            page={meta.page}
            totalPages={meta.totalPages}
            totalResults={meta.total}
            unit="assignments"
            onPageChange={fetchAssignments}
          />
        </CardContent>
      </Card>

      <AssignmentFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={() => fetchAssignments(meta.page)}
        editingAssignment={editing}
        vehicles={options.vehicles}
        drivers={options.drivers}
      />

      <ConfirmDialog
        open={!!endTarget}
        onClose={() => setEndTarget(null)}
        onConfirm={handleEnd}
        tone="warning"
        title="End this assignment?"
        description={
          endTarget
            ? `${endTarget.driverName} will stop being linked to ${endTarget.vehicleLabel} as of today. Past entries are unaffected.`
            : ''
        }
        confirmLabel="End assignment"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this assignment?"
        description={
          deleteTarget
            ? `The link between ${deleteTarget.driverName} and ${deleteTarget.vehicleLabel} will be removed. Past entries keep their attribution.`
            : ''
        }
        confirmLabel="Delete assignment"
      />
    </div>
  );
};

export default AssignmentsPage;
