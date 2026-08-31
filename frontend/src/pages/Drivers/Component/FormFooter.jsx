import React from 'react';
import NewButton from '@/components/ui/NewButton';
import './FormFooter.css';

const FormFooter = ({ 
  onCancel, 
  onSubmit, 
  isSubmitting = false, 
  isEdit = false,
  cancelText = 'Cancel',
  submitText = null
}) => {
  // The spinner carries the in-flight state now, so the label stays put.
  const defaultSubmitText = isEdit ? 'Save Changes' : 'Add Employee';

  return (
    <div className="form-footer">
      <div className="form-footer-content">
        <div className="form-footer-actions">
          <NewButton
            variant="secondary"
            type="button"
            text={cancelText}
            onClick={onCancel}
            disabled={isSubmitting}
          />
          <NewButton
            variant="primary"
            type="submit"
            text={submitText || defaultSubmitText}
            onClick={onSubmit}
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default FormFooter;
