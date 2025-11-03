import React, { useState } from 'react';
import { toast } from 'react-toastify';
import UkoLogo from '../../assets/uko-logo.png';
import LottieLoader from '../../components/LottieLoader.jsx';
import './SignUpPage.css';
import { SignUpPageService } from './SignUpPageService.jsx';

const SignUpPage = () => {
    // State for form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [location, setLocation] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [gstin, setGstin] = useState('');
    // State for loading and errors
    const [isLoading, setIsLoading] = useState(false);

    const handleAddUser = async (event) => {
        event.preventDefault();

        setIsLoading(true);

        // Combine first name and last name for backend
        const fullName = `${firstName} ${lastName}`.trim();

        const userData = {
            username: fullName,
            email: email,
            password: password,
            location: location || null,
            mobile_number: mobileNumber || null,
            gstin: gstin || null
        };

        try {
            const data = await SignUpPageService.registerUser(userData);
            toast.success("User added successfully!");
            // Reset form
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setLocation('');
            setMobileNumber('');
            setGstin('');
        } catch (apiError) {
            console.error('Failed to add user:', apiError);
            const errorMessage = apiError?.detail || 'Failed to add user. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* API Loading Loader */}
            <LottieLoader 
                isLoading={isLoading} 
                size="medium" 
                message="Adding user..." 
            />

            <div className="admin-add-user-container">
                <div className="admin-add-user-wrapper">
                    <div className="admin-add-user-card">
                        <div className="admin-add-user-header">
                            <img src={UkoLogo} alt="Uko Logo" className="logo"/>
                            <h1>Add User</h1>
                            <p className="admin-subtitle">Create a new user account</p>
                        </div>

                        <form onSubmit={handleAddUser}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstName">First Name</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        className="form-input"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName">Last Name</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        className="form-input"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Enter last name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="form-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter user email"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mobileNumber">Mobile Number</label>
                                    <input
                                        type="tel"
                                        id="mobileNumber"
                                        className="form-input"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        placeholder="Enter mobile number"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="location">Location</label>
                                    <input
                                        type="text"
                                        id="location"
                                        className="form-input"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Enter location"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="gstin">GSTIN</label>
                                    <input
                                        type="text"
                                        id="gstin"
                                        className="form-input"
                                        value={gstin}
                                        onChange={(e) => setGstin(e.target.value)}
                                        placeholder="Enter GSTIN number"
                                    />
                                </div>
                            </div>
                            <div className="form-group password-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                />
                            </div>

                            <div className="button-container">
                                <button 
                                    type="submit" 
                                    className="add-user-button"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Adding User...' : 'Add User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignUpPage;
