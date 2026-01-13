/**
 * JourneySetupModal Component
 * 
 * Modal for setting up journey-level data (odometer readings, fuel consumption)
 * before processing individual weight slips
 */

import React, { useState, useEffect } from 'react';
import { X, Gauge, Fuel, MapPin, Calculator } from 'lucide-react';
import { TripService } from '../../pages/Trip/services';
import './modal.css';

const JourneySetupModal = ({
  isOpen = true,
  onSave,
  onCancel,
  odometerOcrData,
  fuelSlipData,
  partialFuelData = [],
  selectedVehicle,
  selectedDriver
}) => {

  // Don't render if not open
  if (!isOpen) return null;

  const [journeyData, setJourneyData] = useState({
    startOdometer: 0,
    endOdometer: 0,
    fuelLitres: 0,
    fuelRate: 0,
    fuelLocation: '',
    totalDistance: 0,
    estimatedEfficiency: 0
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [userEditedFields, setUserEditedFields] = useState(new Set());

  console.log('🔍 JourneySetupModal render - Props:', {
    isOpen,
    selectedVehicle,
    selectedDriver,
    odometerOcrData,
    fuelSlipData,
    partialFuelData
  });

  console.log('🎯 JourneySetupModal rendering with state:', { journeyData, loading, errors });
  console.log('📄 OCR Data detailed view:', {
    'odometer.ocrData': odometerOcrData,
    'fuel.ocrData': fuelSlipData,
    'odometer.reading': odometerOcrData?.reading,
    'odometer.extractedData': odometerOcrData?.extractedData,
    'fuel.extractedData': fuelSlipData?.extractedData
  });

  // Fetch start odometer from last fuel log
  useEffect(() => {
    if (isOpen && selectedVehicle?.id) {
      fetchStartOdometer();
    }
  }, [isOpen, selectedVehicle?.id]);

  // Auto-populate from OCR data
  useEffect(() => {
    if (isOpen && (odometerOcrData || fuelSlipData)) {
      console.log('🎯 Auto-populating from OCR data:', { odometerOcrData, fuelSlipData });

      let updates = {};

      // Get end odometer from OCR data - only if user hasn't edited it
      if (odometerOcrData && !userEditedFields.has('endOdometer')) {
        const endOdometerRaw = odometerOcrData?.reading ||
          odometerOcrData?.extractedData?.reading ||
          odometerOcrData?.extractedData?.endOdometer ||
          0;
        const endOdometer = parseFloat(String(endOdometerRaw).replace(/[^\d.]/g, '')) || 0;
        console.log('🚗 End odometer extraction:', {
          raw: endOdometerRaw,
          parsed: endOdometer,
          userEdited: userEditedFields.has('endOdometer'),
          ocrStructure: odometerOcrData
        });

        if (endOdometer > 0) {
          updates.endOdometer = endOdometer;
        }
      }

      // Get fuel data from OCR - fuel data is directly in the root object - only if user hasn't edited
      if (fuelSlipData) {
        if (!userEditedFields.has('fuelLitres')) {
          const litres = parseFloat(
            fuelSlipData?.volume ||
            fuelSlipData?.litres ||
            fuelSlipData?.liters ||
            fuelSlipData?.quantity ||
            fuelSlipData?.extractedData?.volume ||
            fuelSlipData?.extractedData?.litres ||
            0
          );
          if (litres > 0) updates.fuelLitres = litres;
        }

        if (!userEditedFields.has('fuelRate')) {
          const rate = parseFloat(
            fuelSlipData?.rate ||
            fuelSlipData?.price ||
            fuelSlipData?.pricePerLitre ||
            fuelSlipData?.extractedData?.rate ||
            fuelSlipData?.extractedData?.price ||
            0
          );
          if (rate > 0) updates.fuelRate = rate;
        }

        if (!userEditedFields.has('fuelLocation')) {
          const location = fuelSlipData?.location ||
            fuelSlipData?.extractedData?.location ||
            fuelSlipData?.station || '';
          if (location) updates.fuelLocation = location;
        }

        console.log('⛽ Fuel data extraction:', {
          fuelLitres: updates.fuelLitres,
          fuelRate: updates.fuelRate,
          fuelLocation: updates.fuelLocation,
          userEditedFields: Array.from(userEditedFields),
          fuelStructure: fuelSlipData
        });
      }

      console.log('📊 Parsed values for update:', updates);

      if (Object.keys(updates).length > 0) {
        setJourneyData(prev => {
          const newData = { ...prev, ...updates };
          const distance = Math.max(0, newData.endOdometer - newData.startOdometer);
          console.log('🧮 Calculating distance:', {
            start: newData.startOdometer,
            end: newData.endOdometer,
            distance: distance
          });

          const finalData = {
            ...newData,
            totalDistance: distance,
            estimatedEfficiency: newData.fuelLitres > 0 ? distance / newData.fuelLitres : 0
          };

          console.log('✅ Final journey data:', finalData);
          return finalData;
        });
      }
    }
  }, [isOpen, odometerOcrData, fuelSlipData]);

  // Compute partial fills sum and total fuel used (full tank + partials)
  const partialFillsSum = (partialFuelData || []).reduce((sum, pf) => {
    const v = parseFloat(pf?.volume || pf?.litres || pf?.liters || pf?.quantity || pf?.extractedData?.volume || pf?.extractedData?.litres || 0) || 0;
    return sum + v;
  }, 0);

  const totalFuelUsed = Number(journeyData.fuelLitres || 0) + Number(partialFillsSum || 0);

  const fetchStartOdometer = async () => {
    if (!selectedVehicle?.id) {
      console.error('❌ No selectedVehicle.id available:', selectedVehicle);
      return;
    }

    try {
      setLoading(true);
      console.log('🚗 Fetching start odometer for vehicle:', selectedVehicle.id);
      const response = await TripService.getVehicleLastFuelLog(selectedVehicle.id);
      console.log('📊 Start odometer API response:', response);
      const startOdometer = response.data.startOdometer || response.data.odometerReading || 0;
      console.log('🎯 Using start odometer value:', startOdometer);

      setJourneyData(prev => ({
        ...prev,
        startOdometer,
        totalDistance: Math.max(0, prev.endOdometer - startOdometer),
        estimatedEfficiency: prev.fuelLitres > 0 ? Math.max(0, prev.endOdometer - startOdometer) / prev.fuelLitres : 0
      }));

      console.log('✅ Updated journey data with start odometer:', {
        startOdometer,
        endOdometer: journeyData.endOdometer,
        calculatedDistance: Math.max(0, journeyData.endOdometer - startOdometer)
      });
    } catch (error) {
      console.error('Failed to fetch start odometer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    console.log('✏️ User edited field:', field, 'new value:', value);

    // Mark field as user-edited
    setUserEditedFields(prev => new Set(prev).add(field));

    const numericValue = parseFloat(value) || 0;

    setJourneyData(prev => {
      const updated = { ...prev, [field]: numericValue };

      // Recalculate dependent values
      if (field === 'endOdometer' || field === 'startOdometer') {
        updated.totalDistance = Math.max(0, updated.endOdometer - updated.startOdometer);
        updated.estimatedEfficiency = updated.fuelLitres > 0 ? updated.totalDistance / updated.fuelLitres : 0;
      } else if (field === 'fuelLitres') {
        updated.estimatedEfficiency = numericValue > 0 ? updated.totalDistance / numericValue : 0;
      }

      return updated;
    });

    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (journeyData.endOdometer <= journeyData.startOdometer) {
      newErrors.endOdometer = 'End odometer must be greater than start odometer';
    }

    if (journeyData.fuelLitres <= 0) {
      newErrors.fuelLitres = 'Fuel litres must be greater than 0';
    }

    if (journeyData.fuelRate <= 0) {
      newErrors.fuelRate = 'Fuel rate must be greater than 0';
    }

    if (journeyData.endOdometer <= journeyData.startOdometer) {
      newErrors.endOdometer = 'End odometer must be greater than start odometer';
    }

    if (journeyData.totalDistance <= 0) {
      newErrors.totalDistance = 'Total distance must be positive. Check odometer readings.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const mileageData = {
        startOdometer: journeyData.startOdometer,
        endOdometer: journeyData.endOdometer,
        totalDistanceKm: journeyData.totalDistance,
        ocrData: {
          ...odometerOcrData,
          reading: journeyData.endOdometer,
          correctedReading: journeyData.endOdometer !== parseFloat(odometerOcrData?.reading || 0) ? journeyData.endOdometer : null
        }
      };

      const fuelData = {
        tempId: fuelSlipData?.tempId || `temp_fuel_${Date.now()}`,
        fuelType: 'DIESEL',
        fillingType: 'FULL_TANK',
        litres: journeyData.fuelLitres,
        rate: journeyData.fuelRate,
        location: journeyData.fuelLocation,
        odometerReading: journeyData.endOdometer,
        ocrData: {
          ...fuelSlipData,
          extractedData: {
            ...fuelSlipData?.extractedData,
            litres: journeyData.fuelLitres,
            rate: journeyData.fuelRate,
            volume: journeyData.fuelLitres
          }
        }
      };

      onSave({ mileageData, fuelData });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Trip Setup</h2>

          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* Vehicle & Driver Info */}
          <div className="info-section">
            <div className="info-card">
              <strong>Vehicle:</strong> {selectedVehicle?.name} ({selectedVehicle?.registration})
            </div>
            <div className="info-card">
              <strong>Driver:</strong> {selectedDriver?.name}
            </div>
          </div>

          {/* Odometer Section */}
          <div className="form-section">
            <div className="section-header">
              <Gauge size={20} />
              <h3>Odometer Readings</h3>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Start Odometer (km)</label>
                <input
                  type="number"
                  value={journeyData.startOdometer}
                  readOnly
                  className="readonly-input"
                />
                <small>From last fuel log</small>
              </div>

              <div className="form-group">
                <label>End Odometer (km)</label>
                <input
                  type="number"
                  value={journeyData.endOdometer}
                  onChange={(e) => handleInputChange('endOdometer', e.target.value)}
                  className={errors.endOdometer ? 'error' : ''}
                  placeholder="Enter end odometer reading"
                />
                {odometerOcrData?.reading && !userEditedFields.has('endOdometer') && (
                  <small>OCR Reading: {odometerOcrData.reading}</small>
                )}
                {userEditedFields.has('endOdometer') && (
                  <small style={{ color: '#059669' }}>✓ Manually corrected</small>
                )}
                {errors.endOdometer && <span className="error-text">{errors.endOdometer}</span>}
              </div>

              <div className="form-group">
                <label>Total Distance (km)</label>
                <div className="calculated-field">
                  <MapPin size={16} />
                  <span><strong>{journeyData.totalDistance.toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="form-group">
                <label>Fuel Efficiency</label>
                <div className="calculated-field">
                  <Gauge size={16} />
                  <span><strong>{
                    journeyData.totalDistance > 0 && totalFuelUsed > 0
                      ? (journeyData.totalDistance / totalFuelUsed).toFixed(2)
                      : '--'
                  } km/L</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Fuel Section */}
          <div className="form-section">
            <div className="section-header">
              <Fuel size={20} />
              <h3>Fuel Consumption</h3>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Fuel Litres
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>FULL TANK</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={journeyData.fuelLitres}
                  onChange={(e) => handleInputChange('fuelLitres', e.target.value)}
                  className={errors.fuelLitres ? 'error' : ''}
                  placeholder="Enter fuel litres"
                />
                {fuelSlipData?.volume && !userEditedFields.has('fuelLitres') && (
                  <small>OCR Reading: {fuelSlipData.volume} L</small>
                )}
                {userEditedFields.has('fuelLitres') && (
                  <small style={{ color: '#059669' }}>✓ Manually corrected</small>
                )}
                {errors.fuelLitres && <span className="error-text">{errors.fuelLitres}</span>}
              </div>

              <div className="form-group">
                <label>Rate per Litre (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={journeyData.fuelRate}
                  onChange={(e) => handleInputChange('fuelRate', e.target.value)}
                  className={errors.fuelRate ? 'error' : ''}
                  placeholder="Enter rate per litre"
                />
                {fuelSlipData?.rate && !userEditedFields.has('fuelRate') && (
                  <small>OCR Reading: ₹{fuelSlipData.rate}/L</small>
                )}
                {userEditedFields.has('fuelRate') && (
                  <small style={{ color: '#059669' }}>✓ Manually corrected</small>
                )}
                {errors.fuelRate && <span className="error-text">{errors.fuelRate}</span>}
              </div>

              <div className="form-group">
                <label>Fuel Station Location</label>
                <input
                  type="text"
                  value={journeyData.fuelLocation}
                  onChange={(e) => setJourneyData(prev => ({ ...prev, fuelLocation: e.target.value }))}
                  placeholder="Enter fuel station location"
                />
              </div>

              <div className="form-group">
                <label>Total Cost (₹)</label>
                <input
                  type="text"
                  value={`₹${(journeyData.fuelLitres * journeyData.fuelRate).toLocaleString()}`}
                  readOnly
                  className="readonly-input"
                  style={{
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    border: '2px solid #bae6fd',
                    color: '#0c4a6e',
                    fontWeight: '700'
                  }}
                />
              </div>
              {/* Partial fuel slips */}
              {partialFuelData && partialFuelData.length > 0 && (
                <>
                  {partialFuelData.map((pf, idx) => {
                    const volume = parseFloat(pf?.volume || pf?.litres || pf?.liters || pf?.quantity || pf?.extractedData?.volume || pf?.extractedData?.litres || 0) || 0;
                    const rate = parseFloat(pf?.rate || pf?.price || pf?.pricePerLitre || pf?.extractedData?.rate || pf?.extractedData?.price || 0) || 0;
                    const location = pf?.station || pf?.location || pf?.extractedData?.location || `Partial Fill ${idx + 1}`;
                    const cost = volume * rate;

                    return (
                      <React.Fragment key={pf?.tempId || idx}>
                        <div className="form-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Fuel Litres
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>PARTIAL FILL</span>
                          </label>
                          <input
                            type="number"
                            value={volume}
                            readOnly
                            className="readonly-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Rate per Litre (₹)</label>
                          <input
                            type="number"
                            value={rate}
                            readOnly
                            className="readonly-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Fuel Station Location</label>
                          <input
                            type="text"
                            value={location}
                            readOnly
                            className="readonly-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Total Cost (₹)</label>
                          <input
                            type="text"
                            value={`₹${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            readOnly
                            className="readonly-input"
                            style={{
                              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                              border: '2px solid #bae6fd',
                              color: '#0c4a6e',
                              fontWeight: '700'
                            }}
                          />
                        </div>
                      </React.Fragment>
                    );
                  })}
                </>
              )}

              <div className="form-group">
                <label>Total Fuel Used (L)</label>
                <div className="calculated-field">
                  <Fuel size={16} />
                  <span><strong>{totalFuelUsed ? Number(totalFuelUsed).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'} L</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Back to Intake
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Start Processing Weight Slips'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JourneySetupModal;