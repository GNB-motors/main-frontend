/**
 * ProcessingPhase Component - Phase 2 of Trip Creation
 * 
 * Side-by-side workspace with two sections:
 * - Left: Scrollable list of weight slips with image previews
 * - Right: Detailed form for current slip
 */


import React, { useState, useCallback, useEffect, useRef } from 'react';
import './ProcessingPhase.css';
import SlipsList from '../components/SlipsList';
import TripForm from '../components/TripForm';
import ImagePreviewModal from '../components/ImagePreviewModal';
import RouteCreator from '../../../components/RouteCreator/RouteCreator';



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
}) => {
  // Use props directly
  const [weightSlips, setWeightSlips] = useState(propsWeightSlips || []);
  const [fixedDocs] = useState(propsFixedDocs || {});
  const [currentIndex, setCurrentIndex] = useState(propsCurrentIndex || 0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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
    if (!currentSlip.weight) {
      alert('Please fill in weight field');
      return;
    }

    // Mark current slip as done in local state
    updateWeightSlip(currentIndex, { isDone: true });
    
    // Move to next slip or complete processing
    if (currentIndex < weightSlips.length - 1) {
      handleNextSlip();
    } else {
      // All slips completed, proceed to next phase
      onNextSlip();
    }
  }, [currentSlip, currentIndex, updateWeightSlip, weightSlips.length, handleNextSlip, onNextSlip]);

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
