import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Mail, Phone, Lock, User } from 'lucide-react';
import LottieLoader from '../../../components/LottieLoader.jsx';
import './AddUserPage.css';

const AddUserPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    mobileNumber: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/admin/register-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('User registered successfully!');
        // Reset form
        setFormData({
          email: '',
          mobileNumber: '',
          password: '',
          firstName: '',
          lastName: '',
        });
      } else {
        toast.error(data.message || 'Failed to register user');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred while registering user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LottieLoader 
        isLoading={isLoading} 
        size="medium" 
        message="Registering user..." 
      />

      <div className="add-user-page">
        <div className="form-container">
          <div className="form-header">
            <p>Register a new owner account</p>
          </div>

          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  <User size={18} />
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  <User size={18} />
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobileNumber">
                <Phone size={18} />
                Mobile Number
              </label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="Enter mobile number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={18} />
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
              <small className="input-hint">
                Password must contain at least 8 characters, including uppercase, lowercase, number, and special character
              </small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setFormData({
                  email: '',
                  mobileNumber: '',
                  password: '',
                  firstName: '',
                  lastName: '',
                })}
              >
                Clear Form
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddUserPage;
