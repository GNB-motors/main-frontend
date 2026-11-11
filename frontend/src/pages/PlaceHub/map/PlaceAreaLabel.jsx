import { memo } from 'react';
import { OverlayViewF } from '@react-google-maps/api';
import './PlaceAreaLabel.css';

// The overlay layer sits below vehicle markers. Pointer events pass through
// the text to the existing clickable boundary, including during drafting.
export default memo(function PlaceAreaLabel({ name, layout }) {
  return (
    <OverlayViewF position={layout.position} mapPaneName="overlayLayer">
      <div
        className="place-area-label"
        title={name}
        style={{ width: layout.width, height: layout.height }}
      >
        {name}
      </div>
    </OverlayViewF>
  );
});
