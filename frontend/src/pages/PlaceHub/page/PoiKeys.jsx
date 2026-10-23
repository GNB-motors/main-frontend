import { POI_COLOR, POI_LABEL } from '../placeHubStyle.js';

export default function PoiKeys() {
  return Object.keys(POI_COLOR).map((k) => (
    <span key={k} className="ph-legend-item">
      <i className="is-square" style={{ background: POI_COLOR[k] }} /> {POI_LABEL[k]}
    </span>
  ));
}
