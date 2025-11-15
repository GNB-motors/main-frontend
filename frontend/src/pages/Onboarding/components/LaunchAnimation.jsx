import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import TruckAnimation from '../../../assets/animations/truck-material-onsite.json';
import './LaunchAnimation.css';

const LaunchAnimation = () => {
    const navigate = useNavigate();
    const [animationComplete, setAnimationComplete] = useState(false);

    useEffect(() => {
        // Play animation for 3 seconds then redirect
        const timer = setTimeout(() => {
            setAnimationComplete(true);
            // Small delay after fade to ensure smooth transition
            setTimeout(() => {
                navigate('/overview');
            }, 500);
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className={`launch-animation-container ${animationComplete ? 'fade-out' : ''}`}>
            <div className="launch-content">
                <div className="launch-animation">
                    <Lottie
                        animationData={TruckAnimation}
                        loop={true}
                        autoplay={true}
                        style={{
                            width: '300px',
                            height: '300px',
                            margin: '0 auto'
                        }}
                    />
                </div>
                
                <div className="launch-text">
                    <h1 className="launch-title">All Set!</h1>
                    <p className="launch-subtitle">Launching your dashboard...</p>
                    
                    <div className="launch-loader">
                        <div className="launch-dot"></div>
                        <div className="launch-dot"></div>
                        <div className="launch-dot"></div>
                    </div>
                </div>
            </div>
            
            {/* Background decorative elements */}
            <div className="launch-bg-circle circle-1"></div>
            <div className="launch-bg-circle circle-2"></div>
            <div className="launch-bg-circle circle-3"></div>
        </div>
    );
};

export default LaunchAnimation;
