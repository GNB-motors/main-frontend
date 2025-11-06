import React, { useState } from 'react';
import './RequestFormPage.css';

const OTP = ({ mobileNumber, onMobileChange, otp, onOtpChange, onContinue, onBack, isLoading, error }) => {
    const [mobileError, setMobileError] = useState('');

    const handleMobileChange = (value) => {
        // Only allow numeric input
        const numericValue = value.replace(/\D/g, '');
        // Limit to 10 digits
        const limitedValue = numericValue.slice(0, 10);
        onMobileChange(limitedValue);
        
        // Clear error when user types
        if (mobileError) {
            setMobileError('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedMobile = mobileNumber.trim();
        
        if (!trimmedMobile) {
            setMobileError('Mobile number is required');
            return;
        }
        
        if (trimmedMobile.length !== 10) {
            setMobileError('Mobile number must be exactly 10 digits');
            return;
        }
        
        if (!otp || otp.trim().length === 0) {
            return;
        }
        
        onContinue(e);
    };

    const isMobileValid = mobileNumber.trim().length === 10;
    const isOtpValid = otp && otp.trim().length > 0;
    const canSubmit = isMobileValid && isOtpValid;

    return (
        <div className="otp-container">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Mobile Number</label>
                    <input 
                        type="tel" 
                        placeholder="Enter your 10-digit mobile number" 
                        value={mobileNumber} 
                        onChange={(e) => handleMobileChange(e.target.value)} 
                        required 
                        maxLength={10}
                    />
                    {mobileError && <div className="error-message">{mobileError}</div>}
                </div>
                
                <div className="form-group">
                    <label>Enter OTP</label>
                    <input 
                        type="text" 
                        placeholder="Enter OTP sent to your mobile" 
                        value={otp} 
                        onChange={(e) => onOtpChange(e.target.value)} 
                        required 
                        maxLength={6}
                        disabled={!isMobileValid}
                    />
                </div>
                
                {error && <div className="error-message submit-error">{error}</div>}
                
                <div className="form-navigation">
                    <button type="button" className="btn-back" onClick={onBack}>Back</button>
                    <button type="submit" className="btn-continue" disabled={!canSubmit || isLoading}>
                        {isLoading ? 'Generating Report...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OTP;

