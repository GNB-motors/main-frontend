import { AlertTriangle, Droplet, BadgeCheck, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SlideOver from '../../components/cluster/SlideOver';
import { formatLitres, formatPct } from '../../utils/formatters';
import { formatDateTimeIST, formatDateIST } from '../../utils/dateUtils';
import StatusBadge from './StatusBadge';
import { STATUS_NOTE, SENSOR_FAULT_LABEL } from './defLedgerStatus';
import { humanizeFlagType, signedLitres } from './defLedgerFormat';
import DataFreshness from './DataFreshness';

function DefDetailDrawer({ vehicle, onClose }) {
  const navigate = useNavigate();
  if (!vehicle) return null;
  const claimsTracked = vehicle.claimsTracked === true;
  const verified = claimsTracked && (vehicle.flagCount ?? 0) === 0;
  const flags = vehicle.flags || [];
  const fills = vehicle.fills || [];
  const band = vehicle.defBand || {};
  const coverage =
    vehicle.coverageFrom && vehicle.coverageTo
      ? `${formatDateIST(vehicle.coverageFrom)} – ${formatDateIST(vehicle.coverageTo)}`
      : null;
  const cells = [
    {
      label: 'Logged AdBlue',
      value: claimsTracked ? formatLitres(vehicle.claimedAdblueL) : 'Not logged',
    },
    { label: 'DEF burned', value: formatLitres(vehicle.telemetryDefL) },
    { label: 'Sensor fills', value: formatLitres(vehicle.sensorFillL) },
    {
      label: 'Balance',
      value: claimsTracked ? signedLitres(vehicle.expectedBalanceL) : '—',
      bad: claimsTracked && vehicle.expectedBalanceL != null && vehicle.expectedBalanceL < 0,
    },
  ];

  return (
    <SlideOver
      open={Boolean(vehicle)}
      onClose={onClose}
      title={`DEF & AdBlue — ${vehicle.registrationNumber}`}
      subtitle={coverage ? `Telemetry ${coverage}` : 'No telemetry yet'}
    >
      <div className="flex flex-col gap-5 p-1">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <DataFreshness vehicle={vehicle} />
          {vehicle.lastComputedAt && (
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Calculated on {formatDateTimeIST(vehicle.lastComputedAt)} IST
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            The figures reflect the telemetry coverage date; recalculation does not make older
            telemetry current.
          </p>
        </div>
        {(vehicle.sensorFaults || []).length > 0 && (
          <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
            <p className="font-semibold">Sensor observations</p>
            {(vehicle.sensorFaults || []).map((fault, index) => (
              <p key={`${fault.reason}-${index}`}>
                {SENSOR_FAULT_LABEL[fault.reason] || 'Sensor reading needs review'}
                {' · '}
                {fault.count || 1} readings
                {fault.lastAt || fault.at
                  ? ` · last ${formatDateTimeIST(fault.lastAt || fault.at)}`
                  : ''}
              </p>
            ))}
          </div>
        )}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <StatusBadge status={vehicle.status} />
              {verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </span>
            {vehicle.dosingRatioPct != null && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                DEF {formatPct(vehicle.dosingRatioPct, { decimals: 1 })} of{' '}
                {formatLitres(vehicle.fuelUsedL, { decimals: 0 })} diesel
                {Number.isFinite(band.min) && Number.isFinite(band.max)
                  ? ` · normal ${band.min}–${band.max}%`
                  : ' · not assessed'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            {cells.map((c) => (
              <div
                key={c.label}
                className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {c.label}
                </span>
                <span
                  className={`font-mono text-base font-bold ${
                    c.bad
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {c.value}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            {STATUS_NOTE[vehicle.status] || STATUS_NOTE.NO_DATA}
            {!claimsTracked &&
              ' No AdBlue purchases are logged for this vehicle, so there is no balance to reconcile. DEF consumption and sensor findings are still shown.'}
          </p>

          <button
            type="button"
            onClick={() => navigate(`/def-ledger/log?vehicleId=${vehicle.vehicleId}`)}
            className="pshell-btn pshell-btn--primary"
          >
            <Plus size={16} />
            {claimsTracked ? 'Log another AdBlue fill' : 'Log AdBlue for this truck'}
          </button>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2.5">
            {vehicle.alertsSuppressed ? 'Held-back findings' : 'Review flags'} (
            {vehicle.flagCount ?? flags.length})
          </h4>
          {vehicle.alertsSuppressed && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1.5 mb-2.5">
              Findings the sweep computed but did not raise — iALERT alerts are off for this
              account.
            </p>
          )}
          {flags.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
              {vehicle.alertsSuppressed
                ? 'No held-back findings in this calculation.'
                : 'Nothing to review.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {flags.map((f, i) => (
                <div
                  key={`${f.type}-${f.at}-${i}`}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      {humanizeFlagType(f.type)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      {vehicle.alertsSuppressed && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600"
                          title="Computed but not raised: iALERT alerts are off for this account."
                        >
                          Held back
                        </span>
                      )}
                      {f.litres != null && (
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {formatLitres(f.litres)}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {f.message}
                  </p>
                  <span className="font-mono text-[10px] text-slate-400">
                    {formatDateTimeIST(f.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2.5">
            Fills seen by the DEF sensor ({vehicle.sensorFillCount ?? fills.length})
          </h4>
          {fills.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
              No fills detected on the CAN DEF level.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {fills.map((f, i) => (
                <div
                  key={`${f.at}-${i}`}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Droplet className="w-3.5 h-3.5 text-sky-500" />
                    {formatDateTimeIST(f.at)}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    +{formatLitres(f.litres)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  );
}

export default DefDetailDrawer;
