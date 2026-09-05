import React, { lazy, Suspense } from 'react';
import TruckAnimation from '../assets/animations/truck-material-onsite.json';
import './LottieLoader.css';

// lottie-web is ~650 KB — load it on demand so it never blocks the entry chunk.
const Lottie = lazy(() => import('lottie-react'));

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
                <Suspense fallback={<div className="lottie-spinner" aria-label="Loading" />}>
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
                </Suspense>
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
