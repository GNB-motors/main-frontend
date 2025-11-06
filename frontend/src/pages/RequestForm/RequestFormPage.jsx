import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/axiosConfig'; 
import './RequestFormPage.css';
import OTP from './OTP';

// Import assets
import UkoLogo from '../../assets/uko-logo.png';
import ReportDetailsIcon from '../../assets/report-details-icon.svg';
import UploadIcon from '../../assets/upload-icon.svg';
import SuccessIcon from '../../assets/success-icon.svg';
import LoginSubmitIcon from '../../assets/login-submit-icon.svg';

const RequestFormPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    
    // This will hold the logged-in user's profile data
    const [tmsProfile, setTmsProfile] = useState(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    // Vehicle data state
    const [vehicles, setVehicles] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehicleError, setVehicleError] = useState(null);

    const [formData, setFormData] = useState({
        selectedVehicle: '',
        dieselBefore: null,
        dieselAfter: null,
        email: '', // This is ONLY for the Fleet Edge login
        password: '', // This is ONLY for the Fleet Edge login
        mobileNumber: '', // For OTP login
        otp: '', // For OTP login
        loginMethod: 'password', // 'password' or 'otp'
    });
    const [extractedData, setExtractedData] = useState({
        before: null,
        after: null,
    });
    const [previews, setPreviews] = useState({
        before: null,
        after: null,
    });
    const [error, setError] = useState({
        before: null,
        after: null,
        submit: null,
        profile: null,
    });
    const [isLoading, setIsLoading] = useState({
        before: false,
        after: false,
        submit: false,
    });
    const [finalReportData, setFinalReportData] = useState(null);

    // Fetch the user's profile AND vehicles on component load
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Fetch Profile
                const profileResponse = await apiClient.get('api/v1/profile/me');
                const profile = profileResponse.data;
                setTmsProfile(profile);

                // 2. Fetch Vehicles using profile data
                if (profile.business_ref_id) {
                    try {
                        // Note: Adjust this endpoint if it's different in your API
                        const vehiclesResponse = await apiClient.get(`api/v1/vehicles/${profile.business_ref_id}`);
                        setVehicles(vehiclesResponse.data);
                        setVehicleError(null);
                    } catch (vehErr) {
                        console.error('Error fetching vehicles:', vehErr);
                        setVehicleError(vehErr.response?.data?.detail || 'Failed to load vehicles.');
                    } finally {
                        setIsLoadingVehicles(false);
                    }
                } else {
                    setVehicleError('Business ID not found in profile. Cannot load vehicles.');
                    setIsLoadingVehicles(false);
                }

            } catch (profErr) {
                // Profile fetch failed
                const errorMsg = profErr.response?.data?.detail || 'Could not fetch your profile. Please log in again.';
                setError(prev => ({ ...prev, profile: errorMsg }));
                setIsLoadingVehicles(false); // Can't load vehicles if profile fails
            } finally {
                setIsProfileLoading(false); // Profile loading is done
            }
        };

        fetchInitialData();
    }, []); // Empty array means this runs once on mount


    const goToStep = (step) => setCurrentStep(step);

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = async (file, type) => {
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setPreviews(prev => ({ ...prev, [type]: previewUrl }));
        updateFormData(type === 'before' ? 'dieselBefore' : 'dieselAfter', file);
        setIsLoading(prev => ({...prev, [type]: true}));
        setError(prev => ({...prev, [type]: null}));
        setExtractedData(prev => ({...prev, [type]: null}));

        const uploadFormData = new FormData();
        uploadFormData.append('receipt', file);

        try {
            // Use apiClient to call your unified backend
            const response = await apiClient.post('api/v1/ocr/process-receipt', uploadFormData);
            setExtractedData(prev => ({ ...prev, [type]: response.data.data }));
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to process image.';
            setError(prev => ({ ...prev, [type]: errorMsg }));
            setPreviews(prev => ({ ...prev, [type]: null }));
        } finally {
             setIsLoading(prev => ({...prev, [type]: false}));
        }
    };

    const removeImage = (type) => {
        setPreviews(prev => ({ ...prev, [type]: null }));
        setExtractedData(prev => ({ ...prev, [type]: null }));
        updateFormData(type === 'before' ? 'dieselBefore' : 'dieselAfter', null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(prev => ({ ...prev, submit: true }));
        setError(prev => ({ ...prev, submit: null }));

        if (!tmsProfile) {
            setError(prev => ({ ...prev, submit: "User profile not loaded. Cannot submit." }));
            setIsLoading(prev => ({ ...prev, submit: false }));
            return;
        }

        // ✅ Clean and properly typed payload
        const cleanPayload = {
            extractedData: {
                before: extractedData.before ? {
                    date: extractedData.before.date,
                    time: extractedData.before.time,
                    vehicle_no: extractedData.before.vehicle_no,
                    volume: Number(extractedData.before.volume)
                } : null,
                after: extractedData.after ? {
                    date: extractedData.after.date,
                    time: extractedData.after.time,
                    vehicle_no: extractedData.after.vehicle_no,
                    volume: Number(extractedData.after.volume)
                } : null,
            },
            loginDetails: formData.loginMethod === 'password' 
                ? { email: formData.email, password: formData.password }
                : { mobile: formData.mobileNumber, otp: formData.otp },
            selected_vehicle_registration_no: formData.selectedVehicle,
        };

        try {
            // ✅ Single backend call — no OCR fallback now
            const submitResponse = await apiClient.post('api/v1/ocr/submit-report', cleanPayload, { timeout: 240000 });
            const submitResult = submitResponse.data;

            // Expect backend to directly return data
            if (submitResult.data) {
                console.log("✅ Report generated successfully!");
                setFinalReportData(submitResult.data);
                goToStep(3);
            } else {
                console.error("❌ Unexpected backend response:", submitResult);
                throw new Error("Unexpected response from report generation.");
            }

        } catch (err) {
            let errorMsg = 'Submission process failed.';
            if (err.response?.data?.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    errorMsg = err.response.data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
                } else if (typeof err.response.data.detail === 'object') {
                    errorMsg = err.response.data.detail.msg || JSON.stringify(err.response.data.detail);
                } else {
                    errorMsg = err.response.data.detail;
                }
            } else if (err.message) {
                errorMsg = err.message;
            }

            console.error("Submission process failed:", err);
            setError(prev => ({ ...prev, submit: errorMsg }));
        } finally {
            setIsLoading(prev => ({ ...prev, submit: false }));
        }
    };

    // Handle Profile Loading State
    if (isProfileLoading) {
        return <div className="form-container">Loading user profile...</div>;
    }
    
    if (error.profile) {
        return <div className="form-container error-message">{error.profile}</div>;
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1ReportDetails
                            formData={formData}
                            updateFormData={updateFormData}
                            handleImageUpload={handleImageUpload}
                            removeImage={removeImage}
                            extractedData={extractedData}
                            previews={previews}
                            isLoading={isLoading}
                            error={error}
                            vehicles={vehicles} 
                            isLoadingVehicles={isLoadingVehicles}
                            vehicleError={vehicleError}
                            onNext={() => goToStep(2)}
                        />;
            case 2:
                return <Step2Login
                            formData={formData}
                            updateFormData={updateFormData}
                            onBack={() => goToStep(1)}
                            onSubmit={handleSubmit}
                            isLoading={isLoading.submit}
                            error={error.submit}
                            setLoginMethod={(method) => updateFormData('loginMethod', method)}
                        />;
            case 3:
                return <Step3FinalReport reportData={finalReportData} />;
            default:
                return <div>An unexpected error occurred.</div>;
        }
    };

    return (
        <div className="form-container">
            <FormSidebar currentStep={currentStep} />
            <div className="form-content">
                {renderStep()}
            </div>
        </div>
    );
};


const FormSidebar = ({ currentStep }) => {
    const steps = [
        { number: 1, title: 'Report Details', description: 'Select vehicle & upload bills.', icon: ReportDetailsIcon },
        { number: 2, title: 'Login & Submit', description: 'Finalize your report.', icon: LoginSubmitIcon },
        { number: 3, title: 'Report Generated', description: 'View your results.', icon: SuccessIcon },
    ];

    return (
        <aside className="form-sidebar">
            <div className="sidebar-header">
                <img src={UkoLogo} alt="Uko Logo" />
                <h3>New Report Request</h3>
            </div>
            <nav className="step-nav">
                {steps.map(step => (
                    <div key={step.number} className={`step-item ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}>
                        <div className="step-icon">
                           <img src={step.icon} alt={step.title} />
                        </div>
                        <div className="step-details">
                            <h4>{step.title}</h4>
                            <p>{step.description}</p>
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
};

const Step1ReportDetails = ({ formData, updateFormData, handleImageUpload, removeImage, extractedData, previews, isLoading, error, vehicles, isLoadingVehicles, vehicleError, onNext }) => {

    // Helper function to normalize vehicle numbers for comparison
    const normalizeVehicleNo = (vehicleNo) => {
        if (!vehicleNo) return '';
        // Remove spaces, convert to string, trim
        return String(vehicleNo).replace(/\s+/g, '').trim();
    };

    // Validation logic
    const getValidationError = () => {
        if (!formData.selectedVehicle) {
            return null; // Don't show tooltip for missing vehicle selection
        }
        
        if (!extractedData.before || !extractedData.after) {
            return 'Please upload both before and after journey diesel bills';
        }

        const selectedVehicleNo = normalizeVehicleNo(formData.selectedVehicle);
        const beforeVehicleNo = normalizeVehicleNo(extractedData.before?.vehicle_no);
        const afterVehicleNo = normalizeVehicleNo(extractedData.after?.vehicle_no);

        if (!beforeVehicleNo || !afterVehicleNo) {
            return 'Vehicle number not found in one or both receipts';
        }

        // Check if before and after match each other
        if (beforeVehicleNo !== afterVehicleNo) {
            return `Vehicle numbers don't match: Before (${extractedData.before.vehicle_no}) ≠ After (${extractedData.after.vehicle_no})`;
        }

        // Check if extracted vehicle numbers match selected vehicle
        if (beforeVehicleNo !== selectedVehicleNo || afterVehicleNo !== selectedVehicleNo) {
            return `Vehicle number mismatch: Selected (${formData.selectedVehicle}) ≠ Receipt (${beforeVehicleNo})`;
        }

        return null;
    };

    const validationError = getValidationError();
    // Disable if no vehicle selected OR if there's a validation error
    const isNextDisabled = !formData.selectedVehicle || !extractedData.before || !extractedData.after || validationError !== null;

    // Find the selected vehicle to get its chassis number
    const selectedVehicle = vehicles.find(vehicle => vehicle.registration_no === formData.selectedVehicle);

    return (
        <div className="form-step">
            <h3>Report Details</h3>
            <p>Select your vehicle and upload the diesel bills for your trip.</p>
            <div className="form-group">
                <label>Select Vehicle</label>
                <select 
                    value={formData.selectedVehicle} 
                    onChange={e => updateFormData('selectedVehicle', e.target.value)}
                    disabled={isLoadingVehicles}
                >
                    <option value="" disabled>
                        {isLoadingVehicles ? 'Loading vehicles...' : 'Choose a vehicle from your profile'}
                    </option>
                    {/* Use the real 'vehicles' prop */ }
                    {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.registration_no}>
                            {vehicle.registration_no} - {vehicle.vehicle_type || 'Unknown Type'}
                        </option>
                    ))}
                </select>
                {vehicleError && <div className="error-message">{vehicleError}</div>}
                
                {/* Chassis Number Placeholder */ }
                {formData.selectedVehicle && selectedVehicle && (
                    <div className="chassis-placeholder">
                        <span className="chassis-label">Chassis Number:</span>
                        <span className="chassis-value">{selectedVehicle.chassis_number || 'Not available'}</span>
                    </div>
                )}
            </div>

            <div className="upload-section">
                <ImageUploader
                    type="before"
                    title="Before Journey Diesel Bill"
                    onUpload={handleImageUpload}
                    onRemove={removeImage}
                    extractedData={extractedData.before}
                    preview={previews.before}
                    isLoading={isLoading.before}
                    error={error.before}
                    selectedVehicle={formData.selectedVehicle}
                />
                <ImageUploader
                    type="after"
                    title="After Journey Diesel Bill"
                    onUpload={handleImageUpload}
                    onRemove={removeImage}
                    extractedData={extractedData.after}
                    preview={previews.after}
                    isLoading={isLoading.after}
                    error={error.after}
                    selectedVehicle={formData.selectedVehicle}
                />
            </div>

            <div className="form-navigation">
                <div className="button-wrapper">
                    <button 
                        className="btn-continue" 
                        onClick={onNext} 
                        disabled={isNextDisabled}
                    >
                        Continue
                    </button>
                    {validationError && (
                        <div className="validation-tooltip">
                            {validationError}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ImageUploader = ({ type, title, onUpload, onRemove, extractedData, preview, isLoading, error, selectedVehicle }) => {
    // Helper to normalize vehicle numbers
    const normalizeVehicleNo = (vehicleNo) => {
        if (!vehicleNo) return '';
        return String(vehicleNo).replace(/\s+/g, '').trim();
    };

    // Check if vehicle number matches selected vehicle
    const vehicleMatchError = selectedVehicle && extractedData?.vehicle_no 
        ? (normalizeVehicleNo(selectedVehicle) !== normalizeVehicleNo(extractedData.vehicle_no))
        : null;

    return (
        <div className="image-uploader">
            <h5>{title}</h5>
            {!preview ? (
                 <label className="upload-box">
                    <input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files[0], type)} />
                    <img src={UploadIcon} alt="Upload" />
                    <span>Click to upload or drag & drop</span>
                </label>
            ) : (
                <div className="image-preview-container">
                    <img src={preview} alt="Receipt preview" className="image-preview" />
                    <button className="remove-image-btn" onClick={() => onRemove(type)}>×</button>
                </div>
            )}

            {isLoading && <div className="loading-spinner">Processing image...</div>}
            {error && <div className="error-message">{error}</div>}
            {extractedData && (
                <div className="extracted-data-table">
                    <table>
                        <tbody>
                            <tr><td>Date</td><td>{extractedData.date}</td></tr>
                            <tr><td>Time</td><td>{extractedData.time}</td></tr>
                            <tr>
                                <td>Vehicle No</td>
                                <td>{extractedData.vehicle_no}</td>
                            </tr>
                            <tr><td>Diesel Volume</td><td>{extractedData.volume.toFixed(2)} Litres</td></tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const Step2Login = ({ formData, updateFormData, onBack, onSubmit, isLoading, error, setLoginMethod }) => {
    return (
        <div className="form-step">
            <h3>Login & Submit</h3>
            <p>Enter your Fleet Edge credentials to generate and finalize the report.</p>
            
            {/* Tabs */}
            <div className="login-tabs">
                <button 
                    type="button"
                    className={`tab-button ${formData.loginMethod === 'password' ? 'active' : ''}`}
                    onClick={() => setLoginMethod('password')}
                >
                    Password
                </button>
                <button 
                    type="button"
                    className={`tab-button ${formData.loginMethod === 'otp' ? 'active' : ''}`}
                    onClick={() => setLoginMethod('otp')}
                >
                    OTP
                </button>
            </div>

            {/* Tab Content */}
            {formData.loginMethod === 'password' ? (
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>User ID / Email</label>
                        <input 
                            type="text" 
                            placeholder="Enter your Fleet Edge User ID" 
                            value={formData.email} 
                            onChange={e => updateFormData('email', e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            placeholder="Enter your password" 
                            value={formData.password} 
                            onChange={e => updateFormData('password', e.target.value)} 
                            required 
                        />
                    </div>
                    {error && <div className="error-message submit-error">{error}</div>}
                    <div className="form-navigation">
                        <button type="button" className="btn-back" onClick={onBack}>Back</button>
                        <button type="submit" className="btn-continue" disabled={isLoading}>
                            {isLoading ? 'Generating Report...' : 'Submit'}
                        </button>
                    </div>
                </form>
            ) : (
                <OTP
                    mobileNumber={formData.mobileNumber}
                    onMobileChange={(value) => updateFormData('mobileNumber', value)}
                    otp={formData.otp}
                    onOtpChange={(value) => updateFormData('otp', value)}
                    onContinue={onSubmit}
                    onBack={onBack}
                    isLoading={isLoading}
                    error={error}
                />
            )}
        </div>
    );
};

const Step3FinalReport = ({ reportData }) => {
    if (!reportData) {
        return (
            <div className="success-step">
                <div className="loading-spinner">Loading final report...</div>
            </div>
        );
    }

    // Helper to safely parse and calculate
    const getBilledFuel = () => {
        try {
            const distance = parseFloat(reportData["Distance (Kms)"]);
            const actualMileage = parseFloat(reportData["Actual Mileage"].split(' ')[0]);
            if (actualMileage > 0) {
                return `${(distance / actualMileage).toFixed(2)} L`;
            }
        } catch (e) {
            return 'N/A';
        }
        return 'N/A';
    };

    return (
        <div className="final-report-container">
            <div className="report-header">
                 <img src={SuccessIcon} alt="Success" className="success-icon-large" />
                 <div>
                    <h3>Report Generated Successfully!</h3>
                    <p>Here is a summary of the fuel consumption analysis.</p>
                 </div>
            </div>

            <div className="report-card">
                <h4>Vehicle Details</h4>
                <p>{reportData["Vehicle Details"]}</p>
            </div>

            <div className="report-grid">
                <div className="report-card">
                    <h4>Odometer & Distance</h4>
                    <div className="report-item"><span>Start:</span> <strong>{reportData["Odometer Start"]} Km</strong></div>
                    <div className="report-item"><span>End:</span> <strong>{reportData["Odometer End"]} Km</strong></div>
                    <div className="report-item"><span>Distance:</span> <strong>{reportData["Distance (Kms)"]} Km</strong></div>
                </div>
                <div className="report-card">
                    <h4>Fuel Consumption</h4>
                    <div className="report-item"><span>FleetEdge System:</span> <strong>{reportData["Fuel Consumed"]}</strong></div>
                    <div className="report-item"><span>From Bills:</span> <strong>{getBilledFuel()}</strong></div>
                </div>
            </div>

            <div className="report-card mileage-summary">
                <h4>Mileage Analysis</h4>
                <div className="mileage-grid">
                    <div>
                        <p>FleetEdge System</p>
                        <strong>{reportData["Fuel Efficiency (FleetEdge)"]}</strong>
                    </div>
                    <div>
                        <p>Calculated (System Fuel)</p>
                        <strong>{reportData["Calculated Mileage"]}</strong>
                    </div>
                    <div>
                        <p>Actual (Bill Fuel)</p>
                        <strong>{reportData["Actual Mileage"]}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestFormPage;
