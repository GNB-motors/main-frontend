import { memo, useCallback, useMemo } from 'react';
import { MarkerF, CircleF } from '@react-google-maps/api';
import { PROVENANCE_COLOR, CONTEXT_COLOR } from '../placeHubStyle.js';
import { dotIcon } from './mapIcons.js';

const HotspotShape = memo(function HotspotShape({ hotspot, selected, interactive, onSelect }) {
  const color = hotspot.active ? PROVENANCE_COLOR[hotspot.provenance] : CONTEXT_COLOR;
  const options = useMemo(
    () => ({
      strokeColor: color,
      strokeOpacity: hotspot.active ? 0.9 : 0.5,
      strokeWeight: selected ? 3 : 1.5,
      fillColor: color,
      fillOpacity: selected ? 0.25 : hotspot.active ? 0.12 : 0.05,
      clickable: interactive,
    }),
    [color, hotspot.active, selected, interactive],
  );
  const icon = useMemo(
    () => dotIcon(color, selected ? 9 : 7, { selected, opacity: hotspot.active ? 1 : 0.6 }),
    [color, selected, hotspot.active],
  );
  const click = useCallback(() => onSelect(hotspot.id), [onSelect, hotspot.id]);
  const center = useMemo(
    () => ({ lat: hotspot.lat, lng: hotspot.lng }),
    [hotspot.lat, hotspot.lng],
  );
  return (
    <>
      <CircleF center={center} radius={hotspot.radiusM} options={options} onClick={click} />
      <MarkerF
        position={center}
        icon={icon}
        title={hotspot.name}
        clickable={interactive}
        zIndex={selected ? 1000 : 50}
        onClick={click}
      />
    </>
  );
});

export default HotspotShape;
