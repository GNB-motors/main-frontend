import { memo, useCallback, useMemo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { dotIcon } from './mapIcons.js';

const ScaledDot = memo(function ScaledDot({
  id,
  lat,
  lng,
  color,
  scale,
  title,
  selected,
  interactive,
  onSelect,
}) {
  const icon = useMemo(() => dotIcon(color, scale, { selected }), [color, scale, selected]);
  const click = useCallback(() => onSelect(id), [onSelect, id]);
  return (
    <MarkerF
      position={{ lat, lng }}
      icon={icon}
      title={title}
      clickable={interactive}
      zIndex={selected ? 1000 : Math.round(scale)}
      onClick={click}
    />
  );
});

export default ScaledDot;
