import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageHeader.css';

/**
 * PageHeader Component
 * A reusable header component with breadcrumb navigation and page title/description
 * 
 * @param {Object} props
 * @param {string} props.backLabel - Label for the back navigation (e.g., "Employees")
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
          aria-label="Go back"
        >
          <div className="page-header-back-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.75 3.5L5.25 7L8.75 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Breadcrumb Items */}
        <div className="page-header-breadcrumb-items">
          {/* Previous/Back Label */}
          <div 
            className="page-header-breadcrumb-item page-header-breadcrumb-previous"
            onClick={handleBackLabelClick}
            role="button"
            tabIndex={0}
          >
            <span>{backLabel}</span>
          </div>

          {/* Current Label (with separator) */}
          {currentLabel && (
            <>
              {/* Separator Icon */}
              <div className="page-header-separator">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Current Item */}
              <div className="page-header-breadcrumb-item page-header-breadcrumb-current">
                <span>{currentLabel}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Page Title & Description */}
      <div className="page-header-content">
        <h1 className="page-header-title">{title}</h1>
        <p className="page-header-description">{description}</p>
      </div>
    </div>
  );
};

export default PageHeader;
