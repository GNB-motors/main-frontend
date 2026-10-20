import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'react-toastify';

/** Google Places predictions; each can be picked as text or saved as a location. */
const GooglePredictionsSection = ({
  loadingGoogle,
  googlePredictions,
  savingLocationId,
  allowCustomText,
  handleSelect,
  saveGoogleLocation,
}) => (
  <>
    <div
      className="dropdown-group-label"
      style={{
        padding: '12px 12px 4px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#64748b',
        textTransform: 'uppercase',
        marginTop: 8,
        borderTop: '1px solid #e2e8f0',
      }}
    >
      Global Search Results
    </div>
    {loadingGoogle ? (
      <div
        style={{
          padding: '8px 12px',
          color: '#94a3b8',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Loader2 size={14} className="spinning" /> Searching globally...
      </div>
    ) : googlePredictions.length === 0 ? (
      <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 13 }}>
        No matches found globally
      </div>
    ) : (
      googlePredictions.map((pred) => {
        const isSavingThis = savingLocationId === pred.place_id;
        return (
          <div
            key={pred.place_id}
            className="dropdown-item"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (allowCustomText) {
                  handleSelect(pred.structured_formatting?.main_text || pred.description);
                } else {
                  toast.warning("Please click 'Save' to use this new location.");
                }
              }
            }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              width: '100%',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
            }}
            // If they click the item without saving, we can only emit the string name because we don't have an ID
            // But if allowCustomText is false (e.g. for Source/Dest), we MUST require them to save it first to get an ID!
            onClick={() => {
              if (allowCustomText) {
                handleSelect(pred.structured_formatting?.main_text || pred.description);
              } else {
                toast.warning("Please click 'Save' to use this new location.");
              }
            }}
          >
            <div style={{ flex: 1, paddingRight: 12 }}>
              <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>
                {pred.structured_formatting?.main_text || pred.description}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                {pred.structured_formatting?.secondary_text}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => saveGoogleLocation(e, pred.place_id, pred.description)}
              disabled={isSavingThis}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#2563eb',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isSavingThis ? 'not-allowed' : 'pointer',
                opacity: isSavingThis ? 0.7 : 1,
              }}
            >
              {isSavingThis ? <Loader2 size={12} className="spinning" /> : <Save size={12} />}
              Save
            </button>
          </div>
        );
      })
    )}
  </>
);

export default GooglePredictionsSection;
