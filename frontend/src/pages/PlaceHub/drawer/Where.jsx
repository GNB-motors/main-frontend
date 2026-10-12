import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import PlaceLabel from '../../../components/ui/PlaceLabel';
import { coordsLabel } from '../placeHubModel.js';

export default function Where({ lat, lng, shape, address }) {
  const copy = () => {
    navigator.clipboard?.writeText(`${lat}, ${lng}`).then(
      () => toast.success('Coordinates copied'),
      () => {},
    );
  };
  return (
    <section className="ph-section">
      <h3>Where</h3>
      <div className="ph-where">
        {address ? (
          <p className="ph-where-address">{address}</p>
        ) : (
          <PlaceLabel lat={lat} lng={lng} />
        )}
        <div className="ph-where-line">
          <span className="ph-mono">{coordsLabel(lat, lng)}</span>
          <button type="button" className="ph-link-btn" onClick={copy}>
            <Copy size={12} /> Copy
          </button>
          <a
            className="ph-link-btn"
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={12} /> Google Maps
          </a>
        </div>
        {shape && <p className="ph-where-shape">{shape}</p>}
      </div>
    </section>
  );
}
