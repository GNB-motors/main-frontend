import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import TripDashboardService from './TripDashboardService';
import '../../styles/erp.css';

const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="erp-page">
        <div className="erp-muted">Loading trip details...</div>
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

  const getBadgeClass = (state) => {
    switch (state) {
      case 'PLACED':
      case 'ADVANCE_PENDING':
        return 'warning';
      case 'ADVANCE_PAID':
      case 'CN_UPDATED':
      case 'POD_RECEIVED':
      case 'UNLOADED':
        return 'info';
      case 'TRIP_CLOSED':
      case 'BILLED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const handleAction = (route, action) => {
    // We pass the base trip object (without populated arrays that might break target logic)
    const tripSummary = {
      _id: data._id,
      tripNumber: data.tripNumber,
      tripDate: data.tripDate,
      state: data.state,
      partyId: data.partyId,
      vehicleId: data.vehicleId,
      vehicleNumber: data.vehicleNumber,
      material: data.material,
      plannedQty: data.plannedQty,
      loadedQty: data.loadedQty
    };
    navigate(route, { state: { action, trip: tripSummary } });
  };

  return (
    <div className="erp-page">
      <header className="erp-header">
        <div>
          <h1>Trip: {data.tripNumber}</h1>
          <p className="erp-subtitle">
            {new Date(data.tripDate).toLocaleDateString()} | Vehicle: {data.vehicleNumber} | Client: {data.partyId?.name}
          </p>
        </div>
        <span className={`erp-badge ${getBadgeClass(data.state)}`} style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
          {data.state}
        </span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Placement Card */}
        <div className="erp-card" style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>1. Placement Details</h3>
          <p><strong>Route:</strong> {data.fromLocation} ➔ {data.toLocation}</p>
          <p><strong>Material:</strong> {data.material}</p>
          <p><strong>Planned Qty:</strong> {data.plannedQty}</p>
          <p><strong>DO Number:</strong> {data.doId?.doNumber || '—'}</p>
          {data.state === 'PLACED' && (
            <button className="btn btn-primary" onClick={() => handleAction('/erp/advances', 'openAdvance')}>
              Go to Advances
            </button>
          )}
        </div>

        {/* Advances Card */}
        <div className="erp-card" style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>2. Advances</h3>
          {data.advances && data.advances.length > 0 ? (
            <ul>
              {data.advances.map(a => (
                <li key={a._id}>{a.advanceType} - {a.amount} ({a.status})</li>
              ))}
            </ul>
          ) : (
            <p className="erp-muted">No advances created yet.</p>
          )}
          {data.state === 'ADVANCE_PENDING' && (
            <button className="btn btn-primary" onClick={() => handleAction('/erp/advances', 'openAdvance')}>
              Pay Advance
            </button>
          )}
        </div>

        {/* Consignment Card */}
        <div className="erp-card" style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>3. Consignment (CN)</h3>
          {data.consignment ? (
            <>
              <p><strong>CN Number:</strong> {data.consignment.cnNumber}</p>
              <p><strong>Loaded Qty:</strong> {data.consignment.loadedQty} {data.consignment.loadedQtyUnit}</p>
            </>
          ) : (
            <p className="erp-muted">No consignment created yet.</p>
          )}
          {data.state === 'ADVANCE_PAID' && (
            <button className="btn btn-primary" onClick={() => handleAction('/erp/consignments', 'openCnUpdate')}>
              Update CN
            </button>
          )}
        </div>

        {/* Trip Close Card */}
        <div className="erp-card" style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>4. Trip Close</h3>
          {data.tripClosedAt ? (
            <>
              <p><strong>Closed At:</strong> {new Date(data.tripClosedAt).toLocaleString()}</p>
              <p><strong>Unload Location:</strong> {data.unloadLocation}</p>
            </>
          ) : (
            <p className="erp-muted">Trip not closed yet.</p>
          )}
          {data.state === 'CN_UPDATED' && (
            <button className="btn btn-primary" onClick={() => handleAction('/erp/trip-close', 'openTripClose')}>
              Close Trip
            </button>
          )}
        </div>

        {/* POD Card */}
        <div className="erp-card" style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>5. Proof of Delivery (POD)</h3>
          {data.pod ? (
            <>
              <p><strong>Received At:</strong> {new Date(data.pod.receivedDate).toLocaleDateString()}</p>
              <p><strong>Received By:</strong> {data.pod.receivedByName}</p>
            </>
          ) : (
            <p className="erp-muted">No POD received yet.</p>
          )}
          {data.state === 'TRIP_CLOSED' && (
            <button className="btn btn-primary" onClick={() => handleAction('/erp/pods', 'openPod')}>
              Upload POD
            </button>
          )}
        </div>

        {/* Unloading Card */}
        <div className="erp-card" style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <h3>6. Unloading</h3>
          {data.unloading ? (
            <>
              <p><strong>Unloaded Qty:</strong> {data.unloading.unloadedQty}</p>
              <p><strong>Shortage:</strong> {data.unloading.shortageQty} (Deduction: {data.unloading.shortageDeduction})</p>
              <p><strong>Detention:</strong> {data.unloading.detentionDays} days (Amount: {data.unloading.detentionAmount})</p>
            </>
          ) : (
            <p className="erp-muted">No unloading entry yet.</p>
          )}
          {data.state === 'POD_RECEIVED' && (
            <button className="btn btn-primary" onClick={() => handleAction('/erp/unloading', 'openUnloading')}>
              Enter Unloading
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default TripDetailPage;
