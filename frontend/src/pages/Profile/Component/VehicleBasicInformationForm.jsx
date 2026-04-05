import React, { useState, useEffect, forwardRef } from 'react';
import { Truck } from 'lucide-react';
import '../../Drivers/Component/BasicInformationForm.css';

const VehicleBasicInformationForm = forwardRef(({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  isSubmitting = false,
  isEdit = false 
}, ref) => {
  const [formData, setFormData] = useState({
    registration_no: initialData.registration_no || '',
    chassis_number: initialData.chassis_number || '',
    model: initialData.model || '',
  });

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        registration_no: initialData.registration_no || '',
        chassis_number: initialData.chassis_number || '',
        model: initialData.model || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="basic-info-wrapper">
      <div className="basic-info-outer-container">
        {/* Header Section */}
        <div className="basic-info-header">
          <div className="basic-info-header-content">
            <div className="basic-info-icon-wrapper">
              <Truck size={20} color="#454547" />
            </div>
            <div className="basic-info-title">Basic Information</div>
          </div>
        </div>

        {/* Form Container */}
        <div className="basic-info-container">
          <form ref={ref} onSubmit={handleSubmit} className="basic-info-form">
            {/* Row 1: Registration Number, Chassis Number */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field">
                <label className="basic-info-label">Registration Number *</label>
                <input 
                  type="text"
                  className="basic-info-input"
                  value={formData.registration_no}
                  onChange={(e) => handleInputChange('registration_no', e.target.value)}
                  required
                  placeholder="e.g., WB11F7262"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="basic-info-form-field">
                <label className="basic-info-label">Chassis Number *</label>
                <input 
                  type="text"
                  className="basic-info-input"
                  value={formData.chassis_number}
                  onChange={(e) => handleInputChange('chassis_number', e.target.value)}
                  required
                  placeholder="e.g., MAT828113S2C05629"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Row 2: Model */}
            <div className="basic-info-form-row">
              <div className="basic-info-form-field">
                <label className="basic-info-label">Model *</label>
                <input 
                  type="text"
                  className="basic-info-input"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  required
                  placeholder="e.g., 4830TC, LPT 4830"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

VehicleBasicInformationForm.displayName = 'VehicleBasicInformationForm';

export default VehicleBasicInformationForm;
