import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Truck,
  MapPin,
  PackageCheck,
  Scale,
  Receipt,
  DollarSign,
  Calendar,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { toast } from 'react-toastify';
import TripDashboardService from './TripDashboardService';
import '../../styles/erp.css';
import PageHeader from '../../components/Erp/PageHeader';
import StatusBadge from '../../components/Erp/StatusBadge';
import AdvanceDrawer from '../../components/Erp/Drawers/AdvanceDrawer';
import ConsignmentDrawer from '../../components/Erp/Drawers/ConsignmentDrawer';
import TripCloseDrawer from '../../components/Erp/Drawers/TripCloseDrawer';
import PodDrawer from '../../components/Erp/Drawers/PodDrawer';
import UnloadingDrawer from '../../components/Erp/Drawers/UnloadingDrawer';
import SaleBillDrawer from '../../components/Erp/Drawers/SaleBillDrawer';
import ReceiptDrawer from '../../components/Erp/Drawers/ReceiptDrawer';

const FULL_LIFECYCLE_STAGES = [
  { id: 'DO', label: 'Delivery Order', icon: FileText },
  { id: 'PLACEMENT', label: 'Placement', icon: Calendar },
  { id: 'ADVANCE', label: 'Advance & CN', icon: Truck },
  { id: 'CLOSE', label: 'Trip Close', icon: MapPin },
  { id: 'POD', label: 'POD Receipt', icon: PackageCheck },
  { id: 'UNLOADING', label: 'Unloading', icon: Scale },
  { id: 'BILLING', label: 'Sale Bill', icon: Receipt },
  { id: 'PAID', label: 'Payment Received', icon: DollarSign },
];

const TripDetailPage = () => {
  const { tripId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drawer states
  const [activeDrawer, setActiveDrawer] = useState(null); // 'advance', 'cn', 'close', 'pod', 'unloading', 'salebill', 'receipt'

  const fetchTrip = async () => {
    try {
      const result = await TripDashboardService.getTripById(tripId);
      setData(result);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  // Sync activeDrawer with URL search params
  useEffect(() => {
    const drawerParam = searchParams.get('drawer');
    if (drawerParam) {
      setActiveDrawer(drawerParam.toLowerCase());
    }
  }, [searchParams]);

  const openDrawer = (name) => {
    setActiveDrawer(name);
    setSearchParams({ drawer: name }, { replace: true });
  };

  const closeDrawer = () => {
    setActiveDrawer(null);
    setSearchParams({}, { replace: true });
  };

  if (loading) {
    return (
      <div className="erp-page">
        <div className="erp-muted">Loading trip 360° view...</div>
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

  // Lifecycle stage index calculation
  const getStageIndex = () => {
    if (data.saleBillId && data.saleBillId.status === 'PAID') return 7;
    if (data.saleBillId) return 6;
    if (data.unloading) return 5;
    if (data.pod || data.state === 'POD_RECEIVED') return 4;
    if (data.tripClosedAt || data.state === 'TRIP_CLOSED') return 3;
    if (data.consignment || data.state === 'DISPATCHED') return 2;
    if (data.state === 'PLACED') return 1;
    return 0;
  };

  const currentStageIdx = getStageIndex();

  return (
    <div className="erp-page">
      <PageHeader
        title={`Trip: ${data.tripNumber}`}
        subtitle={`${new Date(data.tripDate).toLocaleDateString()} · Vehicle: ${data.vehicleNumber} · Client: ${data.partyId?.name || '—'}`}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Pipeline', to: '/erp/pipeline' },
          { label: data.tripNumber },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <StatusBadge status={data.state} />
            {data.partyId?.creditLimit && (
              <span className="erp-badge info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CreditCard size={12} /> Credit Limit: ₹{data.partyId.creditLimit.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        }
      />

      {/* Full 8-stage lifecycle stepper */}
      <div className="erp-pipeline-stepper" style={{ marginBottom: '24px' }}>
        {FULL_LIFECYCLE_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIdx;
          const isActive = idx === currentStageIdx;
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`erp-pipeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="erp-pipeline-icon">
                <Icon size={16} />
              </div>
              <span className="erp-pipeline-label">{stage.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Placement Card */}
        <div className="erp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>1. Placement Details</h3>
            <StatusBadge status={data.state === 'PLACED' ? 'PLACED' : 'COMPLETED'} />
          </div>
          <p><strong>Route:</strong> {data.fromLocation} ➔ {data.toLocation}</p>
          <p><strong>Material:</strong> {data.material}</p>
          <p><strong>Planned Qty:</strong> {data.plannedQty}</p>
          <p><strong>DO Number:</strong> {data.doId?.doNumber || '—'}</p>
        </div>

        {/* Advances Card */}
        <div className="erp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>2. Advances</h3>
            <StatusBadge status={data.advanceGate || 'NONE'} />
          </div>
          {data.advances && data.advances.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: '8px 0 16px' }}>
              {data.advances.map((a) => (
                <li key={a._id}>
                  {a.advanceType} — ₹{a.amount} (<StatusBadge status={a.status} />)
                </li>
              ))}
            </ul>
          ) : (
            <p className="erp-muted">No advances created yet.</p>
          )}
          <button className="btn btn-primary" onClick={() => openDrawer('advance')}>
            {data.advances?.length > 0 ? 'Manage Advances' : 'Raise Advance'}
          </button>
        </div>

        {/* Consignment Card */}
        <div className="erp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>3. Consignment (CN)</h3>
            <StatusBadge status={data.cnGate || 'NONE'} />
          </div>
          {data.consignment ? (
            <>
              <p><strong>CN Number:</strong> {data.consignment.cnNumber}</p>
              <p><strong>Loaded Qty:</strong> {data.consignment.loadedQty} {data.consignment.loadedQtyUnit || 'KL'}</p>
            </>
          ) : data.cnGate === 'UPDATED' || data.loadedQty != null ? (
            <>
              <p><strong>CN Status:</strong> CN Updated</p>
              <p><strong>Loaded Qty:</strong> {data.loadedQty} KL</p>
            </>
          ) : (
            <p className="erp-muted">No consignment created yet.</p>
          )}
          <button className="btn btn-primary" onClick={() => openDrawer('cn')}>
            {data.consignment || data.cnGate === 'UPDATED' ? 'Update CN' : 'Create CN'}
          </button>
        </div>

        {/* Trip Close Card */}
        <div className="erp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>4. Trip Close</h3>
            <StatusBadge status={data.tripClosedAt ? 'TRIP_CLOSED' : 'PENDING'} />
          </div>
          {data.tripClosedAt ? (
            <>
              <p><strong>Closed At:</strong> {new Date(data.tripClosedAt).toLocaleString()}</p>
              <p><strong>Unload Location:</strong> {data.unloadLocation || '—'}</p>
            </>
          ) : (
            <p className="erp-muted">Trip not closed yet.</p>
          )}
          <button className="btn btn-primary" onClick={() => openDrawer('close')}>
            {data.tripClosedAt ? 'View / Re-close Trip' : 'Close Trip'}
          </button>
        </div>

        {/* POD Card */}
        <div className="erp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>5. Proof of Delivery (POD)</h3>
            <StatusBadge status={data.pod ? 'POD_RECEIVED' : 'PENDING'} />
          </div>
          {data.pod ? (
            <>
              <p><strong>Received At:</strong> {new Date(data.pod.receivedDate).toLocaleDateString()}</p>
              <p><strong>Received By:</strong> {data.pod.receivedByName || 'Office'}</p>
            </>
          ) : (
            <p className="erp-muted">No POD received yet.</p>
          )}
          <button className="btn btn-primary" onClick={() => openDrawer('pod')}>
            {data.pod ? 'Update POD' : 'Upload POD'}
          </button>
        </div>

        {/* Unloading Card */}
        <div className="erp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>6. Unloading</h3>
            <StatusBadge status={data.unloading ? 'UNLOADING_ENTERED' : 'PENDING'} />
          </div>
          {data.unloading ? (
            <>
              <p><strong>Unloaded Qty:</strong> {data.unloading.unloadedQty}</p>
              <p><strong>Shortage:</strong> {data.unloading.shortageQty} (Deduction: ₹{data.unloading.shortageDeduction})</p>
              <p><strong>Detention:</strong> {data.unloading.detentionDays} days (Amount: ₹{data.unloading.detentionAmount})</p>
            </>
          ) : (
            <p className="erp-muted">No unloading entry yet.</p>
          )}
          <button className="btn btn-primary" onClick={() => openDrawer('unloading')}>
            {data.unloading ? 'Update Unloading' : 'Enter Unloading'}
          </button>
        </div>

        {/* Billing & Receipts Card */}
        <div className="erp-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>7 & 8. Sale Billing & Receipts</h3>
            <StatusBadge status={data.saleBillId ? (data.saleBillId.status || 'BILLED') : 'PENDING'} />
          </div>
          {data.saleBillId ? (
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <p><strong>Bill No:</strong> {data.saleBillId.billNumber}</p>
                <p><strong>Bill Date:</strong> {new Date(data.saleBillId.billDate).toLocaleDateString()}</p>
                <p><strong>Grand Total:</strong> ₹{(data.saleBillId.grandTotal || 0).toLocaleString('en-IN')}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" onClick={() => openDrawer('receipt')}>
                  Record Receipt
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="erp-muted" style={{ margin: 0 }}>Sale bill not generated yet for this trip.</p>
              <button className="btn btn-primary" onClick={() => openDrawer('salebill')} disabled={!data.unloading}>
                Generate Sale Bill
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Action Drawers */}
      <AdvanceDrawer 
        isOpen={activeDrawer === 'advance'} 
        onClose={closeDrawer} 
        initialTripId={data._id}
        mode="RAISE"
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
        unloading={data.unloading ? { ...data.unloading, tripNumber: data.tripNumber, partyId: data.partyId } : null}
        onSuccess={fetchTrip}
      />
      <ReceiptDrawer
        isOpen={activeDrawer === 'receipt'}
        onClose={closeDrawer}
        bill={data.saleBillId}
        party={data.partyId}
        onSuccess={fetchTrip}
      />
    </div>
  );
};

export default TripDetailPage;
