import React from 'react';
import LocationAutocomplete from '../LocationAutocomplete/LocationAutocomplete';

const RouteFields = ({ uid, selectedSource, setSelectedSource, selectedDest, setSelectedDest }) => (
  <div className="mileage-form-row">
    <div className="mileage-form-group">
      <label htmlFor={`${uid}-source`}>Source Location</label>
      <LocationAutocomplete
        id={`${uid}-source`}
        value={selectedSource ? selectedSource.name : ''}
        onChange={() => {}}
        onLocationSelect={(loc) => setSelectedSource(loc ? { id: loc._id, name: loc.name } : null)}
        placeholder="Choose source..."
        allowCustomText={false}
      />
    </div>
    <div className="mileage-form-group">
      <label htmlFor={`${uid}-dest`}>Destination Location</label>
      <LocationAutocomplete
        id={`${uid}-dest`}
        value={selectedDest ? selectedDest.name : ''}
        onChange={() => {}}
        onLocationSelect={(loc) => setSelectedDest(loc ? { id: loc._id, name: loc.name } : null)}
        placeholder="Choose destination..."
        allowCustomText={false}
      />
    </div>
  </div>
);

export default RouteFields;
