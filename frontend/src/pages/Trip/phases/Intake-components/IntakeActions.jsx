const IntakeActions = ({
  onCancel,
  onStartProcessing,
  isIntakeLoading,
  ocrScanning,
  weightSlipScanning
}) => {
  return (
    <div className="intake-actions">
      <button className="btn btn-secondary" onClick={onCancel}>
        Cancel
      </button>
      <button
        className="btn btn-primary"
        onClick={onStartProcessing}
        disabled={isIntakeLoading || ocrScanning.odometer || ocrScanning.fuel || weightSlipScanning.some(s => s)}
      >
        {isIntakeLoading
          ? 'Initializing Trip...'
          : (ocrScanning.odometer || ocrScanning.fuel || weightSlipScanning.some(s => s))
            ? 'Scanning Documents...'
            : 'Start Processing'}
      </button>
    </div>
  );
};

export default IntakeActions;