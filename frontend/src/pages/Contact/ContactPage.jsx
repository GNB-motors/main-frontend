import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import UkoLogo from '../../assets/uko-logo.png';
import LoginArtPattern from '../../assets/login-art-pattern.png';
import LottieLoader from '../../components/LottieLoader.jsx';
import './ContactPage.css';

const ContactPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            // TODO: Implement API call to send contact form
            console.log('Contact form submitted:', formData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toast.success("Thank you for contacting us! We'll get back to you soon.");
            
            // Reset form
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            });
        } catch (error) {
            console.error('Contact form submission failed:', error);
            toast.error("Failed to send message. Please try again.");
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
                message="Sending your message..." 
            />

            <div className="contact-container">
                <div className="contact-form-wrapper">
                    {/* Back Button - Positioned absolutely at top left */}
                    <button 
                        className="back-button"
                        onClick={() => navigate('/login')}
                        aria-label="Go back to login"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>

                    <div className="contact-form-card">
                        <div className="contact-header">
                            <img src={UkoLogo} alt="Uko Logo" className="logo"/>
                            <h1>Contact Us</h1>
                            <p className="contact-subtitle">Get in touch with us. We're here to help!</p>
                        </div>

                        {/* Contact Information */}
                        <div className="contact-info">
                            <div className="contact-info-item">
                                <strong>Email:</strong>
                                <a href="mailto:support@uko.com">support@uko.com</a>
                            </div>
                            <div className="contact-info-item">
                                <strong>Phone:</strong>
                                <a href="tel:+1234567890">+1 (234) 567-890</a>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    className="form-input"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    className="form-textarea"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    rows="5"
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" className="submit-button" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="contact-art-panel">
                    <img src={LoginArtPattern} alt="Decorative Art" />
                </div>
            </div>
        </>
    );
};

export default ContactPage;

