import { GoogleMap, Marker } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '8px' };

// Custom marker icon (reused from GoogleMapsModal).
const markerIcon = () =>
  window.google
    ? {
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
            <svg width="50" height="49" viewBox="0 0 50 49" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25.0561 48.4531C38.1543 48.4531 48.7724 37.835 48.7724 24.7368C48.7724 11.6387 38.1543 1.02051 25.0561 1.02051C11.958 1.02051 1.33984 11.6387 1.33984 24.7368C1.33984 37.835 11.958 48.4531 25.0561 48.4531Z" fill="white" fill-opacity="0.8" stroke="#FF8A00"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.9121 22.8976C19.9121 19.6725 22.536 17.0486 25.7612 17.0486C28.9864 17.0486 31.6102 19.6725 31.6103 22.8976C31.6103 26.9002 26.3759 32.7762 26.1531 33.0244C25.9441 33.2571 25.5787 33.2575 25.3693 33.0244C25.1465 32.7762 19.9121 26.9002 19.9121 22.8976ZM22.8183 22.8976C22.8183 24.5203 24.1384 25.8404 25.7611 25.8404C27.3837 25.8404 28.7039 24.5203 28.7039 22.8976C28.7039 21.275 27.3837 19.9548 25.7611 19.9548C24.1384 19.9548 22.8183 21.2749 22.8183 22.8976Z" fill="#FF6600"/>
            </svg>
        `),
        anchor: new window.google.maps.Point(25, 49),
      }
    : null;

/** The right-hand map panel: pin drop, drag-to-adjust, click-to-place. */
export const AddLocationMap = (props) => {
  const { isLoaded, mapCenter, formData, mapRef, onMapClick, onMarkerDragEnd } = props;

  if (!isLoaded) {
    return (
      <div className="location-map-panel">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          Loading Map...
        </div>
      </div>
    );
  }

  return (
    <div className="location-map-panel">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={15}
        onClick={onMapClick}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{
          draggableCursor: 'pointer',
          draggingCursor: 'pointer',
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {formData.lat && formData.lng && (
          <Marker
            position={{ lat: formData.lat, lng: formData.lng }}
            draggable
            onDragEnd={onMarkerDragEnd}
            icon={markerIcon()}
          />
        )}
      </GoogleMap>
    </div>
  );
};
