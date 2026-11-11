import { OverlayViewF } from '@react-google-maps/api';
import DataTooltip from '../../../components/ui/DataTooltip.jsx';
import './PlaceHoverTooltip.css';

export default function PlaceHoverTooltip({ position, label, details }) {
  return (
    <OverlayViewF position={position} mapPaneName="floatPane">
      <div className="place-hover-tooltip">
        <DataTooltip role="tooltip" label={label} details={details} />
      </div>
    </OverlayViewF>
  );
}
