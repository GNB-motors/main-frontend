import { useState, useCallback } from 'react';
import { ShareService } from '../services/ShareService';
import logger from '../utils/logger';

/**
 * Reusable share-link action. Any feature that wants a "share this one thing"
 * button drops this in:
 *
 *   const { createAndCopy, creating } = useShareLink();
 *   await createAndCopy(
 *     { resourceType: 'vehicle_location', resource: { registrationNumber } },
 *     { onDone: (url) => showToast('Link copied'), onError: () => showToast('Failed') }
 *   );
 *
 * It creates (or reuses) the link, copies the public URL to the clipboard, and
 * hands the URL back. Resource-agnostic — the caller owns the resourceType.
 */
export function useShareLink() {
  const [creating, setCreating] = useState(false);

  const createAndCopy = useCallback(async (params, { onDone, onError, copy = true } = {}) => {
    setCreating(true);
    try {
      const link = await ShareService.createShareLink(params);
      const url = link?.url || '';
      if (copy && url && navigator.clipboard) {
        await navigator.clipboard.writeText(url).catch(() => {});
      }
      onDone?.(url, link);
      return link;
    } catch (err) {
      logger.error('useShareLink', 'failed to create share link', err);
      onError?.(err);
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  return { createAndCopy, creating };
}

export default useShareLink;
