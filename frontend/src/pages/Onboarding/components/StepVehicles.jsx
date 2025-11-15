import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { VehicleService } from '../../../pages/Profile/VehicleService.jsx';
import { Plus, Trash2 } from 'lucide-react';

const StepVehicles = ({ onNext, onBack, onDataChange, formData }) => {
    const [vehicles, setVehicles] = useState([
        { registration_no: '', vehicle_type: 'Truck', chassis_number: '' }
    ]);

    const vehicleTypes = ['Truck', 'Van', 'Car', 'Other'];

    useEffect(() => {
        // Load from localStorage if available
        const savedData = localStorage.getItem('onboardingVehicles');
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
        // Check if at least one vehicle has all fields filled
        const completeVehicles = vehicles.filter(v => 
            v.registration_no.trim() && v.vehicle_type.trim()
        );

        if (completeVehicles.length === 0) {
            toast.error('Please add at least one vehicle with registration number and type');
            return false;
        }

        // Check for incomplete vehicles (partially filled)
        const incompleteVehicles = vehicles.filter(v => 
            (v.registration_no.trim() || v.chassis_number.trim()) && !v.vehicle_type.trim()
        );

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

        // Filter out empty vehicles
        const validVehicles = vehicles.filter(v => 
            v.registration_no.trim() && v.vehicle_type.trim()
        );

        // Save to localStorage
        const vehicleData = { vehicles: validVehicles };
        localStorage.setItem('onboardingVehicles', JSON.stringify(vehicleData));

        // SYMBOLIC SAVE: Try to post vehicles but treat as symbolic
        try {
            const businessRefId = localStorage.getItem('profile_business_ref_id');
            const token = localStorage.getItem('authToken');

            if (businessRefId && token) {
                // Try to add vehicles one by one
                for (const vehicle of validVehicles) {
                    try {
                        await VehicleService.addVehicle(businessRefId, vehicle, token);
                    } catch (error) {
                        console.log('Vehicle add symbolic save:', error);
                    }
                }
            }

            toast.info('✓ Vehicles saved locally (backend updates disabled)', {
                autoClose: 2000
            });
        } catch (error) {
            console.log('Vehicles update symbolic save:', error);
            toast.info('✓ Vehicles saved locally (backend updates disabled)', {
                autoClose: 2000
            });
        }

        // Mark onboarding as complete in localStorage
        localStorage.setItem('onboardingCompleted', 'true');

        onNext();
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
                                Chassis Number <span className="optional">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                id={`chassis-${index}`}
                                className="form-input"
                                value={vehicle.chassis_number}
                                onChange={(e) => handleVehicleChange(index, 'chassis_number', e.target.value)}
                                placeholder="e.g., MAT828113S2C05629"
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

            <div className="step-notice">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z" fill="#F59E0B"/>
                </svg>
                <span>Changes are saved locally. Backend editing is currently disabled.</span>
            </div>

            <div className="step-actions">
                <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={onBack}
                >
                    Back
                </button>
                <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleFinish}
                >
                    Complete Setup
                </button>
            </div>
        </div>
    );
};

export default StepVehicles;
