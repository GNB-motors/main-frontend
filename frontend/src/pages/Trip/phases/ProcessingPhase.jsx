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

const ProcessingPhase = ({
  fixedDocs,
  weightSlips,
  currentIndex,
  updateWeightSlip,
  onNextSlip,
  onPreviousSlip,
  onSelectSlip,
  onCancel
}) => {
  const currentSlip = weightSlips[currentIndex];

  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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

  // Handle save (mark current slip as done)
  const handleSave = useCallback(() => {
    if (!currentSlip.origin || !currentSlip.destination || !currentSlip.weight) {
      alert('Please fill in all required fields:\n- Origin\n- Destination\n- Weight');
      return;
    }

    // Mark current slip as done
    updateWeightSlip(currentIndex, { isDone: true });
    alert('Slip saved successfully!');
  }, [currentSlip, currentIndex, updateWeightSlip]);

  // Handle save and go to next slip
  const handleSaveAndNext = useCallback(() => {
    if (!currentSlip.origin || !currentSlip.destination || !currentSlip.weight) {
      alert('Please fill in all required fields:\n- Origin\n- Destination\n- Weight');
      return;
    }

    // Mark current slip as done
    updateWeightSlip(currentIndex, { isDone: true });
    
    // Move to next slip
    if (currentIndex < weightSlips.length - 1) {
      onNextSlip();
    } else {
      alert('You have reached the last slip. Complete all slips and click "All Complete" to proceed.');
    }
  }, [currentSlip, currentIndex, updateWeightSlip, onNextSlip, weightSlips.length]);

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

  return (
    <div className="processing-phase">
      {/* Header */}
      <div className="processing-header">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p>
          Processing Slip #{currentIndex + 1} of {weightSlips.length}
          <span className="keyboard-hint">• {completedSlips} of {weightSlips.length} completed • Use ← → arrow keys to navigate</span>
        </p>
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
              onClick={handleSaveAndNext}
              disabled={currentIndex === weightSlips.length - 1 && currentSlip?.isDone}
              title="Save this slip and move to next"
            >
              Save & Next →
            </button>
          </div>

          {/* Complete Processing Button */}
          {completedSlips === weightSlips.length && weightSlips.length > 0 && (
            <div className="form-actions form-actions-complete">
              <button 
                className="btn btn-success" 
                onClick={handleCompleteProcessing}
                title="All slips completed. Proceed to verification."
              >
                ✓ All Complete - Go to Verification
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Actions */}
      <div className="processing-footer">
        <button className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
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
