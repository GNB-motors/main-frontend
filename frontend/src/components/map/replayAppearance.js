import { icoHTML } from '../../pages/RouteHub/routeHubIconPaths.js';
import { leafletStyle } from '../../lib/roadTrailLeaflet.js';

const route = { color: '#9A9AA5', weight: 4, opacity: 0.6, dashArray: '2 8', lineCap: 'round' };
const travelled = { color: '#2F58EE', weight: 5, opacity: 0.95, lineCap: 'round' };

export default {
  size: 38,
  anchor: 19,
  truckHtml: `<div class="rh-truck"><div>${icoHTML('truck', 19)}</div></div>`,
  route,
  travelled,
  googleRoute: (circle) => ({
    strokeOpacity: 0,
    strokeWeight: route.weight,
    zIndex: 1,
    icons: [
      {
        icon: {
          path: circle,
          fillColor: route.color,
          fillOpacity: route.opacity,
          strokeOpacity: 0,
          scale: 2,
        },
        offset: '0',
        repeat: '10px',
      },
    ],
  }),
  googleTravelled: {
    strokeColor: travelled.color,
    strokeWeight: travelled.weight,
    strokeOpacity: travelled.opacity,
    zIndex: 4,
  },
  googleRoad: (layer, circle) => {
    const style = leafletStyle(layer, { color: route.color, fleetColor: '#c4b5fd' });
    const base = {
      strokeColor: style.color,
      strokeWeight: style.weight,
      strokeOpacity: style.opacity,
      zIndex: 1,
    };
    if (!style.dashArray) return base;
    const dotted = layer.pattern === 'dotted';
    return {
      ...base,
      strokeOpacity: 0,
      icons: [
        {
          icon: dotted
            ? {
                path: circle,
                fillColor: style.color,
                fillOpacity: style.opacity,
                strokeOpacity: 0,
                scale: 1.5,
              }
            : {
                path: 'M 0,-4 0,4',
                scale: 1,
                strokeColor: style.color,
                strokeOpacity: style.opacity,
                strokeWeight: style.weight,
              },
          offset: '0',
          repeat: dotted ? '9px' : '16px',
        },
      ],
    };
  },
};
