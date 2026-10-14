import React from 'react';

/** Illustration of a browser toolbar with the GNB Edge extension pinned. */
const ExtensionBrowserMockup = () => (
  <div className="ob-ext-mockup">
    <div className="ob-ext-browser">
      <div className="ob-ext-browser-bar">
        <span className="ob-ext-dot ob-ext-dot--red" />
        <span className="ob-ext-dot ob-ext-dot--yellow" />
        <span className="ob-ext-dot ob-ext-dot--green" />
      </div>
      <div className="ob-ext-browser-content">
        <div className="ob-ext-address-row">
          <div className="ob-ext-address-bar">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="4" stroke="#9CA3AF" strokeWidth="1.2" />
              <path d="M8.5 8.5L11 11" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>chromewebstore.google.com</span>
          </div>
          <div className="ob-ext-toolbar">
            <div className="ob-ext-pin-icon" title="Extensions">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10.5 2L14 5.5L9 7L7 9L5.5 14L2 10.5L7 5L10.5 2Z"
                  stroke="#6B7280"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="ob-ext-active-icon" title="GNB Edge pinned">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect width="16" height="16" rx="3" fill="#1E293B" />
                <path
                  d="M4 8L7 11L12 5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="ob-ext-arrow-area">
          <svg className="ob-ext-arrow-svg" viewBox="0 0 120 60" fill="none">
            <path
              d="M20 50 Q60 10 100 28"
              stroke="#4F46E5"
              strokeWidth="2"
              strokeDasharray="5 3"
              fill="none"
            />
            <path
              d="M96 22 L100 28 L94 28"
              stroke="#4F46E5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span className="ob-ext-arrow-label">Pin the extension here</span>
        </div>
      </div>
    </div>
  </div>
);

export default ExtensionBrowserMockup;
