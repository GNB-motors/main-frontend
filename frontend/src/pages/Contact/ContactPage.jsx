import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UkoLogo from '../../assets/uko-logo.png';
import './ContactPage.css';

// --- Carousel Data ---
const slideData = [
    {
        image: "https://images.unsplash.com/photo-1616432043562-3671ea2e5242?q=80&w=2070&auto=format&fit=crop",
        title: "24/7 Support",
        desc: "Round-the-clock customer support to help you with any questions or issues you may encounter.",
    },
    {
        image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop",
        title: "Expert Assistance",
        desc: "Get help from our team of logistics experts who understand your business needs.",
    },
    {
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
        title: "Quick Resolution",
        desc: "Fast and efficient solutions to keep your operations running smoothly without delays.",
    },
    {
        image: "https://images.unsplash.com/photo-1591768793355-74d04bb6608f?q=80&w=2072&auto=format&fit=crop",
        title: "Reliable Partnership",
        desc: "Building long-term relationships with reliable support and continuous improvement.",
    },
];

const ContactPage = () => {
    const navigate = useNavigate();

    // --- Carousel State ---
    const [currentSlide, setCurrentSlide] = useState(0);

    // --- Carousel Logic: Auto Rotate ---
    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slideData.length);
        }, 5000);
        return () => clearInterval(slideInterval);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slideData.length);
    };

    const goToSlide = (index, e) => {
        if (e) e.stopPropagation();
        setCurrentSlide(index);
    };

    return (
        <div className="contact-container">
                <div className="contact-form-wrapper">
                    {/* Back Button - Positioned absolutely at top left */}
                    <button 
                        className="back-button"
                        onClick={() => navigate('/login')}
                        aria-label="Go back to login"
                    >
                        <ArrowLeft size={20} />
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
                                <a href="mailto:gnbmotors60@gmail.com">gnbmotors60@gmail.com</a>
                            </div>
                            <div className="contact-info-item">
                                <strong>Phone:</strong>
                                <a href="tel:9831208946">9831208946</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="right-panel-container">
                    {/* Background Images */}
                    {slideData.map((slide, index) => (
                        <img
                            key={index}
                            src={slide.image}
                            className={`slide-bg ${index === currentSlide ? "active" : ""}`}
                            alt={`Slide ${index + 1}`}
                        />
                    ))}

                    {/* Blue Blur Vectors */}
                    <div className="vector-1"></div>
                    <div className="vector-2"></div>
                    <div className="vector-3"></div>
                    <div className="vector-4"></div>

                    {/* Glass Card */}
                    <div className="glass-card" onClick={nextSlide}>
                        <div className="card-title">{slideData[currentSlide].title}</div>
                        <div className="card-desc">{slideData[currentSlide].desc}</div>

                        <div className="card-dots">
                            {slideData.map((_, index) => (
                                <div
                                    key={index}
                                    className={`card-dot ${index === currentSlide ? "active" : "inactive"}`}
                                    onClick={(e) => goToSlide(index, e)}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Navigation Pill */}
                    <div className="bottom-pill">
                        {slideData.map((_, index) => (
                            <div
                                key={index}
                                className={`nav-dot ${index === currentSlide ? "active" : "inactive"}`}
                                onClick={(e) => goToSlide(index, e)}
                            ></div>
                        ))}
                    </div>
                </div>
        </div>
    );
};

export default ContactPage;

