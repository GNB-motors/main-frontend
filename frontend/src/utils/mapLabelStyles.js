/**
 * Google's own place labels, turned back on.
 *
 * The old basemap hid every `poi` label, which made our map look empty next
 * to Google Maps and left a driver without a name for where he was. We keep
 * the labels that help a driver find a place — hospitals, police, schools,
 * government offices and worship — and drop the ones that are only clutter.
 * We also keep Google's businesses (pumps, dhabas, shops, factories,
 * warehouses) in full: a business pin next to where a truck's GPS stopped is
 * evidence of what the place is.
 */
export const POI_LABEL_STYLES = [
  {
    featureType: 'poi.business',
    elementType: 'all',
    stylers: [{ visibility: 'on' }],
  },
  { featureType: 'poi.medical', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
];

export default POI_LABEL_STYLES;
