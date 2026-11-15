import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

/**
 * Service functions for the unified owner-alert feed (in-app only).
 */
export const OwnerAlertsService = {
  /**
   * Paginated alert feed, newest first.
   * @param {object} params - { vehicle, type, acknowledged, from, to, page, limit }
   */
  getAlerts: async (params = {}, signal) => {
    try {
      const response = await apiClient.get(`/api/owner-alerts`, { params, signal });
      return response.data?.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      throw ApiError.from(error);
    }
  },

  /**
   * The feed for one view. The server filters by `severity` once B0b is
   * deployed; the server before it rejects the parameter with a 400, so the
   * request is repeated without it and the answer is marked `legacy: true` —
   * the page then shows every open alert and claims no severity counts.
   */
  getAlertsForView: async (params = {}, signal) => {
    if (!params.severity) {
      const data = await OwnerAlertsService.getAlerts(params, signal);
      return { ...data, legacy: !data?.meta?.counts };
    }
    try {
      const data = await OwnerAlertsService.getAlerts(params, signal);
      return { ...data, legacy: !data?.meta?.counts };
    } catch (error) {
      if (error?.status !== 400) throw error;
      const rest = { ...params };
      delete rest.severity;
      const data = await OwnerAlertsService.getAlerts(rest, signal);
      return { ...data, legacy: true };
    }
  },

  /**
   * Open critical alerts for the bell: `{ count, records }`. `count` is the
   * server's count, or null when the server cannot tell critical apart yet
   * (then the bell shows no number). `records` seed the live-stream dedupe.
   */
  getCriticalUnread: async (signal) => {
    try {
      const data = await OwnerAlertsService.getAlerts(
        { acknowledged: false, severity: 'critical', limit: 50 },
        signal,
      );
      const critical = data?.meta?.counts?.critical;
      const count =
        critical !== null && critical !== undefined && Number.isFinite(Number(critical))
          ? Number(critical)
          : null;
      return { count, records: count == null ? [] : data.records || [] };
    } catch (error) {
      if (error?.status === 400) return { count: null, records: [] };
      throw error;
    }
  },

  /**
   * Acknowledge an alert.
   * @param {string} id - alert id
   */
  acknowledgeAlert: async (id) => {
    try {
      const response = await apiClient.put(`/api/owner-alerts/${id}/ack`);
      return response.data?.data || {};
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /** Acknowledge all unread alerts (clears the bell badge once seen). */
  acknowledgeAllAlerts: async () => {
    try {
      const response = await apiClient.put(`/api/owner-alerts/ack-all`);
      return response.data?.data || {};
    } catch (error) {
      throw ApiError.from(error);
    }
  },
};

export const ALERT_TYPE_LABELS = {
  THEFT_CORROBORATED: 'Matching fuel-loss signals — review',
  FUEL_GAUGE_FAULT: 'Fuel sensor needs checking',
  FUEL_PARKED_LEVEL_DROP: 'Fuel level fell while parked',
  DRIVER_LOCATION_MISMATCH: 'Driver assignment to check',
  TYRE_REPLACEMENT_DUE: 'Tyre replacement due',
  IALERT_REAUTH_REQUIRED: 'Reconnect iALERT',
  IALERT_RELINK_DUE: 'iALERT connection expiring',
  IALERT_SUBSCRIPTION_EXPIRED: 'iALERT plan expired',
  IALERT_SUBSCRIPTION_EXPIRING: 'iALERT plan expiring',
  FUEL_SIPHON_SUSPECTED: 'Fuel loss — please review',
  FUEL_DATA_REVIEW: 'Fuel data review',
  REFUEL_ESTIMATED: 'Refuel estimated',
  ADBLUE_BALANCE_FLAG: 'AdBlue balance — please review',
  IDLING_BURN_HIGH: 'High idling burn',
  EV_LOW_SOC: 'EV low charge',
  FLEETEDGE_SUBSCRIPTION_EXPIRING: 'Subscription expiring',
  FLEETEDGE_SUBSCRIPTION_EXPIRED: 'Subscription expired',
  FLEETEDGE_ALERT_REFUEL: 'FleetEdge refuel alert',
  FLEETEDGE_ALERT_FUEL_DRAIN: 'FleetEdge fuel drain alert',
  FLEETEDGE_ALERT_GEOFENCE_ENTERED: 'Geofence entered',
  FLEETEDGE_ALERT_GEOFENCE_EXITED: 'Geofence exited',
  FLEETEDGE_ALERT_OVERSPEED: 'Overspeed alert',
  FLEETEDGE_REAUTH_REQUIRED: 'FleetEdge re-auth needed',
  FLEETEDGE_RELINK_DUE: 'FleetEdge re-link due',
  // Trip Economics (movement) alerts
  DEVIATION_DETECTED: 'Deviation detected',
  DEVIATION_IN_PROGRESS: 'Deviation in progress',
  WATCHED_PLACE_VISIT: 'Watched place visit',
  UNAPPROVED_SERVICE_VISIT: 'Unapproved service visit',
  RECONCILE_GAP: 'Fuel reconcile gap',
};
