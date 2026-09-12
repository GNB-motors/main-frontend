import React from 'react';
import './LottieLoader.css';

const LottieLoader = ({
  isLoading = false,
  size = 'medium',
  message = 'Loading...',
  overlay = true,
}) => {
  if (!isLoading) return null;

  const sizeClasses = {
    small: 'lottie-loader-small',
    medium: 'lottie-loader-medium',
    large: 'lottie-loader-large',
  };

  const LoaderContent = () => (
    <div className={`lottie-loader ${sizeClasses[size]}`}>
      <div className="lottie-animation-container">
        <div className="lottie-spinner" aria-label="Loading" />
      </div>
      {message && <div className="loader-message">{message}</div>}
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
