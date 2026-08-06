import React from 'react';
import { Button } from '@/components/ui/button';
import './FormFooter.css';

/**
 * Renders inside the <form>, so the submit button fires natively — no formRef
 * and dispatchEvent needed. Position is fixed, so its place in the DOM has no
 * bearing on layout.
 */
const FormFooter = ({ onCancel, isSubmitting = false, submitText = 'Save', cancelText = 'Cancel' }) => (
  <div className="khata-form-footer">
    <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={isSubmitting}>
      {cancelText}
    </Button>
    <Button
      type="submit"
      size="lg"
      disabled={isSubmitting}
      style={{ backgroundColor: 'var(--primary-color, #4f46e5)', color: '#fff' }}
    >
      {submitText}
    </Button>
  </div>
);

export default FormFooter;
