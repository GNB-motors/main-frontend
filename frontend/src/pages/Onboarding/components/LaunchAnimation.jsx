import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
// Emitted as a static JSON file and fetched, not compiled into the JS
// bundle: the 87 KB of animation data stays out of the bundle budget.
import truckAnimationUrl from '../../../assets/animations/truck-material-onsite.json?url';
import { OnboardingService } from '../OnboardingService.js';
import './LaunchAnimation.css';

const LaunchAnimation = () => {
  const navigate = useNavigate();
  const [animationComplete, setAnimationComplete] = useState(false);
  const [truckAnimation, setTruckAnimation] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(truckAnimationUrl, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTruckAnimation(data))
      // Decoration only: without it the text and the redirect still work.
      .catch(() => setTruckAnimation(null));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // Play animation for 3 seconds then redirect
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      // Small delay after fade to ensure smooth transition
      setTimeout(async () => {
        const landing = await OnboardingService.getLandingRoute();
        navigate(landing);
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`launch-animation-container ${animationComplete ? 'fade-out' : ''}`}>
      <div className="launch-content">
        <div className="launch-animation">
          {truckAnimation ? (
            <Lottie
              animationData={truckAnimation}
              loop={true}
              autoplay={true}
              style={{
                width: '300px',
                height: '300px',
                margin: '0 auto',
              }}
            />
          ) : (
            <div style={{ width: '300px', height: '300px', margin: '0 auto' }} />
          )}
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
