import { useEffect, useMemo, useState } from 'react';
import { countVehiclesByStatus } from './vehicleStatus.js';
import { viewOf } from '../../utils/liveView.js';
import { normalizeManufacturer } from './manufacturerFilters.js';

export default function useFleetVehicles({
  rawPositions,
  vehiclesMeta,
  filter,
  searchQuery,
  selectedId,
  selectedManufacturers = [],
}) {
  // A fix ages into "offline" without a new row arriving, so re-read the view
  // once a minute (the rule itself lives in the backend's liveVehicleView).
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  // Build Unified Vehicles List
  const vehicles = useMemo(() => {
    if (!Array.isArray(rawPositions) || rawPositions.length === 0) return [];

    return rawPositions
      .map((p) => {
        const reg = (p.registrationNumber || '').toUpperCase().trim();
        if (!reg) return null;
        const cleanReg = reg.replace(/\s+/g, '');
        // Master fields come joined on the row (backend positionsMaster); the
        // picker list is only a fallback for an older backend.
        const master = p.vehicle || null;
        const meta = master ? {} : vehiclesMeta[cleanReg] || vehiclesMeta[reg] || {};
        const view = viewOf(p, nowMs);
        const lat = view.hasPosition ? Number(p.latitude) : null;
        const lng = view.hasPosition ? Number(p.longitude) : null;
        const fuel =
          p.fuel ||
          (p.primaryFuelLevel != null
            ? {
                value: Number(Number(p.primaryFuelLevel).toFixed(1)),
                unit: p.fuelLevelUnit === 'litres' ? 'L' : null,
              }
            : null);
        const ago = view.ageMin == null ? null : Math.round(view.ageMin);

        return {
          id: `live-${cleanReg}`,
          plate: reg,
          vehicleId: master?.vehicleId || meta._id || null,
          manufacturer: normalizeManufacturer(
            master ? master.manufacturer : meta.manufacturer || meta.make,
          ),
          model: (master ? master.model : meta.model) || null,
          vin: (master ? master.chassisNumber : meta.chassisNumber) || p.vin || null,
          manufactureYear: master ? master.manufactureYear : (meta.manufactureYear ?? null),
          driver: p.driver || null,
          status: view.status,
          freshness: view.freshness,
          live: !view.isOffline,
          // "has a position" draws the marker; "GPS fix" means a CURRENT one (DC-11).
          hasFix: view.hasPosition,
          hasGpsFix: view.hasGpsFix,
          lat,
          lng,
          // A vehicle's assigned branch is not its current GPS location.
          area: typeof p.address === 'string' ? p.address.trim() || null : null,
          // An old fix's speed and ignition are not facts about now (DC-10).
          speed: view.speedKmh,
          fuel: fuel ? fuel.value : null,
          fuelReading: fuel,
          fuelUnit: fuel ? fuel.unit : null,
          defLevel: p.defLevel ?? null,
          defUnit: p.defLevelUnit || null,
          ignition: view.ignition === true ? 'ON' : view.ignition === false ? 'OFF' : '—',
          gps: view.hasGpsFix ? 'Fix' : view.hasPosition ? 'Last known' : 'No fix',
          ago,
          lastFixAt: view.lastFixAt,
          eventDateTime: p.eventDateTime || null,
          courseDegrees: p.courseDegrees != null ? p.courseDegrees : null,
          odo: p.odometer ?? null,
        };
      })
      .filter(Boolean);
  }, [rawPositions, vehiclesMeta, nowMs]);

  // Vehicle by ID map
  const byId = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => {
      map[v.id] = v;
      map[v.plate] = v;
    });
    return map;
  }, [vehicles]);

  // Only the makes this fleet actually has (audit DC-06).
  const manufacturers = useMemo(() => {
    const names = new Set();
    vehicles.forEach((v) => {
      if (v.manufacturer) names.add(v.manufacturer);
    });
    Object.values(vehiclesMeta).forEach((meta) => {
      const name = normalizeManufacturer(meta.manufacturer || meta.make);
      if (name) names.add(name);
    });
    return [...names];
  }, [vehicles, vehiclesMeta]);

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
      const matchesFilter =
        filter === 'all' ? true : filter === 'gps' ? v.live : v.status === filter;
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
