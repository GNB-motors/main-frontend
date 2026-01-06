import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageHeader.css';

/**
 * PageHeader Component
 * A reusable header component with breadcrumb navigation and page title/description
 *
 * @param {Object} props
 * @param {string} props.backLabel - Label for the back navigation (e.g., "Routes")
 * @param {string} props.backPath - Path to navigate when clicking back label
 * @param {string} props.currentLabel - Current page label (shown after separator, optional)
 * @param {string} props.title - Main page title
 * @param {string} props.description - Page description text
 * @param {Function} props.onBack - Custom back button handler (optional, defaults to navigate(-1))
 */
const PageHeader = ({
  backLabel = 'Back',
  backPath = null,
  currentLabel = null,
  title = 'Page Title',
  description = 'Page description goes here.',
  onBack = null,
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleBackLabelClick = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      handleBackClick();
    }
  };

  return (
    <div className="page-header-container">
      {/* Breadcrumb Navigation */}
      <div className="page-header-breadcrumb">
        {/* Back Button Circle */}
        <div
          className="page-header-back-button"
          onClick={handleBackClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleBackClick();
            }
          }}
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.75 16.5L8.25 11L13.75 5.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Back Label */}
        <span
          className="page-header-back-label"
          onClick={handleBackLabelClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleBackLabelClick();
            }
          }}
        >
          {backLabel}
        </span>

        {/* Separator */}
        {currentLabel && (
          <>
            <span className="page-header-separator">/</span>
            <span className="page-header-current-label">{currentLabel}</span>
          </>
        )}
      </div>

      {/* Page Title and Description */}
      <div className="page-header-content">
        <h1 className="page-header-title">{title}</h1>
        <p className="page-header-description">{description}</p>
      </div>
    </div>
  );
};

export default PageHeader;