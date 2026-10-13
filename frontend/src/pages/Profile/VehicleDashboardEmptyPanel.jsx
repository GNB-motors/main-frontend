import React from 'react';

export default function VehicleDashboardEmptyPanel() {
  return (
    <aside className="v-dash-panel v-dash-panel--empty" aria-label="Vehicle details panel">
      <div className="v-dash-empty-content">
        <div className="v-dash-empty-illustration">
          <svg
            width="120"
            height="90"
            viewBox="0 0 120 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="15"
              y="10"
              width="70"
              height="55"
              rx="6"
              fill="#F1F5F9"
              stroke="#CBD5E1"
              strokeWidth="2"
            />
            <rect x="25" y="22" width="50" height="4" rx="2" fill="#E2E8F0" />
            <rect x="25" y="32" width="38" height="4" rx="2" fill="#E2E8F0" />
            <rect x="25" y="42" width="44" height="4" rx="2" fill="#E2E8F0" />
            <circle cx="70" cy="40" r="12" fill="#DCFCE7" stroke="#22C55E" strokeWidth="2" />
            <path
              d="M66 40L69 43L75 37"
              stroke="#16A34A"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M45 68H100C103.314 68 106 65.3137 106 62V48C106 46.8954 105.105 46 104 46H94L88 38H72V68H45Z"
              fill="#3B82F6"
              fillOpacity="0.15"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="60" cy="68" r="6" fill="#1E293B" />
            <circle cx="92" cy="68" r="6" fill="#1E293B" />
          </svg>
        </div>
        <h3 className="v-dash-empty-title">No vehicle selected</h3>
        <p className="v-dash-empty-desc">
          Select any vehicle to view all document &amp; challan details
        </p>
        <div className="v-dash-empty-hints">
          <div className="v-dash-empty-hint-item">
            <span className="v-dash-hint-bullet">1</span>
            <span>
              Click on a <strong>Vehicle Number</strong> to view all 7 documents &amp; challans.
            </span>
          </div>
          <div className="v-dash-empty-hint-item">
            <span className="v-dash-hint-bullet">2</span>
            <span>
              Click on any <strong>Document Cell</strong> to view its scanned photo &amp; OCR data.
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
