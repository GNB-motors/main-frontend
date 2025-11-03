import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './ProfilePage.css';
import { getThemeCSS } from '../../utils/colorTheme';

const SettingsPage = () => {
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showRepeat, setShowRepeat] = useState(false);
    const [themeColors, setThemeColors] = useState(getThemeCSS());

    // Update theme colors when component mounts
    useEffect(() => {
        setThemeColors(getThemeCSS());
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: wire to backend change-password endpoint
        console.log('Password change submitted');
    };

    return (
        <div className="profile-card" style={themeColors}>
            <h4>Change Password</h4>
            <form className="info-form" onSubmit={handleSubmit}>
                <div className="form-group full-width">
                    <label>Old Password</label>
                    <div className="password-field">
                        <input type={showOld ? 'text' : 'password'} />
                        <button type="button" className="password-toggle" onClick={() => setShowOld(!showOld)} aria-label={showOld ? 'Hide password' : 'Show password'}>
                            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>New Password</label>
                        <div className="password-field">
                            <input type={showNew ? 'text' : 'password'} />
                            <button type="button" className="password-toggle" onClick={() => setShowNew(!showNew)} aria-label={showNew ? 'Hide password' : 'Show password'}>
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Repeat New Password</label>
                        <div className="password-field">
                            <input type={showRepeat ? 'text' : 'password'} />
                            <button type="button" className="password-toggle" onClick={() => setShowRepeat(!showRepeat)} aria-label={showRepeat ? 'Hide password' : 'Show password'}>
                                {showRepeat ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;


