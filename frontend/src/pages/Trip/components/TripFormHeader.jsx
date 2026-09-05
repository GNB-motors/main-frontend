/**
 * TripFormHeader Component
 *
 * Presentational header for the trip form page: page title, "Next Step" CTA,
 * and the Step 1 of 4 progress indicator.
 *
 * All state and navigation logic live in TripFormPage; this component only
 * renders the markup wired through props.
 */

const TripFormHeader = ({ isEditMode, navigate }) => (
  /* Modern Header */
  <div className="modern-page-header">
    <div className="modern-header-top">
      <h1 className="modern-page-title">{isEditMode ? 'Step 1: Edit Document Intake' : 'Step 1: Document Intake & OCR Preview'}</h1>
      <button className="btn-primary" onClick={() => navigate('/trip-management')} style={{ background: '#2563eb' }}>
          Next Step
      </button>
    </div>
    {!isEditMode && (
      <div className="modern-progress-bar-container">
        <span className="modern-progress-text">Step 1 of 4</span>
        <div className="modern-progress-track">
          <div className="modern-progress-fill" style={{ width: '25%' }}></div>
        </div>
      </div>
    )}
  </div>
);

export default TripFormHeader;
