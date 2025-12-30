/**
 * ProcessingPhase Component - Phase 2 of Trip Creation
 * 
 * Side-by-side workspace with two sections:
 * - Left: Scrollable list of weight slips with image previews
 * - Right: Detailed form for current slip
 */


import React, { useState, useCallback, useEffect } from 'react';
import './ProcessingPhase.css';
import SlipsList from '../components/SlipsList';
import TripForm from '../components/TripForm';
import ImagePreviewModal from '../components/ImagePreviewModal';
import TripService from '../services/TripService';



const ProcessingPhase = ({
  onNextSlip,
  onPreviousSlip,
  onSelectSlip,
  onCancel,
  tripId: propTripId,
}) => {
  // Always fetch trip by ID on mount
  const [tripId] = useState(propTripId || localStorage.getItem('tripId'));
  const [trip, setTrip] = useState(null);
  const [weightSlips, setWeightSlips] = useState([]);
  const [fixedDocs, setFixedDocs] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Helper to coerce values to safe numbers (avoid NaN)
  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    if (tripId) {
      TripService.getTripById(tripId)
        .then((apiResponse) => {
          // The backend returns { status, data: { ...trip } }
          const tripData = apiResponse.data || {};
          setTrip(tripData);
          // Normalize weightCerts from documents into slips expected by UI
          const rawWeightCerts = tripData.documents?.weightCerts || [];
          const s3WeightRefs = tripData.s3References?.weightCerts || [];
          const slips = rawWeightCerts.map((wc, idx) => ({
            // preserve original ids
            _id: wc._id || wc.documentId,
            documentId: wc.documentId,
            grossWeight: wc.grossWeight,
            tareWeight: wc.tareWeight,
            netWeight: wc.netWeight,
            weight: wc.netWeight || wc.grossWeight || 0,
            ocrConfidence: wc.ocrConfidence,
            correctedByManager: wc.correctedByManager,
            // UI expects a file.preview for thumbnails; fall back to any s3 reference or empty string
            file: { preview: s3WeightRefs[idx] || '' },
            // default flags used by UI
            isDone: wc.isDone || false,
          }));
          console.log('[ProcessingPhase] Loaded slips:', slips);
          setWeightSlips(slips);
          setFixedDocs(tripData.documents || {});
          // Store trip data in localStorage for access by other phases/APIs
          localStorage.setItem('tripData', JSON.stringify(tripData));
        })
        .catch((err) => {
          console.error('Failed to fetch trip details:', err);
        });
    }
  }, [tripId]);

  // Update slip in state
  const updateWeightSlip = (idx, data) => {
    setWeightSlips((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...data };
      return updated;
    });
  };

  // Navigation
  const handleNextSlip = () => {
    if (currentIndex < weightSlips.length - 1) setCurrentIndex(currentIndex + 1);
    if (onNextSlip) onNextSlip();
  };
  const handlePreviousSlip = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    if (onPreviousSlip) onPreviousSlip();
  };
  const handleSelectSlip = (idx) => {
    setCurrentIndex(idx);
    if (onSelectSlip) onSelectSlip(idx);
  };


  const currentSlip = weightSlips[currentIndex];

  // Handle preview click
  const handlePreviewClick = useCallback((imageSource) => {
    setPreviewImage(imageSource);
    setShowPreview(true);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        if (currentIndex < weightSlips.length - 1) {
          onNextSlip();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          onPreviousSlip();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, weightSlips.length, onNextSlip, onPreviousSlip]);

  // Handle save (mark current slip as done and persist to backend)
  const handleSave = useCallback(async () => {
    if (!currentSlip.origin || !currentSlip.destination || !currentSlip.weight) {
      alert('Please fill in all required fields:\n- Origin\n- Destination\n- Weight');
      return;
    }
    // Mark current slip as done in local state and wait for state update
    await Promise.resolve(updateWeightSlip(currentIndex, { isDone: true }));

    // Persist OCR data, route assignment, revenue, and expenses for this slip
    if (tripId) {
      try {
        // Debug: Log before each API call
        const slip = weightSlips[currentIndex];
        console.log('Calling updateOcrData', tripId, slip);
        // Backend expects single correction payload: { documentId, documentType, correctedValues }
        await TripService.updateOcrData(tripId, {
          documentId: slip.documentId || slip._id,
          documentType: 'WEIGHT_CERT',
          correctedValues: {
            origin: slip.origin,
            destination: slip.destination,
            weight: slip.weight || slip.netWeight,
          },
        });

        // Assign routes: backend expects { routeAssignments: [{ weightCertId, routeId, order }] }
        if (slip.routeId) {
          const routeAssignments = [
            {
              // Use _id from GET response for route assignment as requested
              weightCertId: slip._id,
              routeId: slip.routeId,
              order: currentIndex + 1,
            },
          ];
          console.log('Calling assignRoutes', tripId, routeAssignments);
          await TripService.assignRoutes(tripId, { routeAssignments });
        }

        // Enter revenue: backend expects [{ weightCertId, materialType, amountPerKg, totalAmountReceived }]
        if (slip.amountPerKg || slip.totalAmountReceived) {
          const revenues = [
            {
              weightCertId: slip.documentId || slip._id,
              materialType: slip.materialType || '',
              amountPerKg: toNumber(slip.amountPerKg),
              totalAmountReceived: toNumber(slip.totalAmountReceived),
            },
          ];
          console.log('Calling enterRevenue', tripId, revenues);
          await TripService.enterRevenue(tripId, { revenues });
        }

        // Enter expenses: backend expects [{ weightCertId, materialCost, toll, driverCost, driverTripExpense, royalty }]
        if (
          slip.materialCost ||
          slip.toll ||
          slip.driverCost ||
          slip.driverTripExpense ||
          slip.royalty
        ) {
          const expenses = [
            {
              weightCertId: slip.documentId || slip._id,
              materialCost: toNumber(slip.materialCost),
              toll: toNumber(slip.toll),
              driverCost: toNumber(slip.driverCost),
              driverTripExpense: toNumber(slip.driverTripExpense),
              royalty: toNumber(slip.royalty),
            },
          ];
          console.log('Calling enterExpenses', tripId, expenses);
          await TripService.enterExpenses(tripId, { expenses });
        }
        alert('Slip saved and synced to backend!');
      } catch (err) {
        alert('Failed to save slip to backend: ' + (err.message || err));
      }
    } else {
      alert('Slip saved locally! (Trip not yet initialized)');
    }
  }, [currentSlip, currentIndex, updateWeightSlip, tripId, weightSlips]);

  // Bulk Save & Next: Call all APIs in parallel for current slip, using correct payloads
  const handleBulkSaveAndNext = useCallback(async () => {
    if (!currentSlip.weight) {
      alert('Please fill in all required fields:\n- Weight');
      return;
    }

    // OCR payload (single correction expected by backend)
    const ocrPayload = {
      documentId: currentSlip.documentId || currentSlip._id || '',
      documentType: 'WEIGHT_CERT',
      correctedValues: {
        weight: currentSlip.weight,
      },
    };

    // Assign Routes payload
    const routeAssignments = currentSlip.routeId
      ? [{ weightCertId: currentSlip._id, routeId: currentSlip.routeId, order: currentIndex + 1 }]
      : [];
    const assignRoutesPayload = { routeAssignments };

    // Revenue payload
    const revenues = (currentSlip.amountPerKg || currentSlip.totalAmountReceived)
      ? [
          {
            weightCertId: currentSlip.documentId || currentSlip._id,
            materialType: currentSlip.materialType || '',
            amountPerKg: toNumber(currentSlip.amountPerKg),
            totalAmountReceived: toNumber(currentSlip.totalAmountReceived),
          },
        ]
      : [];
    const revenuePayload = { revenues };

    // Expenses payload
    const expenses = (currentSlip.materialCost || currentSlip.toll || currentSlip.driverCost || currentSlip.driverTripExpense || currentSlip.royalty)
      ? [
          {
            weightCertId: currentSlip.documentId || currentSlip._id || '',
            materialCost: toNumber(currentSlip.materialCost),
            toll: toNumber(currentSlip.toll),
            driverCost: toNumber(currentSlip.driverCost),
            driverTripExpense: toNumber(currentSlip.driverTripExpense),
            royalty: toNumber(currentSlip.royalty),
          },
        ]
      : [];
    const expensesPayload = { expenses };

    try {
      await Promise.all([
        TripService.updateOcrData(tripId, ocrPayload),
        routeAssignments.length ? TripService.assignRoutes(tripId, assignRoutesPayload) : Promise.resolve(),
        revenues.length ? TripService.enterRevenue(tripId, revenuePayload) : Promise.resolve(),
        expenses.length ? TripService.enterExpenses(tripId, expensesPayload) : Promise.resolve(),
      ]);
      updateWeightSlip(currentIndex, { isDone: true });
      if (currentIndex < weightSlips.length - 1) {
        handleNextSlip();
      } else {
        // All slips completed, proceed to next phase
        onNextSlip();
      }
    } catch (err) {
      alert('Failed to save slip to backend: ' + (err.message || err));
    }
  }, [currentSlip, currentIndex, tripId, updateWeightSlip, weightSlips.length, handleNextSlip]);

  // Handle completion and move to next phase
  const handleCompleteProcessing = useCallback(() => {
    // Check if all slips are completed
    const allCompleted = weightSlips.every(slip => slip.isDone);
    
    if (!allCompleted) {
      const pending = weightSlips.filter(slip => !slip.isDone).length;
      alert(`Please complete all slips first.\n\nPending: ${pending} slip(s)`);
      return;
    }

    // All slips are done, proceed to next phase
    onNextSlip();
  }, [weightSlips, onNextSlip]);

  // Calculate progress based on completed slips
  const completedSlips = weightSlips.filter(slip => slip.isDone).length;
  const progress = weightSlips.length > 0 ? (completedSlips / weightSlips.length) * 100 : 0;

  // After hooks are declared, guard rendering when tripId or slips are missing
  if (!tripId) {
    return (
      <div className="processing-phase-error">
        <h2>Trip Not Initialized</h2>
        <p>No trip is currently active. Please start a new trip from the beginning.</p>
        <button className="btn btn-primary" onClick={() => {
          localStorage.removeItem('tripId');
          window.location.href = '/trip/new';
        }}>
          Restart Trip Creation
        </button>
      </div>
    );
  }

  if (!currentSlip) {
    if (trip && (!weightSlips || weightSlips.length === 0)) {
      return <div>No weight certificates found for this trip. Please upload documents in Intake Phase.</div>;
    }
    return <div>Loading trip data...</div>;
  }

  return (
    <div className="processing-phase">
      <div className="processing-container">
        {/* Left Panel: Slips List */}
        <aside className="processing-sidebar">
          <SlipsList
            slips={weightSlips}
            currentIndex={currentIndex}
            onSelectSlip={onSelectSlip}
            onPreviewClick={handlePreviewClick}
          />
        </aside>

        {/* Right Panel: Trip Form - Full Width */}
        <aside className="processing-form-panel">
          <div className="form-header">
            <h3>Trip Details for Slip #{currentIndex + 1}</h3>
            <div className="form-status">
              {currentSlip?.isDone ? (
                <span className="status-badge status-done">✓ Completed</span>
              ) : (
                <span className="status-badge status-pending">⏱ In Progress</span>
              )}
            </div>
          </div>

          <div className="form-content-wrapper">
            <TripForm
              slip={currentSlip}
              trip={trip}
              fixedDocs={fixedDocs}
              onUpdate={(data) => updateWeightSlip(currentIndex, data)}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={onPreviousSlip}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleBulkSaveAndNext}
              title="Save this slip and move to next (bulk)"
            >
              Save & Next →
            </button>
          </div>
        </aside>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <ImagePreviewModal
          imageSource={previewImage}
          title={`Weight Slip #${currentIndex + 1}`}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default ProcessingPhase;
