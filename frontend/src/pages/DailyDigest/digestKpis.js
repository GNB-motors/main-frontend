import { Truck, Fuel, Calendar, Activity, Droplet } from 'lucide-react';
import { formatNum } from '../../utils/formatters';

// Counts fleet-calendar "trip" events that cover today — both ErpTrip rows
// (single-day, dated to tripDate) and VehicleTour rows (GPS-detected
// warehouse-to-warehouse "automatic" trips; an OPEN tour is dated to when it
// started, with `len` spanning through today). A same-day equality check on
// `date` alone would miss a multi-day automatic trip that started before
// today and is still running — this checks today falls inside [date, date +
// len) instead, same span math the Gantt bars use.
function countTripsToday(calendar) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  // IST days, whatever timezone the browser is in (audit DD-07).
  const istDay = (d) => Math.floor((new Date(d).getTime() + 330 * 60000) / DAY_MS);
  const dayOffset = (d) => istDay(d) - istDay(new Date());
  return (calendar?.vehicles || []).reduce(
    (n, v) =>
      n +
      (v.events || []).filter((e) => {
        if (e.type !== 'trip') return false;
        const start = dayOffset(e.date);
        return start <= 0 && start + (e.len || 1) > 0;
      }).length,
    0,
  );
}

export function buildDigestKpis({
  fleetDashboard,
  m,
  calendar,
  healthScore,
  tripsToday: autoTrips,
  // The selected digest window in whole days (1 = today, 2 = last 2 days…).
  // Defaults to 1 so existing callers keep the single-day wording.
  rangeDays = 1,
  // IST calendar dates of the window edges, for the Trips tile's deep-link.
  fromYmd = null,
  toYmd = null,
}) {
  // The Trip page's own count when it loaded; the calendar's older count only as a fallback.
  const tripsToday = autoTrips != null ? autoTrips : countTripsToday(calendar);
  const windowWord = rangeDays <= 1 ? 'today' : `last ${rangeDays} days`;
  const tripsHref =
    autoTrips == null
      ? '#nd-calendar'
      : rangeDays <= 1 || !fromYmd || !toYmd
        ? '/auto-trips?range=today'
        : `/auto-trips?range=custom&from=${fromYmd}&to=${toYmd}`;

  const vehicleCount = fleetDashboard?.length || 0;
  const activeVehicleCount = (fleetDashboard || []).filter(
    (v) => v.status !== 'MAINTENANCE',
  ).length;

  return [
    {
      id: 'active',
      icon: Truck,
      // Not telematics activity: the fleet master's "not in maintenance" (audit DD-01).
      label: 'Available',
      value: formatNum(activeVehicleCount),
      unit: `/ ${formatNum(vehicleCount)}`,
      note: 'not in maintenance',
      to: '/vehicles/dashboard',
      accent: true,
    },
    {
      id: 'fuel',
      icon: Fuel,
      // Telemetry burn × diesel price — an estimate, not money paid (audit DD-04).
      label: 'Fuel burned (est.)',
      value: `₹${formatNum(m?.fuelCostInr || 0)}`,
      note: `${windowWord} · from telemetry`,
      to: '/refuel-logs',
    },
    {
      id: 'trips',
      icon: Calendar,
      label: rangeDays <= 1 ? 'Trips today' : `Trips · ${rangeDays}d`,
      value: formatNum(tripsToday),
      note: `left a pickup ${windowWord}`,
      to: tripsHref,
    },
    {
      id: 'def',
      icon: Droplet,
      label: 'AdBlue/DEF spend',
      value: `₹${formatNum(m?.defCostInr || 0)}`,
      note: windowWord,
    },
    {
      id: 'health',
      icon: Activity,
      label: 'Fleet health',
      value: healthScore ? `Grade ${healthScore.grade}` : '—',
      note: healthScore ? `${formatNum(healthScore.score)}/100 this week` : 'this week',
    },
  ];
}
