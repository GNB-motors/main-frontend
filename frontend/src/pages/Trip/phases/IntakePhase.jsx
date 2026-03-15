
import React, { useState, useCallback } from 'react';
import './IntakePhase.css';

// Import new components
import VehicleDriverSelection from './Intake-components/VehicleDriverSelection';
import FixedDocumentsSection from './Intake-components/FixedDocumentsSection';
import WeightSlipsSection from './Intake-components/WeightSlipsSection';
import PartialFuelSection from './Intake-components/PartialFuelSection';
import OcrPreviewModal from './Intake-components/OcrPreviewModal';

const IntakePhase = ({
  fixedDocs,
  setFixedDocs,
  weightSlips,
  setWeightSlips,
  selectedVehicle,
  setSelectedVehicle,
  selectedDriver,
  setSelectedDriver,
  onStartProcessing,
  onCancel,
  isIntakeLoading
}) => {
  // OCR Scanning States (shared across components)
  const [ocrScanning, setOcrScanning] = useState({
    odometer: false,
    fuel: false,
  });

  // Weight slip OCR states
  const [weightSlipOcrResults, setWeightSlipOcrResults] = useState([]);
  const [weightSlipScanning, setWeightSlipScanning] = useState([]);

  // OCR Preview Modal State
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [selectedOcrData, setSelectedOcrData] = useState(null);
  const [selectedOcrType, setSelectedOcrType] = useState('');

  const openOcrPreview = useCallback((type, data) => {
    setSelectedOcrType(type);
    setSelectedOcrData(data);
    setShowOcrModal(true);
  }, []);

  const isAnyScanning = ocrScanning.odometer || ocrScanning.fuel || weightSlipScanning.some(s => s);

  return (
    <div className="intake-page-bg">
      <div className="intake-card">

        {/* ── Progress Bar (merged below nav) ── */}
        <div className="intake-card-header">
          <div className="intake-progress-track">
            <div className="intake-progress-fill" style={{ width: '25%' }} />
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="intake-card-body">

          {/* Trip Details & Selections */}
          <div className="intake-section-card">
            <h2 className="intake-section-title">Trip Details &amp; Selections</h2>
            <VehicleDriverSelection
              selectedVehicle={selectedVehicle}
              setSelectedVehicle={setSelectedVehicle}
              selectedDriver={selectedDriver}
              setSelectedDriver={setSelectedDriver}
            />
          </div>

          {/* Instruction */}
          <p className="intake-instruction">
            Please sort your documents into the correct categories. Start with the fixed documents.
          </p>

          {/* Fixed Documents (Slot A & B) */}
          <FixedDocumentsSection
            fixedDocs={fixedDocs}
            setFixedDocs={setFixedDocs}
            ocrScanning={ocrScanning}
            setOcrScanning={setOcrScanning}
            onOcrPreview={openOcrPreview}
          />

          {/* Weight Slips (Slot C) */}
          <WeightSlipsSection
            weightSlips={weightSlips}
            setWeightSlips={setWeightSlips}
            weightSlipScanning={weightSlipScanning}
            setWeightSlipScanning={setWeightSlipScanning}
            weightSlipOcrResults={weightSlipOcrResults}
            setWeightSlipOcrResults={setWeightSlipOcrResults}
            fixedDocs={fixedDocs}
            onOcrPreview={openOcrPreview}
          />

          {/* Partial Fill Fuel (Slot D) */}
          <PartialFuelSection
            fixedDocs={fixedDocs}
            setFixedDocs={setFixedDocs}
            onOcrPreview={openOcrPreview}
          />

        </div>

        {/* ── Card Footer ── */}
        <div className="intake-card-footer">
          <button className="intake-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="intake-start-btn"
            onClick={onStartProcessing}
            disabled={isAnyScanning || isIntakeLoading}
          >
            {isIntakeLoading
              ? 'Initializing...'
              : isAnyScanning
                ? 'Scanning Documents...'
                : 'Start Processing'}
          </button>
        </div>

      </div>

      {/* OCR Data Preview Modal */}
      <OcrPreviewModal
        showOcrModal={showOcrModal}
        setShowOcrModal={setShowOcrModal}
        selectedOcrData={selectedOcrData}
        selectedOcrType={selectedOcrType}
      />
    </div>
  );
};

export default IntakePhase;
