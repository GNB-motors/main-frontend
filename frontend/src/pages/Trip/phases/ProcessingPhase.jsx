/**
 * ProcessingPhase Component - Phase 2 of Trip Creation
 * 
 * Side-by-side workspace with two sections:
 * - Left: Scrollable list of weight slips with image previews
 * - Right: Detailed form for current slip
 */


import React, { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import './ProcessingPhase.css';
import SlipsList from '../components/SlipsList';
import TripForm from '../components/TripForm';
import ImagePreviewModal from '../components/ImagePreviewModal';
import RouteCreator from '../../../components/RouteCreator/RouteCreator';
import { Truck, Fuel, Gauge, MapPin, DollarSign } from 'lucide-react';



const ProcessingPhase = ({
  onNextSlip,
  onPreviousSlip,
  onSelectSlip,
  onBackToIntake,
  onCancel,
  weightSlips: propsWeightSlips,
  fixedDocs: propsFixedDocs,
  currentIndex: propsCurrentIndex,
  updateWeightSlip: propsUpdateWeightSlip,
  selectedVehicle,
  journeyData,
}) => {
  // Use props directly
  const [weightSlips, setWeightSlips] = useState(propsWeightSlips || []);
  const [fixedDocs] = useState(propsFixedDocs || {});
  const [currentIndex, setCurrentIndex] = useState(propsCurrentIndex || 0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formErrors, setFormErrors] = useState(new Set());
  const [showValidation, setShowValidation] = useState(false);

  // Update local state when props change
  useEffect(() => {
    if (propsWeightSlips) {
      setWeightSlips(propsWeightSlips);
    }
  }, [propsWeightSlips]);

  useEffect(() => {
    if (typeof propsCurrentIndex === 'number') {
      setCurrentIndex(propsCurrentIndex);
    }
  }, [propsCurrentIndex]);

  // Handle form validation changes
  const handleFormValidationChange = useCallback((isValid, errors) => {
    setIsFormValid(isValid);
    setFormErrors(errors);
  }, []);

  // Helper to coerce values to safe numbers (avoid NaN)
  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Update slip in state (use parent's update function if provided)
  const updateWeightSlip = (idx, data) => {
    if (propsUpdateWeightSlip) {
      propsUpdateWeightSlip(idx, data);
    } else {
      setWeightSlips((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...data };
        return updated;
      });
    }
  };

  // Navigation
  const handleNextSlip = () => {
    if (currentIndex < weightSlips.length - 1) setCurrentIndex(currentIndex + 1);
    if (onNextSlip) onNextSlip();
  };
  const handlePreviousSlip = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      if (onPreviousSlip) onPreviousSlip();
    } else if (currentIndex === 0 && onBackToIntake) {
      // If on first slip, go back to Intake phase
      onBackToIntake();
    }
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
      // Don't handle navigation if user is typing in an input, textarea, or select
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.isContentEditable
      );

      if (isTyping) {
        return; // Let the user type without interference
      }

      if (e.key === 'ArrowRight') {
        if (currentIndex < weightSlips.length - 1) {
          onNextSlip();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          onPreviousSlip();
        }
        // Remove automatic back to Intake on left arrow from first slip
        // User should use the explicit "Back to Intake" button instead
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, weightSlips.length, onNextSlip, onPreviousSlip]);

  // Handle save (mark current slip as done - local state only, no API calls)
  const handleSave = useCallback(async () => {
    if (!currentSlip.origin || !currentSlip.destination || !currentSlip.weight) {
      alert('Please fill in all required fields:\n- Origin\n- Destination\n- Weight');
      return;
    }
    // Mark current slip as done in local state
    updateWeightSlip(currentIndex, { isDone: true });
    alert('Slip saved locally! All data will be submitted at the end.');
  }, [currentSlip, currentIndex, updateWeightSlip]);

  // Bulk Save & Next: Save locally and move to next slip
  const handleBulkSaveAndNext = useCallback(async () => {
    if (!isFormValid) {
      setShowValidation(true);
      const missingFields = Array.from(formErrors).join(', ');
      toast.error(
        `Please fill all required fields before proceeding. Missing: ${missingFields}`,
        {
          position: 'top-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      return;
    }
    setShowValidation(false);

    // Mark current slip as done in local state
    updateWeightSlip(currentIndex, { isDone: true });

    // Show success message
    toast.success('Slip saved successfully!', {
      position: 'top-right',
      autoClose: 2000,
    });

    // Move to next slip or complete processing
    if (currentIndex < weightSlips.length - 1) {
      handleNextSlip();
    } else {
      // All slips completed, proceed to next phase
      onNextSlip();
    }
  }, [currentSlip, currentIndex, updateWeightSlip, weightSlips.length, handleNextSlip, onNextSlip, isFormValid, formErrors]);

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

  // Guard rendering when slips are missing
  if (!currentSlip) {
    if (!weightSlips || weightSlips.length === 0) {
      return <div>No weight certificates found for this trip. Please upload documents in Intake Phase.</div>;
    }
    return <div>Loading trip data...</div>;
  }

  return (
    <div className="processing-phase">
      {/* ── Step progress bar (matches IntakePhase header) ── */}
      <div className="processing-progress-header">
        <div className="processing-progress-track">
          <div className="processing-progress-fill" style={{ width: '50%' }} />
        </div>
      </div>

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
            <div className="form-header-left">
              <h3>Trip Details for Slip #{currentIndex + 1}</h3>
              <span className="slip-progress-pill">
                {currentIndex + 1} / {weightSlips.length} slips
              </span>
            </div>
            <div className="form-header-right">
              {completedSlips > 0 && (
                <span className="slip-done-badge">
                  ✓ {completedSlips}/{weightSlips.length} done
                </span>
              )}
              {currentSlip?.isDone ? (
                <span className="status-badge status-done">✓ Completed</span>
              ) : (
                <span className="status-badge status-pending">⏱ In Progress</span>
              )}
            </div>
          </div>

          {/* Slim slip-level progress bar */}
          <div className="slip-progress-bar-wrap">
            <div
              className="slip-progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="form-content-wrapper">
            {/* Read-only journey summary placed at top of form (uses journeyData from parent) */}
            {journeyData && (
              (() => {
                const startOdometer = journeyData?.mileageData?.startOdometer ?? journeyData?.startOdometer ?? null;
                const endOdometer = journeyData?.mileageData?.endOdometer ?? journeyData?.endOdometer ?? null;
                const totalDistance = journeyData?.mileageData?.totalDistanceKm ?? journeyData?.totalDistance ?? null;
                const fuelLitres = journeyData?.fuelData?.litres ?? journeyData?.fuelLitres ?? 0;
                const fuelRate = journeyData?.fuelData?.rate ?? journeyData?.fuelRate ?? null;

                // Sum partial fuel volumes from fixedDocs.partialFuel (if available)
                const partialSum = (fixedDocs?.partialFuel || []).reduce((s, pf) => {
                  const ocr = pf?.ocrData || pf?.file?.ocrData || {};
                  const v = parseFloat(ocr?.volume || ocr?.litres || ocr?.liters || ocr?.quantity || 0) || 0;
                  return s + v;
                }, 0);

                const totalFuelUsed = Number(fuelLitres || 0) + Number(partialSum || 0);

                const fuelEfficiency = (totalDistance && totalFuelUsed > 0) ? (Number(totalDistance) / Number(totalFuelUsed)) : (journeyData?.fuelData?.efficiency ?? journeyData?.estimatedEfficiency ?? null);

                // Calculate estimated fuel cost for current slip (weighted by distance)
                const totalFuelCost = totalFuelUsed * (Number(fuelRate) || 0);
                const totalRouteDistance = weightSlips.reduce((sum, s) => {
                  return sum + (Number(s.routeData?.actualDistanceKm) || Number(s.routeData?.baseDistanceKm) || 0);
                }, 0);
                const denominatorDistance = totalRouteDistance;
                const currentSlipDistance = Number(currentSlip.routeData?.actualDistanceKm) || Number(currentSlip.routeData?.baseDistanceKm) || 0;
                const estFuelCostForSlip = (denominatorDistance > 0 && totalFuelCost > 0)
                  ? Math.round(((currentSlipDistance / denominatorDistance) * totalFuelCost) * 100) / 100
                  : null;

                const metrics = [
                  { label: 'Start Odo', value: startOdometer !== null ? `${Number(startOdometer).toLocaleString()} km` : '—', icon: <Gauge size={14} /> },
                  { label: 'End Odo', value: endOdometer !== null ? `${Number(endOdometer).toLocaleString()} km` : '—', icon: <Gauge size={14} /> },
                  { label: 'Distance', value: totalDistance !== null ? `${Number(totalDistance).toLocaleString()} km` : '—', icon: <MapPin size={14} /> },
                  { label: 'Fuel used', value: totalFuelUsed > 0 ? `${Number(totalFuelUsed).toLocaleString()} L` : '—', icon: <Fuel size={14} /> },
                  { label: 'Efficiency', value: fuelEfficiency !== null ? `${Number(fuelEfficiency).toFixed(2)} km/L` : '—', icon: <Truck size={14} /> },
                  { label: 'Est. Fuel Cost', value: estFuelCostForSlip !== null ? `₹${Number(estFuelCostForSlip).toLocaleString()}` : '—', icon: <DollarSign size={14} /> },
                ];

                return (
                  <div className="journey-summary-card" aria-hidden>
                    <div className="pp-metric-grid">
                      {metrics.map((m, i) => (
                        <div key={i} className="pp-metric">
                          <div className="pp-metric-header">
                            {m.icon}
                            <span className="pp-metric-label">{m.label}</span>
                          </div>
                          <span className="pp-metric-value">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
            {/* Route Creation Section */}
            <RouteCreator
              routeData={currentSlip.routeData || {}}
              tripType={currentSlip.tripType || 'PICKUP_DROP'}
              onRouteUpdate={(routeData) => updateWeightSlip(currentIndex, { routeData })}
              onTripTypeChange={(tripType) => updateWeightSlip(currentIndex, { tripType })}
            />

            <TripForm
              slip={currentSlip}
              fixedDocs={fixedDocs}
              onUpdate={(data) => updateWeightSlip(currentIndex, data)}
              selectedVehicle={selectedVehicle}
              journeyData={journeyData}
              onValidationChange={handleFormValidationChange}
              showValidation={showValidation}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={handlePreviousSlip}
              title={currentIndex === 0 ? "Go back to Document Intake" : "Go to previous slip"}
            >
              ← {currentIndex === 0 ? 'Back to Intake' : 'Previous'}
            </button>
            <button
              className={`btn ${!isFormValid ? 'btn-secondary disabled' : 'btn-primary'}`}
              onClick={handleBulkSaveAndNext}
              disabled={!isFormValid}
              title={!isFormValid ? "Please fill all required fields" : "Save this slip and move to next (bulk)"}
            >
              Save &amp; Next →
            </button>
          </div>
        </aside>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <ImagePreviewModal
          imageSrc={previewImage}
          title={`Weight Slip #${currentIndex + 1}`}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default ProcessingPhase;
