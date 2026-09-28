import React, { useState } from 'react';
import { Navigation, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import TripDashboardService from './TripDashboardService';

/**
 * Start a queued trip.
 *
 * Deliberately a confirmation and not a form. The one thing worth capturing is
 * *when* it started, because a driver often reports a departure after the fact,
 * and that instant is what cuts the previous trip's telematics window — every
 * kilometre before it belongs to the old trip, every one after to this one.
 */
const TripStartDrawer = ({ isOpen, onClose, trip, onSuccess }) => {
  const [startedAt, setStartedAt] = useState('');
  const [saving, setSaving] = useState(false);

  if (!trip) return null;

  const handleStart = async () => {
    setSaving(true);
    try {
      await TripDashboardService.startTrip(trip._id, {
        startedAt: startedAt ? new Date(startedAt).toISOString() : undefined,
      });
      toast.success(`${trip.tripNumber} started`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to start the trip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ErpDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Start trip"
      subtitle={trip.tripNumber}
      maxWidth="480px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleStart} disabled={saving}>
            <Navigation size={16} />
            {saving ? 'Starting…' : 'Start trip'}
          </button>
        </>
      }
    >
      <div className="erp-detail-block">
        <div className="erp-detail-row">
          <span className="erp-detail-label">Route</span>
          <span className="erp-detail-value">
            {trip.fromLocation || '—'} → {trip.toLocation || '—'}
          </span>
        </div>
        <div className="erp-detail-row">
          <span className="erp-detail-label">Vehicle</span>
          <span className="erp-detail-value">{trip.vehicleNumber || '—'}</span>
        </div>
        <div className="erp-detail-row">
          <span className="erp-detail-label">Material</span>
          <span className="erp-detail-value">{trip.material || '—'}</span>
        </div>
      </div>

      <div className="erp-callout warning">
        <AlertTriangle size={16} />
        <span>
          Starting this trip ends the previous trip&apos;s running. Kilometres from this moment
          count against {trip.tripNumber}.
        </span>
      </div>

      <div className="erp-field full">
        <label htmlFor="trip-started-at">Started at</label>
        <input
          id="trip-started-at"
          type="datetime-local"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
        />
        <span className="erp-field-hint">
          Leave blank for now. Set it back if the truck left earlier than this was recorded — if it
          was parked in a yard, the real gate-exit time is used instead.
        </span>
      </div>
    </ErpDrawer>
  );
};

export default TripStartDrawer;
