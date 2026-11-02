import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session.js';
import { canEditPlaces } from '../PlaceHub/model/placeHubConfig.js';
import TrackPlacesService from './TrackPlacesService.js';
import {
  confirmedPlaces,
  countPlacesByGroup,
  placesInGroups,
  searchPlaces,
} from './trackPlaces.js';

const LAYER_LABEL = { warehouses: 'warehouses', zones: 'zones', sites: 'detected places' };

/* Places on Track: the map layer (off until asked for) and the Places tab's
   list share one load, made on first use and kept for the session. Gated
   exactly like Place Hub (zones need the geofence flag, detected sites need
   Fleet Intelligence and a manager role — the backend refuses anyone else). */
export default function useTrackPlaces() {
  const { isEnabled } = useFeatureFlags();
  const allowZones = isEnabled('geofence');
  const allowSites = isEnabled('fleetIntelligence') && canEditPlaces(getUserRole());

  const [visible, setVisible] = useState(false);
  const [places, setPlaces] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [hiddenGroups, setHiddenGroups] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const requestRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setNotice('');
    try {
      const data = await TrackPlacesService.load({
        allowZones,
        allowSites,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setPlaces(confirmedPlaces(data));
      const notes = [];
      if (data.failed.length)
        notes.push(`Could not load ${data.failed.map((k) => LAYER_LABEL[k]).join(', ')}.`);
      if (data.sitesTruncated) notes.push('Showing the first 1,000 confirmed places.');
      setNotice(notes.join(' '));
    } catch {
      if (!controller.signal.aborted) setNotice('Could not load places. Try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [allowZones, allowSites]);

  const ensureLoaded = useCallback(() => {
    if (!places && !loading) load();
  }, [places, loading, load]);

  /** Put places on the map (and load them the first time). */
  const show = useCallback(() => {
    setVisible(true);
    ensureLoaded();
  }, [ensureLoaded]);

  const toggle = useCallback(() => {
    if (visible) setVisible(false);
    else show();
  }, [visible, show]);

  const toggleGroup = useCallback((id) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // The group chips filter the list and the map alike; search narrows the list only.
  const groupPlaces = useMemo(
    () => placesInGroups(places || [], hiddenGroups),
    [places, hiddenGroups],
  );
  const listPlaces = useMemo(() => searchPlaces(groupPlaces, query), [groupPlaces, query]);
  const shownPlaces = visible ? groupPlaces : [];
  const counts = useMemo(() => countPlacesByGroup(places || []), [places]);
  const selectedPlace = useMemo(
    () => groupPlaces.find((p) => p.id === selectedPlaceId) || null,
    [groupPlaces, selectedPlaceId],
  );

  return {
    visible,
    loading,
    loaded: places !== null,
    notice,
    places: places || [],
    listPlaces,
    shownPlaces,
    counts,
    hiddenGroups,
    query,
    setQuery,
    show,
    toggle,
    ensureLoaded,
    toggleGroup,
    retry: load,
    selectedPlace,
    selectPlace: setSelectedPlaceId,
  };
}
