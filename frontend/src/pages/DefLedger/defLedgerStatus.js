import { CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Info } from 'lucide-react';

export const TONE = {
  ok: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  bad: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  warn: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  muted: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

// Mirrors defLedger.service statusOf(), most urgent first.
export const STATUS = {
  NOT_ASSESSED: { label: 'Not assessed', tone: 'muted', Icon: Info },
  NOT_APPLICABLE: { label: 'Not applicable', tone: 'muted', Icon: Info },
  FLAGGED: { label: 'Needs review', tone: 'bad', Icon: AlertTriangle },
  DEFICIT: { label: 'Unlogged burn', tone: 'warn', Icon: AlertTriangle },
  LOW_DOSING: { label: 'Low dosing', tone: 'warn', Icon: TrendingDown },
  HIGH_DOSING: { label: 'High dosing', tone: 'warn', Icon: TrendingUp },
  COMPLIANT: { label: 'In band', tone: 'ok', Icon: CheckCircle2 },
  NOT_REPORTED: { label: 'DEF not reported', tone: 'muted', Icon: Info },
  NO_DATA: { label: 'No telemetry', tone: 'muted', Icon: Info },
};

export const STATUS_NOTE = {
  NOT_ASSESSED: 'Dosing is shown without a calibrated assessment band for this vehicle.',
  NOT_APPLICABLE: 'Vehicle data explicitly identifies that SCR dosing is not required.',
  FLAGGED:
    'The CAN DEF level dropped by more than the engine burned, or a logged fill is larger than the tank. Check the tank, cap and lines, and the logged fills.',
  DEFICIT:
    'The truck burned more DEF than the AdBlue logged for it. Either fills are not being logged or a logged fill is wrong.',
  LOW_DOSING:
    'DEF is running below the normal share of diesel. Low dosing on a BS-VI truck can mean a faulty or bypassed SCR system.',
  HIGH_DOSING:
    'DEF is running above the normal share of diesel. Check for a leak or a faulty dosing unit.',
  COMPLIANT: 'DEF dosing is within the normal share of diesel burned.',
  NOT_REPORTED:
    "This truck's telematics sends 0 DEF on every hour despite real diesel burn, so dosing cannot be judged from it.",
  NO_DATA: 'No hourly FleetEdge telemetry has arrived for this vehicle yet.',
};

export const SENSOR_FAULT_LABEL = {
  VENDOR_SENTINEL: 'Sensor tank capacity is not configured',
  INVALID_TANK_CAPACITY: 'Sensor reported an implausible tank capacity',
  CHANGE_EXCEEDS_TANK: 'Sensor change exceeds the tank capacity',
};
