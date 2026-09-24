import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Route as RouteIcon, Truck, Home, AlertTriangle, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import VehicleTourService from '../../services/VehicleTourService.js';
import VehicleTourDetail from './VehicleTourDetail.jsx';
import {
  CLOSE_KIND_LABEL,
  SOURCE_LABEL,
  durationHours,
  formatDuration,
  filterTours,
} from './tourLogic.js';
import './VehicleTours.css';

const fmt = (d) => (d ? dayjs(d).format('DD MMM, HH:mm') : '—');

/**
 * Vehicle Tours — the "main trip": one warehouse-to-warehouse cycle per row.
 *
 * This is deliberately a different thing from the ERP trip list. A truck that runs
 * Kolkata → Odisha → Chhattisgarh → Gujarat → Kolkata closes two or three ERP trips
 * along the way, but it is ONE cycle. The operator closing their trip does not close
 * the cycle — only coming back to a yard does.
 */
export default function VehicleToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { tours: rows } = await VehicleTourService.list({ limit: 200 });
      setTours(rows);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load tours');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const byText = filterTours(tours, query);
    if (!statusFilter.length) return byText;
    return byText.filter((t) => statusFilter.includes(t.status));
  }, [tours, query, statusFilter]);

  const openCount = useMemo(() => tours.filter((t) => t.status === 'OPEN').length, [tours]);

  const openDetail = async (id) => {
    try {
      setSelected(await VehicleTourService.get(id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load that cycle');
    }
  };

  const handleRollup = async () => {
    setBusy(true);
    try {
      await VehicleTourService.rollup(selected._id);
      toast.success('Recomputed');
      await openDetail(selected._id);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not recompute');
    } finally {
      setBusy(false);
    }
  };

  const handleShiftHome = async () => {
    setBusy(true);
    try {
      await VehicleTourService.shiftHome(selected._id);
      toast.success('Home warehouse updated — later cycles measure from this yard');
      await openDetail(selected._id);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not shift home warehouse');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = (value) =>
    setStatusFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  return (
    <PageShell
      title="Vehicle Tours"
      count={tours.length}
      subtitle="One warehouse-to-warehouse cycle per row. ERP trips that ran inside a cycle are its side trips."
      actions={
        <button type="button" className="pshell-btn" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'vtour-spin' : ''} /> Refresh
        </button>
      }
      filters={
        <FilterBar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search registration or status…"
          chips={[
            { key: 'OPEN', label: 'Still out', count: openCount },
            { key: 'CLOSED', label: 'Completed', count: tours.length - openCount },
          ]}
          selectedKeys={statusFilter}
          onToggleChip={toggleStatus}
          activeCount={statusFilter.length}
          onClear={() => setStatusFilter([])}
        />
      }
      footer={`Showing ${visible.length} of ${tours.length} cycles`}
    >
      {loading && !tours.length ? (
        <p className="vtour-empty">Loading…</p>
      ) : !visible.length ? (
        <div className="vtour-empty-state">
          <RouteIcon size={28} />
          <h3>No cycles yet</h3>
          <p>
            A cycle appears once a vehicle leaves a warehouse geofence. Add warehouses and assign
            vehicles to them first.
          </p>
        </div>
      ) : (
        <div className="vtour-table-wrap">
          <table className="vtour-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Left</th>
                <th>Returned</th>
                <th>Duration</th>
                <th>Distance</th>
                <th>Side trips</th>
                <th>Ended</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => {
                const isOpen = t.status === 'OPEN';
                const kind = t.closeKind ? CLOSE_KIND_LABEL[t.closeKind] : null;
                return (
                  <tr key={t._id} onClick={() => openDetail(t._id)} className="vtour-row">
                    <td>
                      <span className="vtour-reg">
                        <Truck size={13} /> {t.registrationNumber}
                      </span>
                    </td>
                    <td>{fmt(t.startedAt)}</td>
                    <td>{isOpen ? <em className="vtour-out">still out</em> : fmt(t.endedAt)}</td>
                    <td className="num">{formatDuration(durationHours(t.startedAt, t.endedAt))}</td>
                    <td className="num">
                      {t.distanceKm != null ? (
                        <>
                          {t.distanceKm} km
                          <em className="vtour-src">{SOURCE_LABEL[t.distanceSource] || ''}</em>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="num">{t.sideTripCount ?? 0}</td>
                    <td>
                      {isOpen ? (
                        <span className="vtour-pill vtour-pill--open">Running</span>
                      ) : (
                        <span className={`vtour-pill vtour-pill--${kind?.tone || 'ok'}`}>
                          {kind?.tone === 'ok' ? <Home size={11} /> : <AlertTriangle size={11} />}
                          {kind?.text || t.closeKind}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <VehicleTourDetail
        tour={selected}
        busy={busy}
        onClose={() => setSelected(null)}
        onRollup={handleRollup}
        onShiftHome={handleShiftHome}
      />
    </PageShell>
  );
}
