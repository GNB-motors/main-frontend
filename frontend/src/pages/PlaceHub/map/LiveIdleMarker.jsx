import { memo, useCallback, useMemo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { IDLE_COLOR } from '../placeHubStyle.js';
import { durationLabel } from '../model/placeLabels.js';
import { diamondIcon } from './mapIcons.js';

const LiveIdleMarker = memo(function LiveIdleMarker({ event, selected, interactive, onSelect }) {
  const color = event.legitimacy === 'excess' ? IDLE_COLOR.excess : IDLE_COLOR.legit;
  const icon = useMemo(() => diamondIcon(color, selected), [color, selected]);
  const id = `live:${event._id}`;
  const click = useCallback(() => onSelect(id), [onSelect, id]);
  return (
    <MarkerF
      position={{ lat: Number(event.lat), lng: Number(event.lng) }}
      icon={icon}
      title={`${event.registrationNumber || 'Truck'} · idling ${durationLabel(event.durationMin)}`}
      clickable={interactive}
      zIndex={selected ? 1001 : 500}
      onClick={click}
    />
  );
});

export default LiveIdleMarker;
