import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import PlaceHubService from '../PlaceHubService.js';
import {
  KIND_META,
  newDraft,
  draftFromPlace,
  validateDraft,
  payloadFor,
  centroidOf,
} from '../placeHubModel.js';
import errorText from './errorText.js';

export default function usePlaceEditor({
  confirm,
  focusOn,
  tab,
  setTab,
  setSelectedId,
  loadPlaces,
  loadFuel,
}) {
  const [draft, setDraft] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const draftErrors = useMemo(
    () => (draft && showErrors ? validateDraft(draft) : {}),
    [draft, showErrors],
  );

  const startAdd = useCallback(
    (kind, seed = {}) => {
      setDraft(newDraft(kind, seed));
      setShowErrors(false);
      if (seed.center) focusOn(seed.center.lat, seed.center.lng, 16);
    },
    [focusOn],
  );

  const startEdit = useCallback(
    (item) => {
      const next = draftFromPlace(item);
      if (!next) return;
      setDraft(next);
      setShowErrors(false);
      focusOn(item.lat, item.lng, 15);
    },
    [focusOn],
  );

  const changeDraft = useCallback((patch) => {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, ...patch };
      if (patch.shape === 'circle' && !next.center && d.polygon.length) {
        next.center = centroidOf(d.polygon);
      }
      return next;
    });
  }, []);

  // Map drags can overshoot; clamp there so the circle never shows a radius
  // the store would refuse. Typed values are left alone and validated instead.
  const changeDraftFromMap = useCallback((patch) => {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, ...patch };
      if (patch.radiusM != null) {
        const meta = KIND_META[d.kind];
        next.radiusM = Math.min(meta.maxRadius, Math.max(meta.minRadius, patch.radiusM));
      }
      return next;
    });
  }, []);

  const changeKind = (kind) => {
    setDraft((d) => {
      const center = d.center || (d.polygon.length ? centroidOf(d.polygon) : null);
      return newDraft(kind, { name: d.name, center });
    });
    setShowErrors(false);
  };

  const cancelDraft = () => {
    setDraft(null);
    setShowErrors(false);
  };

  const save = async () => {
    setShowErrors(true);
    if (Object.keys(validateDraft(draft)).length) return;
    const body = payloadFor(draft);
    const { kind, mode } = draft;
    const editing = mode === 'edit';
    setSaving(true);
    try {
      let id = draft.sourceId;
      if (kind === 'WAREHOUSE') {
        const res = editing
          ? await PlaceHubService.updateWarehouse(id, body)
          : await PlaceHubService.createWarehouse(body);
        id = id || res?._id;
      } else if (kind === 'ZONE') {
        const res = editing
          ? await PlaceHubService.updateZone(id, body)
          : await PlaceHubService.createZone(body);
        id = id || res?._id;
      } else {
        const res = editing
          ? await PlaceHubService.updateHotspot(id, body)
          : await PlaceHubService.createHotspot(body);
        id = id || res?._id;
      }
      toast.success(editing ? 'Changes saved' : `${KIND_META[kind].label} added`);
      setDraft(null);
      setShowErrors(false);
      if (kind === 'HOTSPOT') {
        await loadFuel();
        if (tab !== 'fuel') setTab('fuel');
        if (id) setSelectedId(`hotspot:${id}`);
      } else {
        await loadPlaces();
        if (tab === 'places' && id)
          setSelectedId(`${kind === 'WAREHOUSE' ? 'warehouse' : 'zone'}:${id}`);
        if (tab === 'idling') toast.info('Idling inside this place now counts as legit.');
      }
    } catch (err) {
      toast.error(errorText(err, 'Could not save the place'));
    } finally {
      setSaving(false);
    }
  };

  const removePlace = async (place) => {
    const isWarehouse = place.source === 'warehouse';
    const ok = await confirm({
      title: isWarehouse ? `Deactivate ${place.name}?` : `Delete ${place.name}?`,
      body: isWarehouse
        ? 'Trips stop anchoring on this yard and its entry/exit tracking stops.'
        : 'Trucks stop raising entry and exit alerts here, and idling here stops counting as legit.',
      consequence: isWarehouse
        ? 'Vehicles based here must be moved to another yard first.'
        : undefined,
      confirmLabel: isWarehouse ? 'Deactivate' : 'Delete zone',
      danger: true,
    });
    if (!ok) return;
    try {
      if (isWarehouse) await PlaceHubService.deactivateWarehouse(place.sourceId);
      else await PlaceHubService.deleteZone(place.sourceId);
      toast.success(isWarehouse ? 'Warehouse deactivated' : 'Zone deleted');
      setSelectedId(null);
      await loadPlaces();
    } catch (err) {
      toast.error(errorText(err, 'Could not remove the place'));
    }
  };

  const toggleHotspot = async (h) => {
    try {
      await PlaceHubService.updateHotspot(h.sourceId, { active: !h.active });
      toast.success(h.active ? 'Hotspot dismissed' : 'Hotspot reactivated');
      await loadFuel();
    } catch (err) {
      toast.error(errorText(err, 'Could not update the hotspot'));
    }
  };

  const hiddenPlaceId =
    draft?.mode === 'edit'
      ? `${{ WAREHOUSE: 'warehouse', ZONE: 'zone', HOTSPOT: 'hotspot' }[draft.kind]}:${draft.sourceId}`
      : null;

  return {
    draft,
    draftErrors,
    saving,
    startAdd,
    startEdit,
    changeDraft,
    changeDraftFromMap,
    changeKind,
    cancelDraft,
    save,
    removePlace,
    toggleHotspot,
    hiddenPlaceId,
  };
}
