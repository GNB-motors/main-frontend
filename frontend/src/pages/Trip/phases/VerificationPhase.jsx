/**
 * VerificationPhase Component - Phase 3 of Trip Creation
 * 
 * Final verification screen with:
 * - Document recap (odometer, fuel receipts)
 * - Master table of all weight slips
 * - Completion stats
 * - Submit action to backend
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import './VerificationPhase.css';
import ImagePreviewModal from '../components/ImagePreviewModal';

const VerificationPhase = ({
  fixedDocs,
  weightSlips,
  onBack,
  onSubmit,
  isSubmitting,
  onCancel
}) => {
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageSrc: null,
    title: ''
  });

  // Memoized data validation
  const isDataComplete = useMemo(
    () => weightSlips.every(slip => slip.isDone && slip.origin && slip.destination && slip.weight),
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

    try {
      await onSubmit();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit. Please try again.');
    }
  }, [isDataComplete, onSubmit]);

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
                  <img
                    src={fixedDocs.odometer.preview}
                    alt="Odometer"
                    className="recap-image"
                    onClick={() =>
                      handleShowPreview(fixedDocs.odometer.preview, 'Odometer Image')
                    }
                  />
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
                  <img
                    src={fixedDocs.fuel.preview}
                    alt="Fuel Receipt"
                    className="recap-image"
                    onClick={() =>
                      handleShowPreview(fixedDocs.fuel.preview, 'Fuel Receipt Image')
                    }
                  />
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
          disabled={!isDataComplete || isSubmitting}
          title={
            !isDataComplete
              ? 'Complete all slips before submitting'
              : 'Submit trip data'
          }
        >
          {isSubmitting ? 'Submitting...' : '✓ Submit'}
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
