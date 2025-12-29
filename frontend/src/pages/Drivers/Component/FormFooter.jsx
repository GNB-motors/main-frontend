import React from 'react';
import './FormFooter.css';

const FormFooter = ({ 
  onCancel, 
  onSubmit, 
  isSubmitting = false, 
  isEdit = false,
  cancelText = 'Cancel',
  submitText = null
}) => {
  const defaultSubmitText = isSubmitting 
    ? (isEdit ? 'Saving...' : 'Adding...') 
    : (isEdit ? 'Save Changes' : 'Add Employee');

  return (
    <div className="form-footer">
      <div className="form-footer-content">
        <div className="form-footer-actions">
          <button 
            type="button" 
            className="form-footer-btn form-footer-btn-secondary" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </button>
          <button 
            type="submit" 
            className="form-footer-btn form-footer-btn-primary"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {submitText || defaultSubmitText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormFooter;
