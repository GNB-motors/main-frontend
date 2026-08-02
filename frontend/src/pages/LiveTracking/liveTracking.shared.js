import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

/**
 * Presentation helpers for live vehicle positions, shared by the full Live
 * Tracking page and the dashboard's embedded mini-map so the two views can
 * never disagree about colours, state labels or timestamps.
 */

export const IST_ZONE = 'Asia/Kolkata';

export const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

// Reads our own DB; the backend cron is what talks to FleetEdge.
export const POLL_INTERVAL_MS = 45 * 1000;

export const STATE_META = {
    ACTIVE: { color: '#10B981', label: 'Active' },
    PARKED: { color: '#F59E0B', label: 'Parked' },
    OFFLINE: { color: '#94A3B8', label: 'Offline' },
};

export const getStateMeta = (state) => STATE_META[state] || STATE_META.OFFLINE;

export const toIST = (utcStr) => (utcStr ? dayjs.utc(utcStr).tz(IST_ZONE) : null);

export const formatIST = (utcStr) => {
    const d = toIST(utcStr);
    return d ? d.format('DD MMM YYYY, hh:mm A [IST]') : '—';
};

export const formatRelativeIST = (utcStr) => {
    const d = toIST(utcStr);
    return d ? d.fromNow() : null;
};

export const pinIcon = (color, dimmed) => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" opacity="${dimmed ? 0.55 : 1}">
          <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="${color}"/>
          <circle cx="16" cy="14" r="6" fill="white"/>
        </svg>`
    )}`,
    scaledSize: typeof window !== 'undefined' && window.google
        ? new window.google.maps.Size(32, 40)
        : undefined,
});

/** Only rows the map can actually plot. */
export const withCoordinates = (positions) =>
    (positions || []).filter((p) => p.latitude != null && p.longitude != null);

/** Frame every plotted vehicle at once instead of a fixed country-wide zoom. */
export const fitMapToPositions = (map, located) => {
    if (!map || !window.google || !located?.length) return;

    if (located.length === 1) {
        map.setCenter({ lat: located[0].latitude, lng: located[0].longitude });
        map.setZoom(12);
        return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    located.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
    map.fitBounds(bounds, 60);
};
