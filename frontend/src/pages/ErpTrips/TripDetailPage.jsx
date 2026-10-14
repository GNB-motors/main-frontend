import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { toast } from 'react-toastify';
import TripDashboardService from './TripDashboardService';
import '../../styles/erp.css';
import './TripDetail.css';
import AdvanceDrawer from '../../components/Erp/Drawers/AdvanceDrawer';
import ConsignmentDrawer from '../../components/Erp/Drawers/ConsignmentDrawer';
import TripStartDrawer from './TripStartDrawer';
import TripCloseDrawer from '../../components/Erp/Drawers/TripCloseDrawer';
import PodDrawer from '../../components/Erp/Drawers/PodDrawer';
import UnloadingDrawer from '../../components/Erp/Drawers/UnloadingDrawer';
import SaleBillDrawer from '../../components/Erp/Drawers/SaleBillDrawer';
import ReceiptDrawer from '../../components/Erp/Drawers/ReceiptDrawer';
import CurrentActionCard from '../../components/Erp/Trip/CurrentActionCard';
import TripFinancials from '../../components/Erp/Trip/TripFinancials';
import { resolveNextAction } from '../../components/Erp/Trip/tripFinance';
import { dropPrompt } from './gpsDrop';
import buildStages from './detail/buildStages';
import TripHeader from './detail/TripHeader';
import TripRail from './detail/TripRail';
import TripStages from './detail/TripStages';
import TimelinePanel from './detail/TimelinePanel';

const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  /**
   * Which finished stage the user has opened. Completed and locked stages
   * collapse to one line; only the stage you can act on is expanded, so the
   * current step is on screen without scrolling past 200px cards for work
   * already done and work that cannot start.
   */
  const [openStageId, setOpenStageId] = useState(null);

  /**
   * Prefer real history so the user lands back where they came from — the
   * pipeline, ERP Home's pending queue, or a search. On a cold load (pasted
   * link, new tab) there is nothing to go back to, so fall back to the list.
   */
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/erp/pipeline');
  };

  const [data, setData] = useState(null);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDrawer, setActiveDrawer] = useState(null);

  const fetchTrip = useCallback(async () => {
    try {
      // Finance is a best-effort read: a failure there must never blank the
      // operational trip view, so it resolves to null rather than throwing.
      const [result, fin] = await Promise.all([
        TripDashboardService.getTripById(tripId),
        TripDashboardService.getTripFinance(tripId).catch(() => null),
      ]);
      setData(result);
      setFinance(fin);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch trip details');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const [recomputing, setRecomputing] = useState(false);
  const handleRecomputeTelematics = useCallback(async () => {
    setRecomputing(true);
    try {
      await TripDashboardService.recomputeTelematics(tripId);
      toast.success('Telematics recomputed');
      await fetchTrip();
    } catch (error) {
      toast.error(error.message || 'Failed to recompute telematics');
    } finally {
      setRecomputing(false);
    }
  }, [tripId, fetchTrip]);

  useEffect(() => {
    const drawerParam = searchParams.get('drawer');
    if (drawerParam) setActiveDrawer(drawerParam.toLowerCase());
  }, [searchParams]);

  const openDrawer = (name) => {
    setActiveDrawer(name);
    setSearchParams({ drawer: name }, { replace: true });
  };

  const closeDrawer = () => {
    setActiveDrawer(null);
    setSearchParams({}, { replace: true });
  };

  const stages = useMemo(() => buildStages(data), [data]);

  // Current = first stage that is not done. Everything after it is pending.
  const currentIdx = useMemo(() => {
    const i = stages.findIndex((s) => !s.done);
    return i === -1 ? stages.length : i;
  }, [stages]);

  /**
   * The single next step for the hero card — the operational ladder while the
   * trip is running, then the finance ladder (billing → receipt → vendor
   * payment) once the goods are unloaded, with the blocked reason surfaced.
   */
  const nextAction = useMemo(() => {
    if (!data) return null;
    const ops = {
      hasCn: !!data.consignment || data.cnGate === 'UPDATED' || data.loadedQty != null,
      closed: !!data.tripClosedAt || data.state === 'TRIP_CLOSED',
      hasPod: !!data.pod || data.state === 'POD_RECEIVED',
      hasUnloading: !!data.unloading,
    };
    return resolveNextAction(ops, finance);
  }, [data, finance]);

  /** The single line a collapsed stage shows instead of its full card. */
  const summaryOf = (stage) => {
    if (stage.render === 'advanceCn') {
      return stage.hasCn ? 'CN updated' : 'No consignment note yet';
    }
    const facts = (stage.facts || []).filter((f) => f.value);
    if (facts.length)
      return facts
        .slice(0, 3)
        .map((f) => f.value)
        .join(' · ');
    return null;
  };

  const statusOf = (stage, idx) => {
    if (stage.done) return 'done';
    if (idx === currentIdx) return 'current';
    return stage.available ? 'current' : 'blocked';
  };

  if (loading) {
    return (
      <div className="erp-page">
        <div className="erp-muted">Loading trip…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="erp-page">
        <div className="erp-muted">Trip not found</div>
      </div>
    );
  }

  const suggestion = dropPrompt(data);

  return (
    <div className="erp-page trip360">
      {/* ── Identity ── */}
      <TripHeader goBack={goBack} data={data} />

      {/* ── Stepper ── */}
      <div className="trip360-stepper">
        {stages.map((s, idx) => {
          const st = statusOf(s, idx);
          const Icon = s.icon;
          return (
            <div key={s.id} className={`trip360-step ${st}`}>
              <span className="trip360-step-dot">
                {st === 'done' ? <Check size={14} strokeWidth={3} /> : <Icon size={13} />}
              </span>
              <span className="trip360-step-label">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── What to do next ── */}
      <CurrentActionCard action={nextAction} onDrawer={openDrawer} />

      {/* ── Master / detail ── */}
      <div className="trip360-body">
        {/* Master rail */}
        <TripRail
          data={data}
          handleRecomputeTelematics={handleRecomputeTelematics}
          recomputing={recomputing}
        />

        {/* Detail — the operations lifecycle */}
        <TripStages
          suggestion={suggestion}
          openDrawer={openDrawer}
          stages={stages}
          statusOf={statusOf}
          openStageId={openStageId}
          setOpenStageId={setOpenStageId}
          summaryOf={summaryOf}
          data={data}
        />
      </div>

      {/* ── Financials — the receivable / payable / margin, state-aware ── */}
      <TripFinancials
        finance={finance}
        unloadingDone={!!data.unloading}
        onRecordReceipt={() => openDrawer('receipt')}
      />

      {/* ── Activity / audit trail ── */}
      <TimelinePanel events={data.events} />

      {/* ── Drawers ── */}
      <AdvanceDrawer
        isOpen={activeDrawer === 'advance'}
        onClose={closeDrawer}
        initialTripId={data._id}
        mode="RAISE"
        onSuccess={fetchTrip}
      />
      <TripStartDrawer
        isOpen={activeDrawer === 'start'}
        onClose={closeDrawer}
        trip={data}
        onSuccess={fetchTrip}
      />
      <ConsignmentDrawer
        isOpen={activeDrawer === 'cn'}
        onClose={closeDrawer}
        trip={data}
        onSuccess={fetchTrip}
      />
      <TripCloseDrawer
        isOpen={activeDrawer === 'close'}
        onClose={closeDrawer}
        trip={data}
        onSuccess={fetchTrip}
      />
      <PodDrawer
        isOpen={activeDrawer === 'pod'}
        onClose={closeDrawer}
        trip={data}
        onSuccess={fetchTrip}
      />
      <UnloadingDrawer
        isOpen={activeDrawer === 'unloading'}
        onClose={closeDrawer}
        trip={data}
        onSuccess={fetchTrip}
      />
      <SaleBillDrawer
        isOpen={activeDrawer === 'salebill'}
        onClose={closeDrawer}
        unloading={
          data.unloading
            ? { ...data.unloading, tripNumber: data.tripNumber, partyId: data.partyId }
            : null
        }
        onSuccess={fetchTrip}
      />
      <ReceiptDrawer
        isOpen={activeDrawer === 'receipt'}
        onClose={closeDrawer}
        bill={data.saleBill}
        party={data.partyId}
        onSuccess={fetchTrip}
      />
    </div>
  );
};

export default TripDetailPage;
