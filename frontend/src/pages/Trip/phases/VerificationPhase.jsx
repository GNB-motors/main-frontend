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
  onBack,
  onSubmit,
  isSubmitting,
  onCancel,
  fixedDocs: propsFixedDocs = {},
  weightSlips: propsWeightSlips = []
}) => {
  // Use props directly from parent (TripCreationFlow)
  const [weightSlips] = useState(propsWeightSlips);
  const [fixedDocs] = useState(propsFixedDocs);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageSrc: null,
    title: ''
  });

  // Memoized data validation
  const isDataComplete = useMemo(
    () => {
      if (!weightSlips || weightSlips.length === 0) return false;

      // Check if all weight slips have required data
      return weightSlips.every((slip) => {
        // Check if slip is marked as done
        if (slip.isDone === true) return true;
        
        // Check if slip has required fields - TripForm uses flat property names
        const hasWeights = (slip.grossWeight || slip.weights?.grossWeight) && 
          (slip.tareWeight || slip.weights?.tareWeight) && 
          (slip.netWeight || slip.weights?.netWeight);
        const hasMaterialType = slip.materialType && slip.materialType !== '';
        const hasRoute = slip.routeData && (
          slip.routeData.sourceLocation || 
          slip.routeData.destLocation || 
          Object.keys(slip.routeData).length > 0
        );
        
        return hasWeights && hasMaterialType && hasRoute;
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
        .reduce((sum, slip) => sum + (parseFloat(slip.netWeight || slip.weights?.netWeight || slip.weight) || 0), 0)
        .toFixed(2),
    [weightSlips]
  );

  const revenueSummary = useMemo(() => {
    // Calculate from weight slips - TripForm uses flat property names
    const totalRevenue = weightSlips.reduce((sum, slip) => {
      // TripForm uses totalAmountReceived
      return sum + (parseFloat(slip.totalAmountReceived) || slip.revenue?.actualAmountReceived || 0);
    }, 0);
    
    const totalCalculated = weightSlips.reduce((sum, slip) => {
      // TripForm uses netWeight and amountPerKg
      const netWeight = parseFloat(slip.netWeight) || slip.weights?.netWeight || 0;
      const ratePerKg = parseFloat(slip.amountPerKg) || slip.revenue?.ratePerKg || 0;
      return sum + (netWeight * ratePerKg / 1000); // Convert to calculated amount
    }, 0);
    
    const totalVariance = totalRevenue - totalCalculated;
    
    return {
      totalRevenue,
      totalCalculated,
      totalVariance
    };
  }, [weightSlips]);

  const totalExpense = useMemo(() => {
    // Calculate from weight slips expenses - TripForm uses flat property names
    return weightSlips.reduce((sum, slip) => {
      const slipTotal = (parseFloat(slip.materialCost) || slip.expenses?.materialCost || 0) + 
                       (parseFloat(slip.toll) || slip.expenses?.toll || 0) + 
                       (parseFloat(slip.driverCost) || slip.expenses?.driverCost || 0) + 
                       (parseFloat(slip.driverTripExpense) || slip.expenses?.driverTripExpense || 0) + 
                       (parseFloat(slip.royalty) || slip.expenses?.royalty || 0) + 
                       (parseFloat(slip.otherExpenses) || slip.expenses?.otherExpenses || 0);
      return sum + slipTotal;
    }, 0);
  }, [weightSlips]);

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

    // Call parent's submit handler (from TripCreationFlow)
    if (onSubmit) {
      onSubmit();
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
                  {(fixedDocs.odometer.preview || fixedDocs.odometer.file) ? (
                    <img
                      src={fixedDocs.odometer.preview || URL.createObjectURL(fixedDocs.odometer.file)}
                      alt="Odometer"
                      className="recap-image"
                      onClick={() =>
                        handleShowPreview(
                          fixedDocs.odometer.preview || URL.createObjectURL(fixedDocs.odometer.file), 
                          'Odometer Image'
                        )
                      }
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <button
                    className="btn-preview"
                    onClick={() =>
                      handleShowPreview(
                        fixedDocs.odometer.preview || URL.createObjectURL(fixedDocs.odometer.file), 
                        'Odometer Image'
                      )
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
                  {(fixedDocs.fuel.preview || fixedDocs.fuel.file) ? (
                    <img
                      src={fixedDocs.fuel.preview || URL.createObjectURL(fixedDocs.fuel.file)}
                      alt="Fuel Receipt"
                      className="recap-image"
                      onClick={() =>
                        handleShowPreview(
                          fixedDocs.fuel.preview || URL.createObjectURL(fixedDocs.fuel.file), 
                          'Fuel Receipt Image'
                        )
                      }
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <button
                    className="btn-preview"
                    onClick={() =>
                      handleShowPreview(
                        fixedDocs.fuel.preview || URL.createObjectURL(fixedDocs.fuel.file), 
                        'Fuel Receipt Image'
                      )
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
                      {(fuel?.preview || fuel?.file) ? (
                        <img
                          src={fuel.preview || URL.createObjectURL(fuel.file)}
                          alt={`Partial Fuel ${index + 1}`}
                          className="recap-image-small"
                          onClick={() =>
                            handleShowPreview(
                              fuel.preview || URL.createObjectURL(fuel.file),
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
                            fuel.preview || URL.createObjectURL(fuel.file),
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
                {weightSlips.map((slip, index) => {
                  // Handle file preview - might be .file or .file.preview from different sources
                  const filePreview = slip.file ? (
                    typeof slip.file === 'string' ? slip.file :
                    slip.file.preview ? slip.file.preview :
                    URL.createObjectURL(slip.file)
                  ) : null;
                  
                  // Get weight from either weights object or weight property
                  const weight = slip.weights?.netWeight || slip.weight || 0;
                  
                  return (
                    <tr
                      key={index}
                      className={slip.isDone ? 'row-complete' : 'row-incomplete'}
                    >
                      <td className="slip-number">#{index + 1}</td>
                      <td>
                        <div className="slip-preview-container">
                          {filePreview ? (
                            <img
                              src={filePreview}
                              alt={`Slip ${index + 1}`}
                              className="slip-preview"
                              onClick={() =>
                                handleShowPreview(
                                  filePreview,
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
                                filePreview,
                                `Weight Slip #${index + 1}`
                              )
                            }
                            title="Preview image"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      </td>
                      <td>{slip.origin || (slip.routeData?.sourceLocation ? `${slip.routeData.sourceLocation.city}, ${slip.routeData.sourceLocation.state}` : '—')}</td>
                      <td>{slip.destination || (slip.routeData?.destLocation ? `${slip.routeData.destLocation.city}, ${slip.routeData.destLocation.state}` : '—')}</td>
                      <td className="text-center">{weight} kg</td>
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
                  );
                })}
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
