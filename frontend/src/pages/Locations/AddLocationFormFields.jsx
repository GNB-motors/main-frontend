import { Save } from 'lucide-react';
import GoogleMapsSearch from '../../components/GoogleMapsModal/GoogleMapsSearch';

const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' };

/** The left-hand form panel: name, address search, city/state, pincode, save/cancel. */
export const AddLocationFormFields = (props) => {
  const {
    isEdit,
    isSubmitting,
    formData,
    onInputChange,
    isLoaded,
    searchValue,
    setSearchValue,
    onSuggestionSelect,
    onSearchEnter,
    onSubmit,
    onCancel,
  } = props;

  return (
    <div className="location-form-panel">
      <form onSubmit={onSubmit}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Pump Location Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            className="search-input"
            style={{ maxWidth: '100%' }}
            placeholder="e.g. Pump 1, Main Pump"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Address</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <GoogleMapsSearch
                isLoaded={isLoaded}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSuggestionSelect={onSuggestionSelect}
                onEnter={onSearchEnter}
                className="search-input-wrapper-form"
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div className="form-group">
            <label style={labelStyle}>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={onInputChange}
              className="search-input"
              style={{ maxWidth: '100%' }}
            />
          </div>
          <div className="form-group">
            <label style={labelStyle}>State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={onInputChange}
              className="search-input"
              style={{ maxWidth: '100%' }}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Pincode</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={onInputChange}
            className="search-input"
            style={{ maxWidth: '100%' }}
            placeholder="e.g. 700001"
          />
        </div>

        <div
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto' }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Save size={18} />
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Pump Location' : 'Save Pump Location'}
          </button>
        </div>
      </form>
    </div>
  );
};
