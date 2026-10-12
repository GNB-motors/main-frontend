import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import PlaceHubService from '../PlaceHubService.js';

export default function useLinkedPlace({
  params,
  setParams,
  loaded,
  places,
  allowSites,
  pickFromList,
  setGroup,
  setData,
}) {
  // `?place=<hub id>` opens that place (links from the Mileage refuel feed).
  // A suggestion outside the busiest 200 loaded is fetched on its own.
  const linkedPlace = params.get('place');
  const fetchedLink = useRef(null);
  useEffect(() => {
    if (!linkedPlace || !loaded.places) return;
    const p = places.find((x) => x.id === linkedPlace);
    if (p) {
      setGroup(p.group === 'review' || p.group === 'rejected' ? p.group : 'all');
      pickFromList(p.id, p.lat, p.lng);
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('place');
          return next;
        },
        { replace: true },
      );
      return;
    }
    const [prefix, sourceId] = linkedPlace.split(':');
    if (prefix !== 'site' || !sourceId || !allowSites || fetchedLink.current === linkedPlace)
      return;
    fetchedLink.current = linkedPlace;
    PlaceHubService.loadSite(sourceId)
      .then((site) => {
        if (!site) return;
        setData((d) => ({
          ...d,
          sites: [...d.sites.filter((s) => String(s._id) !== String(site._id)), site],
        }));
      })
      .catch(() => toast.error('Could not open that place'));
  }, [linkedPlace, loaded.places, places, allowSites, pickFromList, setParams, setGroup, setData]);
}
