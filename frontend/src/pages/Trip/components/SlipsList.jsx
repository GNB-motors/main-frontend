/**
 * SlipsList Component
 * 
 * Scrollable list of weight slips with status badges
 * Shows pending or completed status for each slip
 */

import React from 'react';
import { CheckCircle, Clock, Eye } from 'lucide-react';
import './SlipsList.css';

const SlipsList = ({ slips, currentIndex, onSelectSlip, onPreviewClick }) => {
  return (
    <div className="slips-list">
      <div className="slips-scroll">
        {slips.map((slip, index) => (
          <div
            key={index}
            className={`slip-item ${currentIndex === index ? 'active' : ''} ${
              slip.isDone ? 'done' : 'pending'
            }`}
            onClick={() => onSelectSlip(index)}
          >
            <div className="slip-number">#{index + 1}</div>
            <div className="slip-thumbnail">
              <img src={slip.file.preview} alt={`Slip ${index + 1}`} />
              <button
                className="btn-preview-slip"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewClick(slip.file.preview);
                }}
                title="Preview Image"
              >
                <Eye size={16} />
              </button>
            </div>
            <div className="slip-content">
              <div className="slip-status">
                {slip.isDone ? (
                  <div className="status-badge-list done">
                    <CheckCircle size={14} />
                    <span>Done</span>
                  </div>
                ) : (
                  <div className="status-badge-list pending">
                    <Clock size={14} />
                    <span>Pending</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlipsList;
