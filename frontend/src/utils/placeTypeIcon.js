import { createElement } from 'react';
import PlaceIcon from '../components/Icons/PlaceIcon.jsx';
import { PLACE_TYPE_LAYERS } from '../config/placeIcons.js';

const TYPE_ICONS = Object.fromEntries(
  Object.keys(PLACE_TYPE_LAYERS).map((type) => [
    type,
    function TypeIcon(props) {
      return createElement(PlaceIcon, { ...props, type });
    },
  ]),
);
export const placeTypeIcon = (type) => TYPE_ICONS[type] || PlaceIcon;
