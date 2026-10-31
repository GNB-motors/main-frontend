import { useMemo } from 'react';
import { resolveVehicleStatus, countVehiclesByStatus } from './vehicleStatus.js';
import { normalizeManufacturer } from './manufacturerFilters.js';

export default function useFleetVehicles({
  rawPositions,
  vehiclesMeta,
  filter,
  searchQuery,
  selectedId,
  selectedManufacturers = [],
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
          manufacturer: normalizeManufacturer(meta.manufacturer || meta.make),
          model: meta.model || null,
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
          odo: p.odometer != null ? p.odometer : meta.odometer != null ? meta.odometer : null,
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

  const manufacturers = useMemo(() => {
    const names = new Set(['Tata', 'Ashok Leyland']);
    Object.values(vehiclesMeta).forEach((meta) => {
      const name = normalizeManufacturer(meta.manufacturer || meta.make);
      if (name) names.add(name);
    });
    return [...names];
  }, [vehiclesMeta]);

  const scopedVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          selectedManufacturers.length === 0 ||
          selectedManufacturers.includes(v.manufacturer || 'Unclassified'),
      ),
    [vehicles, selectedManufacturers],
  );

  // Counts for the connected status bar cards matching WheelsEye standard
  const counts = useMemo(() => countVehiclesByStatus(scopedVehicles), [scopedVehicles]);

  // Filtered vehicles according to the active top status card
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedVehicles.filter((v) => {
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
        (v.manufacturer || '').toLowerCase().includes(q) ||
        (v.vin || '').toLowerCase().includes(q) ||
        (v.area || '').toLowerCase().includes(q)
      );
    });
  }, [scopedVehicles, filter, searchQuery]);

  // A selection outside the visible scope must not keep an unexplained map marker.
  const selectedVehicle =
    selectedId && filteredVehicles.some((v) => v.id === selectedId) ? byId[selectedId] : null;
  const mapVehicles = useMemo(
    () =>
      filteredVehicles.filter(
        (v) =>
          v.hasFix &&
          Number.isFinite(v.lat) &&
          Number.isFinite(v.lng) &&
          Math.abs(v.lat) <= 90 &&
          Math.abs(v.lng) <= 180,
      ),
    [filteredVehicles],
  );

  return { vehicles, counts, filteredVehicles, selectedVehicle, mapVehicles, manufacturers };
}
