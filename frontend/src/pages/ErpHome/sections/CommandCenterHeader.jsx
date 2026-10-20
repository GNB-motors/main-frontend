import React from 'react';
import CcIcon from '../commandCenterIcons';

function CommandCenterHeader({ mins, handleRefresh, spinKey, isDark, toggleTheme }) {
  return (
    <header className="head">
      <div>
        <div className="crumbs">
          <span>ERP</span>
          <span>›</span>
          <b>Home</b>
        </div>
        <h1>ERP Command Center</h1>
        <div className="sub">Trips, approvals and money owed — and what needs doing next.</div>
      </div>
      <div className="tools">
        <span className="updated">
          <i />
          <span>{mins <= 0 ? 'Updated just now' : `Updated ${mins}m ago`}</span>
        </span>
        <button type="button" className="btn" onClick={handleRefresh}>
          <CcIcon key={spinKey} n="refresh" className={spinKey ? 'spin' : ''} />
          Refresh
        </button>
        <button
          type="button"
          className="btn btn--icon"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          <CcIcon n={isDark ? 'sun' : 'moon'} s={18} />
        </button>
      </div>
    </header>
  );
}

export default CommandCenterHeader;
