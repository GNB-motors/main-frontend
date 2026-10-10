import React from 'react';
import NewButton from '@/components/ui/NewButton';
import './FormFooter.css';

const FormFooter = ({
  onCancel,
  onSubmit,
  isSubmitting = false,
  isEdit = false,
  cancelText = 'Cancel',
  submitText = null,
  // When true the action row spans the full width so the buttons sit at the
  // page's right edge instead of the right of a centred 920px block.
  fullWidth = false,
  cancelDisabled = false,
  submitDisabled = false,
  // Extra actions rendered before Cancel (e.g. a "Reset" button).
  children = null,
}) => {
  // The spinner carries the in-flight state now, so the label stays put.
  const defaultSubmitText = isEdit ? 'Save Changes' : 'Add Employee';

  return (
    <div className="form-footer">
      <div className={`form-footer-content${fullWidth ? ' is-full' : ''}`}>
        <div className="form-footer-actions">
          {children}
          <NewButton
            variant="secondary"
            type="button"
            text={cancelText}
            onClick={onCancel}
            disabled={isSubmitting || cancelDisabled}
          />
          <NewButton
            variant="primary"
            type="submit"
            text={submitText || defaultSubmitText}
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={submitDisabled}
          />
        </div>
      </div>
    </div>
  );
};

export default FormFooter;
