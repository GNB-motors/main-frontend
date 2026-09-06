import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck,
  FileCheck,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  MapPin,
  PackageCheck,
  Scale,
  Receipt,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageHeader from '../../components/Erp/PageHeader';
import ErpTable from '../../components/Erp/ErpTable';
import StatusBadge from '../../components/Erp/StatusBadge';
import AdvanceDrawer from '../../components/Erp/Drawers/AdvanceDrawer';
import ConsignmentDrawer from '../../components/Erp/Drawers/ConsignmentDrawer';
import TripCloseDrawer from '../../components/Erp/Drawers/TripCloseDrawer';
import PodDrawer from '../../components/Erp/Drawers/PodDrawer';
import UnloadingDrawer from '../../components/Erp/Drawers/UnloadingDrawer';
import ConsignmentService from '../ErpConsignments/ConsignmentService';
import TripCloseService from '../ErpTrips/TripCloseService';
import PodService from '../ErpPods/PodService';
import UnloadingApi from '../ErpUnloading/UnloadingService';
import SaleBillApi from '../ErpSaleBills/SaleBillService';
import ErpDashboardService from './ErpDashboardService';

const formatMoney = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

const ErpHomePage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [, setLoadingSummary] = useState(true);

  // Pending queue tab state
  const [queueTab, setQueueTab] = useState('cns'); // 'cns', 'tripClose', 'pods', 'unloading', 'saleBills'
  const [queueData, setQueueData] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Active Drawers state
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await ErpDashboardService.getSummary();
      if (data.success) {
        setSummary(data.data);
      } else {
        toast.error(data.message || 'Failed to load dashboard summary');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load dashboard summary');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchQueueData = useCallback(async () => {
    setLoadingQueue(true);
    try {
      if (queueTab === 'cns') {
        const res = await ConsignmentService.getPending({ limit: 10 });
        setQueueData(res.data || []);
      } else if (queueTab === 'tripClose') {
        const res = await TripCloseService.getPendingClose({ limit: 10 });
        setQueueData(res.data || []);
      } else if (queueTab === 'pods') {
        const res = await PodService.getPending({ limit: 10 });
        setQueueData(res.data || []);
      } else if (queueTab === 'unloading') {
        const res = await UnloadingApi.getPending({ limit: 10 });
        setQueueData(res.data || []);
      } else if (queueTab === 'saleBills') {
        const res = await SaleBillApi.getPending({ limit: 10 });
        setQueueData(res.data || []);
      }
    } catch {
      setQueueData([]);
    } finally {
      setLoadingQueue(false);
    }
  }, [queueTab]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  const openTripAction = (trip, drawerName) => {
    setSelectedTrip(trip);
    setActiveDrawer(drawerName);
  };

  const closeDrawer = () => {
    setActiveDrawer(null);
    setSelectedTrip(null);
    fetchSummary();
    fetchQueueData();
  };

  const pCounts = summary?.pendingCounts || {};
  const financials = summary?.financials || {};

  const funnelData = [
    { name: 'DOs Open', count: pCounts.dos || 0, color: '#3b82f6', route: '/erp/pipeline?tab=dos' },
    { name: 'Placed Today', count: pCounts.placementsToday || 0, color: '#f59e0b', route: '/erp/pipeline?tab=placement' },
    { name: 'Pending CN', count: pCounts.pendingCns || 0, color: '#8b5cf6', route: '/erp/pipeline?tab=trips' },
    { name: 'Pending Close', count: pCounts.pendingTripClose || 0, color: '#ec4899', route: '/erp/pipeline?tab=trips' },
    { name: 'Pending POD', count: pCounts.pendingPods || 0, color: '#06b6d4', route: '/erp/pipeline?tab=trips' },
    { name: 'Pending Unload', count: pCounts.pendingUnloadings || 0, color: '#10b981', route: '/erp/pipeline?tab=trips' },
    { name: 'Pending Bill', count: pCounts.pendingBillSubmissions || 0, color: '#00c896', route: '/erp/billing?tab=bills' },
  ];

  return (
    <div className="erp-page">
      <PageHeader
        title="ERP Command Center"
        subtitle="Real-time operational dashboard, pipeline tracking, and pending action queues"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Home' }]}
        actions={
          <button className="btn btn-secondary" onClick={() => { fetchSummary(); fetchQueueData(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="erp-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Trips</span>
            <Truck size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a202c' }}>
            {(pCounts.activeTrips?.PLACED || 0) + (pCounts.activeTrips?.DISPATCHED || 0)}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {pCounts.activeTrips?.PLACED || 0} Placed · {pCounts.activeTrips?.DISPATCHED || 0} Dispatched
          </span>
        </div>

        <button
          type="button"
          className="erp-card"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
          onClick={() => navigate('/erp/approvals')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Pending Approvals</span>
            <FileCheck size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: pCounts.pendingApprovals > 0 ? '#b45309' : '#1a202c' }}>
            {pCounts.pendingApprovals || 0}
          </div>
          <span style={{ fontSize: '12px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Review approvals <ArrowRight size={12} />
          </span>
        </button>

        <div className="erp-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Receivables Due</span>
            <DollarSign size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>
            {formatMoney(financials.receivablesOutstanding)}
          </div>
          <span style={{ fontSize: '12px', color: financials.receivablesOverdue > 0 ? '#dc2626' : '#64748b' }}>
            {financials.receivablesOverdue > 0 ? `${formatMoney(financials.receivablesOverdue)} Overdue` : 'All current'}
          </span>
        </div>

        <div className="erp-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Payables Due</span>
            <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a202c' }}>
            {formatMoney(financials.payablesDue)}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Vendors: {formatMoney(financials.vendorPayables)} · Suppliers: {formatMoney(financials.supplierPayables)}
          </span>
        </div>
      </div>

      {/* Pipeline Funnel & Ageing Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="erp-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Operational Pipeline Funnel</h3>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={(data) => navigate(data.route)}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="erp-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: '#06b6d4' }} /> POD Ageing Watch
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Trips closed awaiting physical POD challans
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>&lt; 7 Days</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{pCounts.podAgeing?.under7d || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef3c7', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', color: '#b45309', fontWeight: 600 }}>7 - 14 Days</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{pCounts.podAgeing?.from7to14d || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fee2e2', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> &gt; 14 Days Overdue
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#b91c1c' }}>{pCounts.podAgeing?.over14d || 0}</span>
              </div>
            </div>
          </div>

          <button className="btn btn-secondary" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }} onClick={() => navigate('/erp/pipeline?tab=trips')}>
            View All Trips <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Action Queues Section (In-Place Drawers) */}
      <div className="erp-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Action Queues</h3>
          <div className="erp-tabs" style={{ margin: 0 }}>
            {[
              ['cns', `Pending CN (${pCounts.pendingCns || 0})`],
              ['tripClose', `Pending Close (${pCounts.pendingTripClose || 0})`],
              ['pods', `Pending POD (${pCounts.pendingPods || 0})`],
              ['unloading', `Pending Unload (${pCounts.pendingUnloadings || 0})`],
              ['saleBills', `Pending Billing (${pCounts.pendingBillSubmissions || 0})`],
            ].map(([tabKey, label]) => (
              <button
                key={tabKey}
                className={`erp-tab ${queueTab === tabKey ? 'active' : ''}`}
                onClick={() => setQueueTab(tabKey)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ErpTable
          loading={loadingQueue}
          data={queueData}
          emptyText="No pending items in this queue"
          columns={
            queueTab === 'cns' ? [
              { header: 'Trip No', accessor: 'tripNumber', render: (r) => <strong>{r.tripNumber}</strong> },
              { header: 'Party', render: (r) => r.partyId?.name || '—' },
              { header: 'Vehicle', render: (r) => r.vehicleNumber || '—' },
              { header: 'Material', accessor: 'material' },
              {
                header: 'Action',
                render: (r) => (
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openTripAction(r, 'cn')}>
                    Update CN
                  </button>
                ),
              },
            ] : queueTab === 'tripClose' ? [
              { header: 'Trip No', accessor: 'tripNumber', render: (r) => <strong>{r.tripNumber}</strong> },
              { header: 'CN No', render: (r) => r.cnNumber || '—' },
              { header: 'Party', render: (r) => r.partyId?.name || '—' },
              { header: 'Vehicle', render: (r) => r.vehicleNumber || '—' },
              {
                header: 'Action',
                render: (r) => (
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openTripAction(r, 'close')}>
                    Close Trip
                  </button>
                ),
              },
            ] : queueTab === 'pods' ? [
              { header: 'Trip No', accessor: 'tripNumber', render: (r) => <strong>{r.tripNumber}</strong> },
              { header: 'CN No', render: (r) => r.cnNumber || '—' },
              { header: 'Party', render: (r) => r.partyName || '—' },
              { header: 'Ageing', render: (r) => <StatusBadge status={r.isOverdue ? 'DANGER' : 'NEUTRAL'} label={`${r.ageingDays}d`} /> },
              {
                header: 'Action',
                render: (r) => (
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openTripAction(r, 'pod')}>
                    Record POD
                  </button>
                ),
              },
            ] : queueTab === 'unloading' ? [
              { header: 'Trip No', accessor: 'tripNumber', render: (r) => <strong>{r.tripNumber}</strong> },
              { header: 'Party', render: (r) => r.partyId?.name || '—' },
              { header: 'Vehicle', render: (r) => r.vehicleNumber || '—' },
              { header: 'Loaded Qty', render: (r) => `${r.loadedQty} ${r.qtyUnit || 'KL'}` },
              {
                header: 'Action',
                render: (r) => (
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openTripAction(r, 'unloading')}>
                    Enter Unloading
                  </button>
                ),
              },
            ] : [
              { header: 'Party', render: (r) => <strong>{r.partyName || r.partyId?.name}</strong> },
              { header: 'Unloadings', render: (r) => r.unloadings?.length || 1 },
              { header: 'Total Value', render: (r) => formatMoney(r.totalAmount || r.netReceivable) },
              {
                header: 'Action',
                render: () => (
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => navigate('/erp/billing')}>
                    Go to Billing
                  </button>
                ),
              },
            ]
          }
        />
      </div>

      {/* Shared Action Drawers */}
      <ConsignmentDrawer isOpen={activeDrawer === 'cn'} onClose={closeDrawer} trip={selectedTrip} onSuccess={closeDrawer} />
      <TripCloseDrawer isOpen={activeDrawer === 'close'} onClose={closeDrawer} trip={selectedTrip} onSuccess={closeDrawer} />
      <PodDrawer isOpen={activeDrawer === 'pod'} onClose={closeDrawer} trip={selectedTrip} onSuccess={closeDrawer} />
      <UnloadingDrawer isOpen={activeDrawer === 'unloading'} onClose={closeDrawer} trip={selectedTrip} onSuccess={closeDrawer} />
    </div>
  );
};

export default ErpHomePage;
