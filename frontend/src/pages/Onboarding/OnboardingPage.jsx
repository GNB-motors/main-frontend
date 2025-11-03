import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingPage.css';
// Import the service
import { OnboardingService } from './OnboardingService.jsx';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [businessName, setBusinessName] = useState('');
    const [vehicles, setVehicles] = useState([{ registration_no: '', vehicle_type: '', chassis_number: '' }]);
    const [primaryThemeColor, setPrimaryThemeColor] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Color Helper Function ---
    const getColorValue = (colorName) => {
        const colorMap = {
            'Blue': '#3B82F6',
            'Yellow': '#F59E0B',
            'Red': '#EF4444',
            'Black': '#1F2937',
            'Green': '#10B981'
        };
        return colorMap[colorName] || '#3B82F6';
    };

    // --- Vehicle Input Handlers ---
    const handleVehicleChange = (index, field, value) => {
        const updatedVehicles = [...vehicles];
        updatedVehicles[index][field] = value;
        setVehicles(updatedVehicles);
    };

    const addVehicleInput = () => {
        setVehicles([...vehicles, { registration_no: '', vehicle_type: '', chassis_number: '' }]);
    };

    const removeVehicleInput = (index) => {
        if (vehicles.length > 1) {
            const updatedVehicles = vehicles.filter((_, i) => i !== index);
            setVehicles(updatedVehicles);
        }
    };

    // --- Form Submission ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        // Basic validation
        if (!businessName.trim()) {
            setError('Please enter a business name.');
            return;
        }
        if (!primaryThemeColor.trim()) {
            setError('Please select a primary theme color.');
            return;
        }
        // Enhanced validation for vehicles - all fields are now required
        const validVehicles = vehicles.filter(v => 
            v.registration_no.trim() && 
            v.vehicle_type.trim() && 
            v.chassis_number.trim()
        );
        
        if (validVehicles.length === 0) {
            setError('Please add at least one vehicle with all required fields: Registration Number, Vehicle Type, and Chassis Number.');
            return;
        }
        
        // Check if any vehicle is missing required fields
        const incompleteVehicles = vehicles.filter(v => 
            v.registration_no.trim() || v.vehicle_type.trim() || v.chassis_number.trim()
        ).filter(v => 
            !v.registration_no.trim() || !v.vehicle_type.trim() || !v.chassis_number.trim()
        );
        
        if (incompleteVehicles.length > 0) {
            setError('All vehicle fields are required: Registration Number, Vehicle Type, and Chassis Number.');
            return;
        }

        setIsLoading(true);

        const onboardingData = {
            profile: {
                business_name: businessName,
                profile_color: primaryThemeColor,
            },
            vehicles: validVehicles.map(v => ({
                registration_no: v.registration_no,
                vehicle_type: v.vehicle_type,
                chassis_number: v.chassis_number,
            }))
        };

        console.log("Submitting Onboarding Data:", onboardingData);
        console.log("Profile Color Selected:", primaryThemeColor);

        // --- Integrate API call ---
        try {
            // Get the token stored during login
            const token = localStorage.getItem('authToken');
            if (!token) {
                // Handle case where token is missing (e.g., redirect to login)
                setError('Authentication token not found. Please log in again.');
                setIsLoading(false);
                // Optional: navigate('/login');
                return;
            }

            // Call the service function
            const profileData = await OnboardingService.completeOnboarding(onboardingData, token);

            console.log("Onboarding successful:", profileData);
            // Store individual profile fields in localStorage
            localStorage.setItem('profile_id', profileData.id);
            localStorage.setItem('profile_user_id', profileData.user_id);
            localStorage.setItem('profile_company_name', profileData.business_name);
            localStorage.setItem('profile_business_ref_id', profileData.business_ref_id);
            localStorage.setItem('profile_color', profileData.profile_color);
            localStorage.setItem('profile_is_onboarded', 'true');
            localStorage.setItem('profile_is_superadmin', 'true');

            navigate('/overview'); // Navigate to dashboard on success

        } catch (apiError) {
             console.error('Onboarding failed:', apiError);
             // Display specific error from backend if available
             setError(apiError?.detail || 'Onboarding failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="onboarding-header">
                    <h1>Welcome to FleetPro!</h1>
                    <p>Let's set up your business profile to get started.</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Business Name */}
                    <div className="form-group">
                        <label htmlFor="businessName">Business Name</label>
                        <input
                            type="text"
                            id="businessName"
                            className="form-input"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Enter your company or fleet name"
                            required
                        />
                    </div>

                    {/* Primary Theme Color Selection */}
                    <div className="form-group">
                        <label htmlFor="primaryThemeColor">Primary Color</label>
                        <div className="color-selection">
                            {['Blue', 'Yellow', 'Red', 'Black', 'Green'].map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-swatch ${primaryThemeColor === color ? 'selected' : ''}`}
                                    onClick={() => {
                                        console.log("Color selected:", color);
                                        setPrimaryThemeColor(color);
                                    }}
                                    style={{
                                        backgroundColor: getColorValue(color)
                                    }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Vehicle Section */}
                    <div className="vehicle-section">
                         <h4>Add Your Vehicle(s)</h4>
                        {vehicles.map((vehicle, index) => (
                            <div key={index} className="vehicle-input-group">
                                <div className="form-group">
                                    <label htmlFor={`regNo-${index}`}>Registration No. *</label>
                                    <input
                                        type="text"
                                        id={`regNo-${index}`}
                                        className="form-input"
                                        value={vehicle.registration_no}
                                        onChange={(e) => handleVehicleChange(index, 'registration_no', e.target.value)}
                                        placeholder="e.g., KA01AB1234"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor={`vehicleType-${index}`}>Vehicle Type *</label>
                                    <input
                                        type="text"
                                        id={`vehicleType-${index}`}
                                        className="form-input"
                                        value={vehicle.vehicle_type}
                                        onChange={(e) => handleVehicleChange(index, 'vehicle_type', e.target.value)}
                                        placeholder="e.g., Truck, Tanker"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor={`chassisNumber-${index}`}>Chassis Number *</label>
                                    <input
                                        type="text"
                                        id={`chassisNumber-${index}`}
                                        className="form-input"
                                        value={vehicle.chassis_number}
                                        onChange={(e) => handleVehicleChange(index, 'chassis_number', e.target.value)}
                                        placeholder="e.g., MAT828113S2C05629"
                                        required
                                    />
                                </div>
                                {vehicles.length > 1 && (
                                     <button
                                         type="button"
                                         className="remove-vehicle-btn"
                                         onClick={() => removeVehicleInput(index)}
                                         title="Remove Vehicle"
                                     >
                                         &times;
                                     </button>
                                )}

                            </div>
                         ))}
                         <button
                             type="button"
                             className="add-vehicle-btn"
                             onClick={addVehicleInput}
                             style={{width: 'auto', padding: '10px 15px', marginTop: '10px'}}
                         >
                             + Add Another Vehicle
                         </button>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Setting Up...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;