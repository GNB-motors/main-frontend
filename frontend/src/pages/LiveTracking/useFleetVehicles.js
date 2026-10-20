import { useMemo } from 'react';
import { resolveVehicleStatus, countVehiclesByStatus } from './vehicleStatus.js';
import { computeMapVehicles } from './mapPlotting.js';

export default function useFleetVehicles({
  rawPositions,
  vehiclesMeta,
  filter,
  searchQuery,
  selectedId,
}) {
  // Build Unified Vehicles List
  const vehicles = useMemo(() => {
    if (!Array.isArray(rawPositions) || rawPositions.length === 0) return [];

    return rawPositions
      .map((p) => {
        const reg = (p.registrationNumber || '').toUpperCase().trim();
        if (!reg) return null;
        const cleanReg = reg.replace(/\s+/g, '');
        const meta = vehiclesMeta[cleanReg] || vehiclesMeta[reg] || {};
        const st = resolveVehicleStatus(p).toLowerCase();
        const hasFix = p.latitude != null && p.longitude != null;
        const lat = hasFix ? Number(p.latitude) : null;
        const lng = hasFix ? Number(p.longitude) : null;
        const speed = p.speed != null ? Math.round(p.speed) : null;
        const fuel =
          p.primaryFuelLevel != null ? Number(Number(p.primaryFuelLevel).toFixed(1)) : null;
        const ignition = p.ignition === true || p.ignition === 'ON' ? 'ON' : 'OFF';
        const isLive = st !== 'offline' && !p.isStale;

        const minutesAgo = p.eventDateTime
          ? Math.max(0, Math.round((Date.now() - new Date(p.eventDateTime).getTime()) / 60000))
          : null;

        return {
          id: `live-${cleanReg}`,
          plate: reg,
          model: meta.model || meta.manufacturer || null,
          vin: meta.chassisNumber || p.vin || null,
          status: st,
          live: isLive,
          hasFix,
          lat,
          lng,
          area:
            meta.currentLocation ||
            meta.branch ||
            p.address ||
            (hasFix ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : null),
          speed,
          fuel,
          fuelUnit: p.fuelLevelUnit || null,
          ignition,
          gps: isLive ? 'Active' : 'No fix',
          ago: minutesAgo,
          eventDateTime: p.eventDateTime || null,
          courseDegrees: p.courseDegrees != null ? p.courseDegrees : null,
          odo: meta.odometer != null ? meta.odometer : null,
          regYear: meta.manufacturingYear != null ? meta.manufacturingYear : null,
        };
      })
      .filter(Boolean);
  }, [rawPositions, vehiclesMeta]);

  // Vehicle by ID map
  const byId = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => {
      map[v.id] = v;
      map[v.plate] = v;
    });
    return map;
  }, [vehicles]);

  // Counts for the connected status bar cards matching WheelsEye standard
  const counts = useMemo(() => countVehiclesByStatus(vehicles), [vehicles]);

  // Filtered vehicles according to the active top status card
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vehicles.filter((v) => {
      let matchesFilter = true;
      if (filter === 'all') {
        matchesFilter = true;
      } else if (filter === 'moving') {
        matchesFilter = v.status === 'moving';
      } else if (filter === 'stopped') {
        matchesFilter = v.status === 'stopped';
      } else if (filter === 'idling') {
        matchesFilter = v.status === 'idling';
      } else if (filter === 'offline') {
        matchesFilter = v.status === 'offline';
      } else if (filter === 'breakdown') {
        matchesFilter =
          v.status === 'breakdown' || v.status === 'workshop' || v.inWorkshop || v.isBreakdown;
      } else if (filter === 'faulty') {
        matchesFilter = v.status === 'faulty' || v.hasFault || (v.alertsCount && v.alertsCount > 0);
      } else if (filter === 'geofence') {
        matchesFilter = v.status === 'geofence' || v.inGeofenceAlert;
      } else if (filter === 'gps') {
        matchesFilter = v.live;
      }

      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        v.plate.toLowerCase().includes(q) ||
        (v.model || '').toLowerCase().includes(q) ||
        (v.vin || '').toLowerCase().includes(q) ||
        (v.area || '').toLowerCase().includes(q)
      );
    });
  }, [vehicles, filter, searchQuery]);

  // Selected vehicle object
  const selectedVehicle = selectedId ? byId[selectedId] : null;

  // Vehicles plotted on the Google Map:
  // Guarantees that if a vehicle is selected, it NEVER vanishes from the map even when
  // switching filter tabs (e.g. from moving to stopped) or when changing statuses.
  const mapVehicles = useMemo(() => {
    return computeMapVehicles(filteredVehicles, selectedVehicle);
  }, [filteredVehicles, selectedVehicle]);

  return { vehicles, counts, filteredVehicles, selectedVehicle, mapVehicles };
}
