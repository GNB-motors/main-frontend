import apiClient from '../../utils/axiosConfig';

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
            console.error("API Error fetching owner alerts:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch owner alerts." };
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
            console.error("API Error acknowledging alert:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not acknowledge the alert." };
        }
    },
};

export const ALERT_TYPE_LABELS = {
    FUEL_SIPHON_SUSPECTED: 'Fuel loss — please review',
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
};
