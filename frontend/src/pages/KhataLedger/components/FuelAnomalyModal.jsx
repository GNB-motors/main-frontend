import React from 'react';
import { AlertTriangle, X, Gauge, HelpCircle, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const FuelAnomalyModal = ({ isOpen, onClose, flag, title = 'Fuel Mileage Anomaly' }) => {
  if (!isOpen || !flag) return null;

  const isUnderperforming = (flag.variancePct || 0) < 0;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-amber-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="flex items-center justify-between bg-amber-500/10 px-5 py-4 border-b border-amber-200">
          <div className="flex items-center gap-2.5 text-amber-900 font-semibold">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
              <AlertTriangle size={20} />
            </div>
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-amber-100/50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          <p className="text-gray-600 text-xs leading-relaxed">
            This fuel refill triggered an anomaly flag based on historical baseline comparisons for
            this vehicle model and route.
          </p>

          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">Actual Mileage</span>
              <span className="text-lg font-bold text-gray-900 flex items-center gap-1">
                <Gauge size={16} className="text-gray-400" />
                {flag.actualKmPerL != null ? flag.actualKmPerL.toFixed(2) : '-'}{' '}
                <span className="text-xs font-normal text-gray-500">km/L</span>
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">Expected Baseline</span>
              <span className="text-lg font-bold text-gray-900 flex items-center gap-1">
                <Gauge size={16} className="text-gray-400" />
                {flag.expectedKmPerL != null ? flag.expectedKmPerL.toFixed(2) : '-'}{' '}
                <span className="text-xs font-normal text-gray-500">km/L</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-50/60 border-amber-200 text-amber-900">
            <span className="font-medium text-xs">Performance Variance</span>
            <span className="font-bold text-sm flex items-center gap-1">
              {isUnderperforming ? (
                <ArrowDownRight size={16} className="text-rose-600" />
              ) : (
                <ArrowUpRight size={16} className="text-emerald-600" />
              )}
              {flag.variancePct != null
                ? `${flag.variancePct > 0 ? '+' : ''}${flag.variancePct.toFixed(1)}%`
                : '-'}
            </span>
          </div>

          {flag.reason && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <HelpCircle size={13} className="text-gray-400" />
                System Analysis & Flag Reason
              </span>
              <p className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200 leading-relaxed">
                {flag.reason}
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelAnomalyModal;
