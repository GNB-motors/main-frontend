import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import { OnboardingService } from '../OnboardingService';

const StepVehicles = ({ onNext, onBack, onDataChange, formData }) => {
    const [vehicles, setVehicles] = useState([
        { registration_no: '', vehicle_type: 'Truck', chassis_number: '' }
    ]);

    const vehicleTypes = ['Truck', 'Van', 'Car', 'Other'];

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Load from sessionStorage if available
        const savedData = sessionStorage.getItem('onboardingVehicles');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.vehicles && parsed.vehicles.length > 0) {
                setVehicles(parsed.vehicles);
            }
        }
    }, []);

    // Update parent component when data changes - REMOVE onDataChange from dependencies
    useEffect(() => {
        if (vehicles && vehicles.length > 0) {
            onDataChange({ vehicles });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicles]);

    const handleVehicleChange = (index, field, value) => {
        const updatedVehicles = [...vehicles];
        updatedVehicles[index][field] = value;
        setVehicles(updatedVehicles);
    };

    const addVehicle = () => {
        setVehicles([
            ...vehicles,
            { registration_no: '', vehicle_type: 'Truck', chassis_number: '' }
        ]);
    };

    const removeVehicle = (index) => {
        if (vehicles.length > 1) {
            const updatedVehicles = vehicles.filter((_, i) => i !== index);
            setVehicles(updatedVehicles);
        } else {
            toast.warning('You must have at least one vehicle');
        }
    };

    const validateVehicles = () => {
        // Require registration number, vehicle type, and chassis number
        const completeVehicles = vehicles.filter(v => 
            v.registration_no.trim() && v.vehicle_type.trim() && v.chassis_number.trim()
        );

        if (completeVehicles.length === 0) {
            toast.error('Please add at least one vehicle with registration number, type, and chassis number');
            return false;
        }

        // Check for incomplete vehicles (any partially filled set)
        const incompleteVehicles = vehicles.filter(v => {
            const hasAny = v.registration_no.trim() || v.vehicle_type.trim() || v.chassis_number.trim();
            const missingAny = !v.registration_no.trim() || !v.vehicle_type.trim() || !v.chassis_number.trim();
            return hasAny && missingAny;
        });

        if (incompleteVehicles.length > 0) {
            toast.error('Please complete all vehicle fields or remove incomplete entries');
            return false;
        }

        return true;
    };

    const handleFinish = async () => {
        if (!validateVehicles()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Filter out empty vehicles
            const validVehicles = vehicles.filter(v => 
                v.registration_no.trim() && v.vehicle_type.trim() && v.chassis_number.trim()
            );

            // Save to sessionStorage
            const vehicleData = { vehicles: validVehicles };
            sessionStorage.setItem('onboardingVehicles', JSON.stringify(vehicleData));

            // Get profile and company data from sessionStorage
            const profileData = JSON.parse(sessionStorage.getItem('onboardingProfile') || '{}');
            const companyData = JSON.parse(sessionStorage.getItem('onboardingCompany') || '{}');

            // Get orgId and token from localStorage
            const token = localStorage.getItem('authToken');
            const orgId = localStorage.getItem('user_orgId');
            
            if (!token) {
                throw new Error('Authentication token not found');
            }
            
            if (!orgId) {
                throw new Error('Organization ID not found');
            }

            // Prepare complete onboarding payload
            const onboardingPayload = {
                // User profile data (for /auth/me endpoint)
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                primaryThemeColor: companyData.selectedColor || '#FF5733',
                // Organization data (for /admin/organizations/:id endpoint)
                companyName: companyData.companyName || '',
                gstin: companyData.gstin || ''
            };

            // Submit to backend using the service method that handles both API calls
            const result = await OnboardingService.completeOnboarding(onboardingPayload, token, orgId);
            
            console.log('Onboarding result:', result);

            // Mark onboarding as complete
            localStorage.setItem('onboardingCompleted', 'true');
            
            // Clear sessionStorage
            sessionStorage.removeItem('onboardingStep');
            sessionStorage.removeItem('onboardingProfile');
            sessionStorage.removeItem('onboardingCompany');
            sessionStorage.removeItem('onboardingVehicles');
            sessionStorage.removeItem('onboardingUser');

            toast.success('Onboarding completed successfully!', { autoClose: 2000 });
            onNext();
        } catch (error) {
            console.error('Onboarding submission failed:', error);
            const errorMsg = error.detail || error.message || 'Failed to complete onboarding';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="step-container">
            <div className="step-header">
                <h2>Add Your Vehicles</h2>
                <p className="step-description">
                    Add the vehicles you'll be managing in your fleet
                </p>
            </div>

            <div className="form-section">
                {vehicles.map((vehicle, index) => (
                    <div key={index} className="vehicle-card">
                        <div className="vehicle-card-header">
                            <h4>Vehicle {index + 1}</h4>
                            {vehicles.length > 1 && (
                                <button
                                    type="button"
                                    className="btn-icon btn-danger"
                                    onClick={() => removeVehicle(index)}
                                    title="Remove Vehicle"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor={`registration-${index}`}>
                                    Registration Number <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id={`registration-${index}`}
                                    className="form-input"
                                    value={vehicle.registration_no}
                                    onChange={(e) => handleVehicleChange(index, 'registration_no', e.target.value)}
                                    placeholder="e.g., KA01AB1234"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor={`type-${index}`}>
                                    Vehicle Type <span className="required">*</span>
                                </label>
                                <select
                                    id={`type-${index}`}
                                    className="form-input"
                                    value={vehicle.vehicle_type}
                                    onChange={(e) => handleVehicleChange(index, 'vehicle_type', e.target.value)}
                                    required
                                >
                                    {vehicleTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor={`chassis-${index}`}>
                                Chassis Number <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id={`chassis-${index}`}
                                className="form-input"
                                value={vehicle.chassis_number}
                                onChange={(e) => handleVehicleChange(index, 'chassis_number', e.target.value)}
                                placeholder="e.g., MAT828113S2C05629"
                                required
                            />
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    className="btn btn-secondary btn-add-vehicle"
                    onClick={addVehicle}
                >
                    <Plus size={18} />
                    Add Another Vehicle
                </button>
            </div>

            <div className="step-notice" style={{ backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z" fill="#10B981"/>
                </svg>
                <span>Vehicles will be saved to your profile when you complete setup.</span>
            </div>

            <div className="step-actions">
                <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={onBack}
                    disabled={isSubmitting}
                >
                    Back
                </button>
                <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleFinish}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
                </button>
            </div>
        </div>
    );
};

export default StepVehicles;