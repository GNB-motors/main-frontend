import { memo } from 'react';
import { OverlayViewF } from '@react-google-maps/api';
import {
  PLACE_LABEL_FONT,
  PLACE_LABEL_LINE_HEIGHT,
  PLACE_LABEL_PADDING,
} from './placeLabelText.js';
import './PlaceAreaLabel.css';

// The overlay layer sits below vehicle markers. Pointer events pass through
// the text to the existing clickable boundary, including during drafting.
export default memo(function PlaceAreaLabel({ name, layout }) {
  return (
    <OverlayViewF position={layout.position} mapPaneName="overlayLayer">
      <div
        className="place-area-label"
        title={name}
        aria-label={name}
        style={{
          width: layout.width,
          height: layout.height,
          font: PLACE_LABEL_FONT,
          lineHeight: `${PLACE_LABEL_LINE_HEIGHT}px`,
          padding: PLACE_LABEL_PADDING,
        }}
      >
        {layout.lines.map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </div>
    </OverlayViewF>
  );
});
