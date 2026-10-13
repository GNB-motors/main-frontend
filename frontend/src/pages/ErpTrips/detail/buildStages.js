import { FileText, Truck, Navigation, MapPin, PackageCheck, Scale, Calendar } from 'lucide-react';
import { money, day, stamp } from './tripFormat';

/**
 * The lifecycle, derived from trip state rather than hardcoded ordering.
 *
 * Each stage reports done / current / blocked so the UI can show one action
 * and visibly disable the rest. `blockedBy` names the stage that has to
 * happen first — a blocked button without a reason just looks broken.
 */
const buildStages = (data) => {
  if (!data) return [];

  // Only the OPERATIONS lifecycle lives on the stepper now. Sale Bill and
  // Payment are not trip steps — they hang off the receivable / payable
  // documents and render in the state-aware Financials section below.
  const isPlanned = data.state === 'PLANNED';
  const hasCn = !!data.consignment || data.cnGate === 'UPDATED' || data.loadedQty != null;
  const closed = !!data.tripClosedAt || data.state === 'TRIP_CLOSED';
  const hasPod = !!data.pod || data.state === 'POD_RECEIVED';
  const hasUnloading = !!data.unloading;

  const advances = data.advances || [];
  const u = data.unloading;

  return [
    {
      id: 'DO',
      label: 'Delivery Order',
      icon: FileText,
      done: true,
      facts: [
        { label: 'DO number', value: data.doId?.doNumber },
        { label: 'Client', value: data.partyId?.name },
        { label: 'Material', value: data.material || data.doId?.material },
        { label: 'Planned qty', value: data.plannedQty ? `${data.plannedQty} KL` : null },
      ],
    },
    {
      id: 'PLACEMENT',
      label: 'Placement',
      icon: Calendar,
      done: true,
      facts: [
        { label: 'Route', value: `${data.fromLocation || '—'} → ${data.toLocation || '—'}` },
        { label: 'Distance', value: data.totalKm ? `${data.totalKm} km` : null },
        { label: 'Vehicle', value: `${data.vehicleNumber || '—'} (${data.vehicleType || '—'})` },
        { label: 'Trip date', value: day(data.tripDate) },
      ],
    },
    /**
     * Only shown while the trip is queued. Starting it is the instant that
     * cuts the previous trip's telematics window, so it is a deliberate act
     * rather than something the placement did on the operator's behalf.
     */
    ...(isPlanned
      ? [
          {
            id: 'START',
            label: 'Start trip',
            icon: Navigation,
            done: false,
            available: true,
            action: { label: 'Start trip', drawer: 'start' },
            facts: [
              { label: 'Queued on', value: stamp(data.stageTimestamps?.plannedAt) },
              { label: 'Expected free', value: stamp(data.expectedFreeAt) },
            ],
          },
        ]
      : []),
    {
      id: 'ADVANCE_CN',
      label: 'Advance & CN',
      icon: Truck,
      done: hasCn,
      available: true,
      render: 'advanceCn',
      advances,
      hasCn,
    },
    {
      /**
       * The vehicle is on the road. This state has always existed —
       * ERP_TRIP_STATES has DISPATCHED, stamped the moment the CN is saved
       * (see erpTrip.constants) — but the lifecycle jumped straight from
       * "Advance & CN" to "Trip Close", so the longest-lived phase of a trip
       * was the one it never showed. There is deliberately no action: nothing
       * to do here but wait for the vehicle to arrive.
       */
      id: 'TRANSIT',
      label: 'In transit',
      icon: Navigation,
      done: closed || hasPod || hasUnloading,
      available: hasCn,
      blockedBy: 'CN update',
      facts: hasCn
        ? [
            { label: 'Dispatched', value: stamp(data.dispatchedAt) },
            { label: 'Expected free', value: stamp(data.expectedFreeAt) },
            { label: 'Distance', value: data.totalKm ? `${data.totalKm} km` : null },
          ]
        : null,
    },
    {
      id: 'CLOSE',
      label: 'Trip Close',
      icon: MapPin,
      done: closed,
      available: hasCn,
      blockedBy: 'CN update',
      action: { label: closed ? 'View / re-close' : 'Close trip', drawer: 'close' },
      facts: closed
        ? [
            { label: 'Closed at', value: stamp(data.tripClosedAt) },
            { label: 'Unload at', value: data.unloadLocation },
            {
              label: 'Closed by',
              value: data.tripClosedBy
                ? `${data.tripClosedBy.firstName || ''} ${data.tripClosedBy.lastName || ''}`.trim()
                : null,
            },
            { label: 'Remarks', value: data.closeRemarks || null },
          ]
        : null,
    },
    {
      id: 'POD',
      label: 'POD Receipt',
      icon: PackageCheck,
      done: hasPod,
      available: closed,
      blockedBy: 'Trip Close',
      action: { label: hasPod ? 'Update POD' : 'Upload POD', drawer: 'pod' },
      facts: data.pod
        ? [
            { label: 'Received', value: day(data.pod.receivedDate) },
            { label: 'Received by', value: data.pod.receivedByName || 'Office' },
          ]
        : null,
    },
    {
      id: 'UNLOADING',
      label: 'Unloading',
      icon: Scale,
      done: hasUnloading,
      available: hasPod,
      blockedBy: 'POD Receipt',
      action: {
        label: hasUnloading ? 'Update unloading' : 'Enter unloading',
        drawer: 'unloading',
      },
      facts: u
        ? [
            { label: 'Unloaded', value: `${u.unloadedQty ?? '—'} KL` },
            { label: 'Shortage', value: `${u.shortageQty ?? 0} (${money(u.shortageDeduction)})` },
            {
              label: 'Detention',
              value: `${u.detentionDays ?? 0} d (${money(u.detentionAmount)})`,
            },
          ]
        : null,
    },
  ];
};

export default buildStages;
