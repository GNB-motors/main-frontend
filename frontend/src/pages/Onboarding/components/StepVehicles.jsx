import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import { OnboardingService } from '../OnboardingService';

const StepVehicles = ({ onNext, onBack, onDataChange, formData }) => {
    const [vehicles, setVehicles] = useState([
        { registration_no: '', vehicle_type: 'Truck', chassis_number: '', custom_vehicle_type: '' }
    ]);

    const vehicleTypes = [
        'Light Commercial Trucks',
        'Trucks',
        'Medium Duty Trucks',
        'Heavy Duty Trucks',
        'Multi-Axle Trucks',
        'Dumpers',
        'Trailers',
        'Other'
    ];

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

    // Update parent component when data changes
    useEffect(() => {
        onDataChange({ vehicles });
    }, [vehicles, onDataChange]);

    const handleVehicleChange = (index, field, value) => {
        const updatedVehicles = [...vehicles];
        updatedVehicles[index][field] = value;
        setVehicles(updatedVehicles);
    };

    const addVehicle = () => {
        setVehicles([
            ...vehicles,
            { registration_no: '', vehicle_type: 'Light Commercial Trucks', chassis_number: '', custom_vehicle_type: '' }
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
        const completeVehicles = vehicles.filter(v => {
            const hasBasicFields = v.registration_no.trim() && v.vehicle_type.trim() && v.chassis_number.trim();
            // If vehicle type is "Other", also require custom_vehicle_type
            if (v.vehicle_type === 'Other') {
                return hasBasicFields && v.custom_vehicle_type && v.custom_vehicle_type.trim();
            }
            return hasBasicFields;
        });

        if (completeVehicles.length === 0) {
            toast.error('Please add at least one vehicle with registration number, type, and chassis number');
            return false;
        }

        // Check for incomplete vehicles (any partially filled set)
        const incompleteVehicles = vehicles.filter(v => {
            const hasAny = v.registration_no.trim() || v.vehicle_type.trim() || v.chassis_number.trim() || (v.custom_vehicle_type && v.custom_vehicle_type.trim());
            const missingAny = !v.registration_no.trim() || !v.vehicle_type.trim() || !v.chassis_number.trim() || (v.vehicle_type === 'Other' && (!v.custom_vehicle_type || !v.custom_vehicle_type.trim()));
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
            // Filter out empty vehicles and prepare them for submission
            const validVehicles = vehicles.filter(v => {
                const hasBasicFields = v.registration_no.trim() && v.vehicle_type.trim() && v.chassis_number.trim();
                if (v.vehicle_type === 'Other') {
                    return hasBasicFields && v.custom_vehicle_type && v.custom_vehicle_type.trim();
                }
                return hasBasicFields;
            }).map(v => {
                // If vehicle type is "Other", use the custom type value
                if (v.vehicle_type === 'Other' && v.custom_vehicle_type) {
                    return {
                        registration_no: v.registration_no,
                        vehicle_type: v.custom_vehicle_type,
                        chassis_number: v.chassis_number
                    };
                }
                return {
                    registration_no: v.registration_no,
                    vehicle_type: v.vehicle_type,
                    chassis_number: v.chassis_number
                };
            });

            // Save to sessionStorage
            const vehicleData = { vehicles: validVehicles };
            sessionStorage.setItem('onboardingVehicles', JSON.stringify(vehicleData));

            // Get profile and company data from sessionStorage
            const profileData = JSON.parse(sessionStorage.getItem('onboardingProfile') || '{}');
            const companyData = JSON.parse(sessionStorage.getItem('onboardingCompany') || '{}');

            // Prepare payload for backend
            const onboardingPayload = {
                profile: {
                    business_name: companyData.companyName,
                    profile_color: companyData.selectedColor || null,
                },
                vehicles: validVehicles,
            };

            // Get auth token
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Submit to backend
            const result = await OnboardingService.completeOnboarding(onboardingPayload, token);
            
            // Store the generated business_ref_id in localStorage (persistent)
            if (result.business_ref_id) {
                localStorage.setItem('profile_business_ref_id', result.business_ref_id);
            }

            // Mark onboarding as complete
            localStorage.setItem('onboardingCompleted', 'true');
            
            // Clear sessionStorage
            sessionStorage.removeItem('onboardingStep');
            sessionStorage.removeItem('onboardingProfile');
            sessionStorage.removeItem('onboardingCompany');
            sessionStorage.removeItem('onboardingVehicles');

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

                        {vehicle.vehicle_type === 'Other' && (
                            <div className="form-group">
                                <label htmlFor={`custom-type-${index}`}>
                                    Specify Vehicle Type <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id={`custom-type-${index}`}
                                    className="form-input"
                                    value={vehicle.custom_vehicle_type || ''}
                                    onChange={(e) => handleVehicleChange(index, 'custom_vehicle_type', e.target.value)}
                                    placeholder="Enter vehicle type (e.g., Bus, Tractor, etc.)"
                                    required
                                />
                            </div>
                        )}

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
