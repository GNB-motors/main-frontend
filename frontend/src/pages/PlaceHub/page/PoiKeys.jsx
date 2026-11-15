import PlaceIcon from '../../../components/Icons/PlaceIcon.jsx';
import { POI_COLOR, POI_LABEL } from '../placeHubStyle.js';
const POI_LAYERS = {
  PLANT: 'plants',
  INDUSTRIAL: 'plants',
  LOGISTICS: 'warehouses',
  ROADSIDE: 'pumps',
};
export default function PoiKeys() {
  return Object.keys(POI_COLOR).map((k) => (
    <span key={k} className="ph-legend-item">
      <PlaceIcon layer={POI_LAYERS[k]} size={18} style={{ color: POI_COLOR[k] }} /> {POI_LABEL[k]}
    </span>
  ));
}
