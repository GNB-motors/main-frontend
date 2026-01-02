

import React, { useState, useCallback } from 'react';
import '../../../components/DropZone/DropZone.css';
import './IntakePhase.css';

// Import new components
import VehicleDriverSelection from './Intake-components/VehicleDriverSelection';
import FixedDocumentsSection from './Intake-components/FixedDocumentsSection';
import WeightSlipsSection from './Intake-components/WeightSlipsSection';
import PartialFuelSection from './Intake-components/PartialFuelSection';
import IntakeActions from './Intake-components/IntakeActions';
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

  // Weight slip OCR states (shared with WeightSlipsSection)
  const [weightSlipOcrResults, setWeightSlipOcrResults] = useState([]); // Array matching weightSlips indices
  const [weightSlipScanning, setWeightSlipScanning] = useState([]); // Array of boolean for each slip

  // OCR Preview Modal State
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [selectedOcrData, setSelectedOcrData] = useState(null);
  const [selectedOcrType, setSelectedOcrType] = useState('');

  // Open OCR preview modal
  const openOcrPreview = useCallback((type, data) => {
    setSelectedOcrType(type);
    setSelectedOcrData(data);
    setShowOcrModal(true);
  }, []);

  return (
    <div className="intake-phase">
      {/* Vehicle & Driver Selection */}
      <VehicleDriverSelection
        selectedVehicle={selectedVehicle}
        setSelectedVehicle={setSelectedVehicle}
        selectedDriver={selectedDriver}
        setSelectedDriver={setSelectedDriver}
      />

      {/* Header */}
      <div className="intake-header">
        <p>Please sort your documents into the correct categories. Start with the fixed documents.</p>
      </div>

      {/* Fixed Documents Row */}
      <FixedDocumentsSection
        fixedDocs={fixedDocs}
        setFixedDocs={setFixedDocs}
        ocrScanning={ocrScanning}
        setOcrScanning={setOcrScanning}
        onOcrPreview={openOcrPreview}
      />

      {/* Dynamic Weight Slips Section */}
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

      {/* Partial Fill Fuel Receipts Section */}
      <PartialFuelSection
        fixedDocs={fixedDocs}
        setFixedDocs={setFixedDocs}
        onOcrPreview={openOcrPreview}
      />

      {/* Action Buttons */}
      <IntakeActions
        onCancel={onCancel}
        onStartProcessing={onStartProcessing}
        isIntakeLoading={isIntakeLoading}
        ocrScanning={ocrScanning}
        weightSlipScanning={weightSlipScanning}
      />

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
