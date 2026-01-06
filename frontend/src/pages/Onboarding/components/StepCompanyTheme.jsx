import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../utils/axiosConfig';

const StepCompanyTheme = ({ onNext, onBack, onDataChange, formData }) => {
    const [companyName, setCompanyName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#2940d3');
    const [customHex, setCustomHex] = useState('');
    const [gstin, setGstin] = useState('');

    // Predefined color swatches matching the app theme
    const colorSwatches = [
        { name: 'Blue', hex: '#2940d3' },
        { name: 'Yellow', hex: '#F59E0B' },
        { name: 'Red', hex: '#EF4444' },
        { name: 'Green', hex: '#10B981' }
    ];

    useEffect(() => {
        // Load from sessionStorage if available
        const savedData = sessionStorage.getItem('onboardingCompany');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setCompanyName(parsed.companyName || '');
            setSelectedColor(parsed.selectedColor || '#2940d3');
            setCustomHex(parsed.selectedColor || '');
            setGstin(parsed.gstin || '');
        }
    }, []);

    // Update parent component when data changes - REMOVE onDataChange from dependencies
    useEffect(() => {
        if (companyName || selectedColor || gstin) {
            onDataChange({
                companyName,
                selectedColor,
                gstin
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyName, selectedColor, gstin]);

    const handleColorSelect = (hex) => {
        setSelectedColor(hex);
        setCustomHex(hex);
    };

    const handleCustomHexChange = (e) => {
        const value = e.target.value;
        setCustomHex(value);
        
        // Validate hex color
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (hexRegex.test(value)) {
            setSelectedColor(value);
        }
    };

    const handleSave = () => {
        // Validation
        if (!companyName.trim()) {
            toast.error('Please enter your company name');
            return;
        }

        // Optional GSTIN validation (15 characters alphanumeric)
        if (gstin && gstin.trim()) {
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(gstin.trim())) {
                toast.warning('GSTIN format may be invalid. Please verify.');
            }
        }

        // Save to sessionStorage for final submission
        const companyData = { companyName, selectedColor, gstin };
        sessionStorage.setItem('onboardingCompany', JSON.stringify(companyData));

        toast.success('Company details saved', { autoClose: 1500 });
        onNext();
    };

    return (
        <div className="step-container">
            <div className="step-header">
                <h2>Company & Theme</h2>
                <p className="step-description">
                    Set up your company details and choose your brand color
                </p>
            </div>

            <div className="form-section">
                <div className="form-group">
                    <label htmlFor="companyName">
                        Company Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="companyName"
                        className="form-input"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter your company or business name"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="gstin">
                        GSTIN (Optional)
                    </label>
                    <input
                        type="text"
                        id="gstin"
                        className="form-input"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        placeholder="e.g., 27ABCDE1234F1Z5"
                        maxLength={15}
                    />
                    <small className="form-hint">
                        Goods and Services Tax Identification Number (15 characters)
                    </small>
                </div>

                <div className="form-group">
                    <label>
                        Primary Theme Color <span className="required">*</span>
                    </label>
                    
                    <div className="color-swatches">
                        {colorSwatches.map((color) => (
                            <button
                                key={color.hex}
                                type="button"
                                className={`color-swatch ${selectedColor === color.hex ? 'selected' : ''}`}
                                style={{ backgroundColor: color.hex }}
                                onClick={() => handleColorSelect(color.hex)}
                                title={color.name}
                            >
                                {selectedColor === color.hex && (
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                                        <path d="M7 10L9 12L13 8" stroke="white" strokeWidth="2" fill="none"/>
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="custom-color-input">
                        <label htmlFor="customHex" className="custom-hex-label">
                            Or enter custom hex color:
                        </label>
                        <div className="hex-input-group">
                            <input
                                type="text"
                                id="customHex"
                                className="form-input hex-input"
                                value={customHex}
                                onChange={handleCustomHexChange}
                                placeholder="#2940d3"
                                maxLength={7}
                            />
                            <div 
                                className="color-preview" 
                                style={{ backgroundColor: selectedColor }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="theme-preview">
                    <h4>Live Preview</h4>
                    <div className="preview-card" style={{ borderTopColor: selectedColor }}>
                        <div className="preview-header" style={{ backgroundColor: selectedColor }}>
                            <span>{companyName || 'Your Company'}</span>
                        </div>
                        <div className="preview-body">
                            <p>This is how your theme will look</p>
                            <button 
                                className="preview-button" 
                                style={{ backgroundColor: selectedColor }}
                            >
                                Sample Button
                            </button>
                        </div>
                    </div>
                </div>
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
                    onClick={handleSave}
                >
                    Save & Continue
                </button>
            </div>
        </div>
    );
};

export default StepCompanyTheme;
