import './OsmAttribution.css';

export default function OsmAttribution() {
  return (
    <div className="osm-map-attribution">
      ©{' '}
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
        OpenStreetMap
      </a>{' '}
      contributors
    </div>
  );
}
