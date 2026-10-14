import { useCallback, useState } from 'react';
import { useShareLink } from '../../hooks/useShareLink';
import copyText from './copyText.js';

export default function useVehicleShareDialog(showToast) {
  const { createAndCopy: createShareAndCopy, creating: shareCreating } = useShareLink();
  // Share dialog: null = closed, else { plate, ttlDays, trailHours, url }.
  const [shareDialog, setShareDialog] = useState(null);

  // Share Page Link (kept for when universal share button is restored)
  const _handleShareAll = useCallback(() => {
    copyText(window.location.href).then(
      () => showToast('Live tracking link copied to clipboard'),
      () => showToast('Could not copy the link'),
    );
  }, [showToast]);

  // Share Vehicle Link — opens a dialog to choose how long the link works and
  // how much recorded trail a viewer may see, then mints a public,
  // document-style link that exposes ONLY this vehicle's live location.
  const handleShareVehicle = useCallback((v) => {
    setShareDialog({ plate: v.plate, ttlDays: 7, trailHours: 6, url: '' });
  }, []);

  const submitShareLink = useCallback(() => {
    if (!shareDialog) return;
    const { plate, ttlDays, trailHours } = shareDialog;
    createShareAndCopy(
      {
        resourceType: 'vehicle_location',
        resource: { registrationNumber: plate },
        ttlDays,
        options: { trailHours },
      },
      {
        onDone: (url, _link, { copied } = {}) => {
          setShareDialog((prev) => (prev ? { ...prev, url } : prev));
          showToast(
            copied ? `Public link copied · ${plate}` : `Link ready · ${plate} — copy it below`,
          );
        },
        onError: () => showToast(`Could not create link for ${plate}`),
      },
    );
  }, [shareDialog, createShareAndCopy, showToast]);

  return { shareDialog, setShareDialog, shareCreating, handleShareVehicle, submitShareLink };
}
