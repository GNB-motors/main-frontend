import { useEffect } from 'react';

/**
 * Markers join and leave the clusterer without redrawing it — 200 suggestions
 * would mean 200 full redraws — so it is repainted once per change of set.
 * Rendered after the markers, so their effects have already run. Styles are
 * set here too: the clusterer's own style effect runs after its children's.
 */
export default function ClusterRepaint({ clusterer, styles, places, hiddenPlaceId }) {
  useEffect(() => {
    clusterer.setStyles(styles);
    clusterer.repaint();
  }, [clusterer, styles, places, hiddenPlaceId]);
  return null;
}
