import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/axiosConfig';
import PageHeader from '../../components/Erp/PageHeader';
import StatusBadge from '../../components/Erp/StatusBadge';
import ErpTable from '../../components/Erp/ErpTable';
import EmptyState from '../../components/Erp/EmptyState';
import { accountPathFor, documentPathFor } from '../ErpAccounts/documentRoutes';
import { inr, num, pct } from '../../utils/formatMoney';
import { formatDateIST } from '../../utils/dateUtils';
import '../../styles/erp.css';

/**
 * Delivery Order 360 — everything hanging off one order.
 *
 * The DO is the commercial container: one order becomes many placements, each
 * a trip, each a CN, and eventually bills and cash. Previously you could see
 * the order, or the trips, or the bills — never the whole thing in one place.
 *
 * Read-only view over GET /erp/finance-hub/delivery-order/:doId/overview.
 */
const DeliveryOrderDetailPage = () => {
  const { doId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/erp/finance-hub/delivery-order/${doId}/overview`);
      setData(res.data?.data || null);
      setError(null);
    } catch (err) {
      setError(err);
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message || 'Failed to load delivery order');
      }
    } finally {
      setLoading(false);
    }
  }, [doId]);

  useEffect(() => { load(); }, [load]);

  const crumbs = [
    { label: 'ERP', to: '/erp' },
    { label: 'Pipeline', to: '/erp/pipeline?tab=dos' },
    { label: data?.order?.doNumber || 'Delivery Order' },
  ];

  if (loading) {
    return (
      <div className="erp-page">
        <PageHeader title="Loading delivery order…" breadcrumbs={crumbs} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="erp-page">
        <PageHeader title="Delivery order not found" breadcrumbs={crumbs} />
        <div className="erp-card">
          <EmptyState
            icon={Package}
            text="We couldn't find that delivery order"
            cta={<button type="button" className="erp-btn" onClick={() => navigate(-1)}>Go back</button>}
          />
        </div>
      </div>
    );
  }

  const {
    order, sourceCall, progress, money, counts, trips,
  } = data;
  const party = order.partyId;
  const partyLink = accountPathFor('PARTY', party?._id);

  const tripColumns = [
    {
      header: 'Trip',
      render: (t) => <Link to={`/erp/trips/${t.tripId}`}>{t.tripNumber}</Link>,
    },
    { header: 'Date', render: (t) => formatDateIST(t.tripDate) },
    { header: 'Stage', render: (t) => <StatusBadge status={t.state} /> },
    {
      header: 'Vehicle',
      render: (t) => (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {t.vehicleNumber || '—'}
          <span className="erp-muted" style={{ fontSize: 11 }}>{t.vehicleType}</span>
        </span>
      ),
    },
    { header: 'CN', render: (t) => t.cnNumber || <span className="erp-muted">—</span> },
    {
      header: 'Qty',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (t) => (
        <span className="erp-numeric">
          {t.unloadedQty != null
            ? `${t.loadedQty ?? t.plannedQty} → ${t.unloadedQty}`
            : (t.loadedQty ?? t.plannedQty ?? '—')}
          {t.shortageQty > 0 && (
            <span style={{ color: '#b91c1c' }}> (−{t.shortageQty})</span>
          )}
        </span>
      ),
    },
    {
      header: 'Net',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (t) => (
        <span className="erp-numeric">
          {t.netReceivable != null ? inr(t.netReceivable) : <span className="erp-muted">—</span>}
        </span>
      ),
    },
    {
      header: 'Bill',
      render: (t) => {
        if (!t.billNumber) return <span className="erp-muted">not billed</span>;
        const to = documentPathFor('SALE_BILL', t.billId);
        return (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {to ? <Link to={to}>{t.billNumber}</Link> : t.billNumber}
            <StatusBadge status={t.billStatus} />
          </span>
        );
      },
    },
  ];

  return (
    <div className="erp-page">
      <PageHeader
        title={<><Package size={20} /> {order.doNumber}</>}
        subtitle={`${order.material} · ${order.fromLocation} → ${order.toLocation}`}
        breadcrumbs={crumbs}
        actions={(
          <button type="button" className="erp-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Back
          </button>
        )}
      />

      {/* Where the order came from */}
      {sourceCall && (
        <div className="erp-callout info" style={{ marginBottom: 16 }}>
          <Phone size={15} />
          <span>
            Won on a call dated <strong>{formatDateIST(sourceCall.scheduledDate)}</strong> —{' '}
            <StatusBadge status={sourceCall.outcome} />
            {sourceCall.remarks && <> “{sourceCall.remarks}”</>}
          </span>
        </div>
      )}

      {/* Headline numbers */}
      <div className="erp-stat-grid">
        <div className="erp-stat">
          <div className="erp-stat-label">Customer</div>
          <div className="erp-stat-value" style={{ fontSize: 17 }}>
            {partyLink ? <Link to={partyLink}>{party?.name}</Link> : party?.name}
          </div>
          <div className="erp-stat-sub">
            Credit limit {inr(party?.creditLimit)} · {party?.creditDays} days
          </div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Ordered</div>
          <div className="erp-stat-value">{num(progress.orderedQty)} {progress.qtyUnit}</div>
          <div className="erp-stat-sub">@ {inr(money.rate)} = {inr(money.orderValue)}</div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Lifted</div>
          <div className="erp-stat-value">{num(progress.liftedQty)} {progress.qtyUnit}</div>
          <div className="erp-stat-sub">{progress.percentLifted}% of the order</div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Balance</div>
          <div className="erp-stat-value">{num(progress.balanceQty)} {progress.qtyUnit}</div>
          {/* This is what the credit check counts as exposure before anything moves. */}
          <div className="erp-stat-sub">{inr(money.undeliveredExposure)} committed</div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Status</div>
          <div style={{ marginTop: 6 }}><StatusBadge status={order.status} /></div>
          <div className="erp-stat-sub" style={{ marginTop: 8 }}>
            Expires {formatDateIST(order.expiryDate)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="erp-card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span className="erp-muted">
            {num(progress.liftedQty)} of {num(progress.orderedQty)} {progress.qtyUnit} lifted
          </span>
          <span className="erp-muted">{progress.percentLifted}%</span>
        </div>
        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, progress.percentLifted)}%`,
              height: '100%',
              background: '#4f46e5',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 14, fontSize: 13, flexWrap: 'wrap' }}>
          <span>Placements <strong>{counts.placements}</strong></span>
          <span>Trips <strong>{counts.trips}</strong></span>
          <span>CNs <strong>{counts.cns}</strong></span>
          <span>Unloadings <strong>{counts.unloadings}</strong></span>
          <span>Bills <strong>{counts.bills}</strong></span>
        </div>
      </div>

      {/* Money against this order */}
      <div className="erp-stat-grid">
        <div className="erp-stat">
          <div className="erp-stat-label">Order value</div>
          <div className="erp-stat-value">{inr(money.orderValue)}</div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Billed so far</div>
          <div className="erp-stat-value">{inr(money.billed)}</div>
          <div className="erp-stat-sub">
            {money.orderValue > 0 ? `${Math.round(pct(money.billed, money.orderValue))}% of order` : ''}
          </div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Received</div>
          <div className="erp-stat-value" style={{ color: '#15803d' }}>{inr(money.received)}</div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Outstanding</div>
          <div className="erp-stat-value" style={{ color: money.outstanding > 0 ? '#b45309' : '#15803d' }}>
            {inr(money.outstanding)}
          </div>
        </div>
      </div>

      {/* Every trip this order produced */}
      <div className="erp-card" style={{ padding: '18px 20px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>
          Trips against this order
        </h3>
        <p className="erp-field-hint" style={{ margin: '0 0 14px' }}>
          Har trip — placement se bill tak. Click any trip, CN or bill to open it.
        </p>
        <ErpTable
          columns={tripColumns}
          data={trips}
          emptyText="No trips placed against this order yet"
          keyExtractor={(t) => t.tripId}
        />
      </div>
    </div>
  );
};

export default DeliveryOrderDetailPage;
