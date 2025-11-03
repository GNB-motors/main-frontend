import React from 'react';
import Lottie from 'lottie-react';
import TruckAnimation from '../assets/animations/truck-material-onsite.json';
import './LottieLoader.css';

const LottieLoader = ({ 
    isLoading = false, 
    size = 'medium', 
    message = 'Loading...',
    overlay = true 
}) => {
    if (!isLoading) return null;

    const sizeClasses = {
        small: 'lottie-loader-small',
        medium: 'lottie-loader-medium',
        large: 'lottie-loader-large'
    };

    const LoaderContent = () => (
        <div className={`lottie-loader ${sizeClasses[size]}`}>
            <div className="lottie-animation-container">
                <Lottie
                    animationData={TruckAnimation}
                    loop={true}
                    autoplay={true}
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'transparent'
                    }}
                    rendererSettings={{
                        preserveAspectRatio: 'xMidYMid slice'
                    }}
                />
            </div>
            {message && (
                <div className="loader-message">
                    {message}
                </div>
            )}
        </div>
    );

    if (overlay) {
        return (
            <div className="lottie-loader-overlay">
                <LoaderContent />
            </div>
        );
    }

    return <LoaderContent />;
};

export default LottieLoader;
