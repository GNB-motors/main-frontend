/**
 * VerificationPhase Component - Phase 3 of Trip Creation
 * 
 * Final verification screen with:
 * - Document recap (odometer, fuel receipts)
 * - Master table of all weight slips
 * - Completion stats
 * - Submit action to backend
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import TripService from '../services/TripService';
import { Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import './VerificationPhase.css';
import ImagePreviewModal from '../components/ImagePreviewModal';


const VerificationPhase = ({
  onBack,
  onSubmit,
  isSubmitting,
  onCancel,
  tripId: propTripId
}) => {
  const [tripId] = useState(propTripId || localStorage.getItem('tripId'));
  const [trip, setTrip] = useState(null);
  const [weightSlips, setWeightSlips] = useState([]);
  const [fixedDocs, setFixedDocs] = useState({});
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageSrc: null,
    title: ''
  });

  useEffect(() => {
    if (tripId) {
      TripService.getTripById(tripId)
        .then((apiResp) => {
          // TripService returns response.data from API which is { status, data: <trip> }
          const payload = apiResp && apiResp.data ? apiResp.data : apiResp;
          setTrip(payload);

          // Normalize weight slips from documents.weightCerts (same shape as ProcessingPhase)
          const rawWeightCerts = payload.documents?.weightCerts || [];
          const s3Refs = payload.s3References?.weightCerts || [];
          const slips = rawWeightCerts.map((wc, idx) => ({
            _id: wc._id || wc.documentId,
            documentId: wc.documentId,
            weight: wc.netWeight || wc.grossWeight || 0,
            origin: wc.origin || '',
            destination: wc.destination || '',
            file: { preview: s3Refs[idx] || '' },
            isDone: wc.isDone || false,
          }));

          setWeightSlips(slips);
          setFixedDocs(payload.documents || {});
        })
        .catch((err) => {
          console.error('Failed to fetch trip details:', err);
        });
    }
  }, [tripId]);

  // Memoized data validation
  const isDataComplete = useMemo(
    // Treat a slip as complete when required fields are present. Allow either explicit isDone
    // or fields filled in the form to mark completeness so submit enables after user completes fields.
    () => {
      if (!weightSlips || weightSlips.length === 0) return false;

      // If server-side trip status indicates completion stages, allow submit.
      if (trip && ['REVENUE_ENTERED', 'EXPENSES_ENTERED', 'SUBMITTED', 'SUMMARY_REVIEW'].includes(trip.status)) {
        return true;
      }

      // Otherwise ensure each slip is either marked isDone locally, has required form fields filled,
      // or has a matching revenue/expense/route entry on the trip (persisted on server).
      return weightSlips.every((slip) => {
        if (slip.isDone === true) return true;
        if (slip.origin && slip.destination && (slip.weight || slip.netWeight)) return true;

        // Check server-side revenues
        const revExists = trip && Array.isArray(trip.revenues) && trip.revenues.some((r) => {
          const wid = String(r.weightCertId || '');
          return wid === String(slip.documentId || slip._id || '');
        });
        if (revExists) return true;

        // Check server-side expenses
        const expExists = trip && Array.isArray(trip.expenses) && trip.expenses.some((e) => {
          const wid = String(e.weightCertId || '');
          return wid === String(slip.documentId || slip._id || '');
        });
        if (expExists) return true;

        // Check route assignment
        const routeAssigned = trip && Array.isArray(trip.selectedRoutes) && trip.selectedRoutes.some((sr) => {
          const wid = String(sr.weightCertId || '');
          return wid === String(slip.documentId || slip._id || '');
        });
        if (routeAssigned) return true;

        return false;
      });
    },
    [weightSlips]
  );

  const completedCount = useMemo(
    () => weightSlips.filter(s => s.isDone).length,
    [weightSlips]
  );

  const totalWeight = useMemo(
    () =>
      weightSlips
        .reduce((sum, slip) => sum + (parseFloat(slip.weight) || 0), 0)
        .toFixed(2),
    [weightSlips]
  );

  const revenueSummary = useMemo(() => {
    if (!trip) return { totalRevenue: 0, totalCalculated: 0, totalVariance: 0 };
    return {
      totalRevenue: trip.revenueSummary?.totalRevenue || 0,
      totalCalculated: trip.revenueSummary?.totalAmountCalculated || 0,
      totalVariance: trip.revenueSummary?.totalAmountVariance || 0,
    };
  }, [trip]);

  const totalExpense = useMemo(() => {
    if (!trip || !Array.isArray(trip.expenses)) return 0;
    return trip.expenses.reduce((s, e) => s + (e.totalExpense || 0), 0);
  }, [trip]);

  const profit = useMemo(() => {
    return (revenueSummary.totalRevenue || 0) - (totalExpense || 0);
  }, [revenueSummary, totalExpense]);

  const handleShowPreview = useCallback((imageSrc, title) => {
    setPreviewModal({
      isOpen: true,
      imageSrc,
      title
    });
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewModal({
      isOpen: false,
      imageSrc: null,
      title: ''
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isDataComplete) {
      toast.error('Please complete all weight slips before submitting');
      return;
    }

    setIsSubmittingLocal(true);
    try {
      // Get endOdometer from trip data
      const endOdometer = trip?.documents?.odometer?.correctedReading || trip?.documents?.odometer?.ocrReading || 0;
      
      // Call backend submit endpoint
      await TripService.submitTrip(tripId, { endOdometer });
      toast.success('Trip submitted successfully');
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error?.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmittingLocal(false);
    }
  }, [isDataComplete, onSubmit, trip]);

  return (
    <div className="verification-phase">
      {/* Compact Header */}
      <div className="verification-header">
        <div className="header-content">
          <div>
            <p>Review and submit your trip data</p>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="verification-content">
        {/* Document Recap Section */}
        <div className="verification-recap">
          <div className="recap-header">
            <h3>Attached Documents</h3>
          </div>
          <div className="recap-images">
            {fixedDocs.odometer && (
              <div className="recap-item">
                <div className="recap-label">Odometer</div>
                <div className="recap-image-wrapper">
                  {fixedDocs.odometer.preview ? (
                    <img
                      src={fixedDocs.odometer.preview}
                      alt="Odometer"
                      className="recap-image"
                      onClick={() =>
                        handleShowPreview(fixedDocs.odometer.preview, 'Odometer Image')
                      }
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <button
                    className="btn-preview"
                    onClick={() =>
                      handleShowPreview(fixedDocs.odometer.preview, 'Odometer Image')
                    }
                    title="Preview image"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            )}

            {fixedDocs.fuel && (
              <div className="recap-item">
                <div className="recap-label">Full Tank Fuel</div>
                <div className="recap-image-wrapper">
                  {fixedDocs.fuel.preview ? (
                    <img
                      src={fixedDocs.fuel.preview}
                      alt="Fuel Receipt"
                      className="recap-image"
                      onClick={() =>
                        handleShowPreview(fixedDocs.fuel.preview, 'Fuel Receipt Image')
                      }
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <button
                    className="btn-preview"
                    onClick={() =>
                      handleShowPreview(fixedDocs.fuel.preview, 'Fuel Receipt Image')
                    }
                    title="Preview image"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            )}

            {fixedDocs.partialFuel && fixedDocs.partialFuel.length > 0 && (
              <div className="recap-partial">
                <div className="recap-label">
                  Partial Fuels ({fixedDocs.partialFuel.length})
                </div>
                <div className="recap-partial-grid">
                  {fixedDocs.partialFuel.map((fuel, index) => (
                    <div key={index} className="recap-partial-item">
                      {fuel?.file?.preview ? (
                        <img
                          src={fuel.file.preview}
                          alt={`Partial Fuel ${index + 1}`}
                          className="recap-image-small"
                          onClick={() =>
                            handleShowPreview(
                              fuel.file.preview,
                              `Partial Fuel #${index + 1}`
                            )
                          }
                        />
                      ) : (
                        <div className="no-image-small">No Image</div>
                      )}
                      <button
                        className="btn-preview-small"
                        onClick={() =>
                          handleShowPreview(
                            fuel.file.preview,
                            `Partial Fuel #${index + 1}`
                          )
                        }
                        title="Preview image"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weight Slips Table Section */}
        <div className="verification-table-section">
          <div className="table-header">
            <h3>Weight Slips ({weightSlips.length})</h3>
            <div className="table-status">
              {!isDataComplete && (
                <div className="status-badge incomplete">
                  <AlertCircle size={14} />
                  <span>Incomplete</span>
                </div>
              )}
              {isDataComplete && (
                <div className="status-badge complete">
                  <CheckCircle size={14} />
                  <span>Complete</span>
                </div>
              )}
            </div>
          </div>

          <div className="table-scroll">
            <table className="verification-table">
              <thead>
                <tr>
                  <th width="60">Slip</th>
                  <th width="100">Image</th>
                  <th width="160">Origin</th>
                  <th width="160">Destination</th>
                  <th width="100">Weight</th>
                  <th width="80">Status</th>
                </tr>
              </thead>
              <tbody>
                {weightSlips.map((slip, index) => (
                  <tr
                    key={index}
                    className={slip.isDone ? 'row-complete' : 'row-incomplete'}
                  >
                    <td className="slip-number">#{index + 1}</td>
                    <td>
                      <div className="slip-preview-container">
                        {slip?.file?.preview ? (
                          <img
                            src={slip.file.preview}
                            alt={`Slip ${index + 1}`}
                            className="slip-preview"
                            onClick={() =>
                              handleShowPreview(
                                slip.file.preview,
                                `Weight Slip #${index + 1}`
                              )
                            }
                          />
                        ) : (
                          <div className="no-image-small">No Image</div>
                        )}
                        <button
                          className="btn-preview-small"
                          onClick={() =>
                            handleShowPreview(
                              slip.file.preview,
                              `Weight Slip #${index + 1}`
                            )
                          }
                          title="Preview image"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                    <td>{slip.origin || '—'}</td>
                    <td>{slip.destination || '—'}</td>
                    <td className="text-center">{slip.weight || '—'} kg</td>
                    <td>
                      {slip.isDone ? (
                        <div className="status-badge-small done">
                          <CheckCircle size={14} />
                          Done
                        </div>
                      ) : (
                        <div className="status-badge-small pending">Pending</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="verification-stats">
            <div className="stat-item">
              <span className="stat-label">Total Slips</span>
              <span className="stat-value">{weightSlips.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed</span>
              <span className="stat-value">
                {completedCount} / {weightSlips.length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Weight</span>
              <span className="stat-value">{totalWeight} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="verification-footer">
        <button
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          ← Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!isDataComplete || isSubmitting || isSubmittingLocal}
          title={
            !isDataComplete
              ? 'Complete all slips before submitting'
              : 'Submit trip data'
          }
        >
          {isSubmitting || isSubmittingLocal ? 'Submitting...' : '✓ Submit'}
        </button>
        <button
          className="btn btn-outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>

      {/* Image Preview Modal */}
      {previewModal.isOpen && (
        <ImagePreviewModal
          imageSrc={previewModal.imageSrc}
          title={previewModal.title}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
};

export default VerificationPhase;
