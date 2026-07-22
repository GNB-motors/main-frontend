import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  Clock,
  Droplets,
  Search,
  Info,
  RefreshCw,
  ChevronDown,
  Gauge,
  Wrench,
  Zap,
} from 'lucide-react';
import { VehicleService } from '../../Profile/VehicleService';
import { useNavigate } from 'react-router-dom';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (v, suffix = '') =>
  v != null ? `${Number(v).toLocaleString('en-IN')}${suffix}` : '—';

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '—';

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, value, color, icon }) {
  const safe = value != null ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[12px] font-medium text-slate-600">{label}</span>
        </div>
        <span className="text-[12px] font-bold" style={{ color: '#0e8c8c' }}>
          {value != null ? value + '%' : '—'}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

// ─── Metric cell ──────────────────────────────────────────────────────────────
function Metric({ label, value, icon, wide }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <div className="mb-0.5 flex items-center gap-1">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>
      <p className="text-[13px] font-bold leading-tight text-slate-800">{value}</p>
    </div>
  );
}

// ─── VehicleCard ─────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, isExpanded, onToggle, navigate }) {
  const ls = vehicle.liveStatus;

  return (
    <div
      className="overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow duration-200"
      style={{
        borderColor: isExpanded ? '#0e8c8c' : '#e2e8f0',
        boxShadow: isExpanded
          ? '0 4px 16px rgba(14,140,140,0.10)'
          : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Collapsed header — always visible ── */}
      <button
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {/* Icon badge */}
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
          style={{
            background: isExpanded
              ? 'color-mix(in srgb, #0e8c8c 14%, transparent)'
              : '#f1f5f9',
            color: isExpanded ? '#0e8c8c' : '#64748b',
          }}
        >
          <TruckIcon />
        </span>

        {/* Registration + chassis */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-bold leading-tight text-slate-900">
            {vehicle.registrationNumber || '—'}
          </p>
          <p className="truncate font-mono text-[10.5px] text-slate-400 mt-0.5">
            {vehicle.chassisNumber || '—'}
          </p>
        </div>

        {/* Time + chevron */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Synced
            </p>
            <p className="text-[11px] font-medium text-slate-600">
              {ls?.pulledAt
                ? new Date(ls.pulledAt).toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : '—'}
            </p>
          </div>
          <ChevronDown
            size={15}
            className="text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* ── Expanded details — smooth CSS grid height animation ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 320ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-100 bg-slate-50/40 px-4 pb-4 pt-4">
            {/* Section label */}
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0e8c8c' }}>
              Live Vehicle Data
            </p>

            {/* Metrics grid */}
            <div className="mb-4 grid grid-cols-3 gap-x-3 gap-y-3">
              <Metric
                label="Odometer"
                value={fmt(ls?.canOdo, ' km')}
                icon={<Gauge size={11} className="text-slate-400" />}
              />
              <Metric
                label="Fuel %"
                value={fmt(ls?.primaryFuelLevel, '%')}
                icon={<Droplets size={11} className="text-slate-400" />}
              />
              <Metric
                label="DEF %"
                value={fmt(ls?.defLevel, '%')}
                icon={<Zap size={11} className="text-slate-400" />}
              />
              <Metric
                label="Engine Hrs"
                value={fmt(ls?.engineRunHour)}
                icon={<Activity size={11} className="text-slate-400" />}
              />
              <Metric
                label="Next Service"
                value={fmtDate(ls?.nextServiceDate)}
                icon={<Wrench size={11} className="text-slate-400" />}
                wide
              />
            </div>

            {/* Progress bars */}
            <div className="space-y-3">
              <ProgressBar
                label="Primary Fuel"
                value={ls?.primaryFuelLevel}
                color="bg-indigo-500"
                icon={<Droplets size={12} className="text-indigo-500" />}
              />
              <ProgressBar
                label="DEF Level"
                value={ls?.defLevel}
                color="bg-emerald-500"
                icon={<Zap size={12} className="text-emerald-500" />}
              />
            </div>

            {/* Last sync timestamp */}
            <p className="mt-3 flex items-center gap-1 text-[10.5px] text-slate-400">
              <Clock size={10} />
              Last synced {fmtDateTime(ls?.pulledAt)}
            </p>

            {/* CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/mileage-tracking/vehicle/${vehicle._id}`);
              }}
              className="mt-3.5 w-full rounded-lg border border-slate-200 bg-white py-2 text-[12px] font-semibold text-slate-600 shadow-sm transition-all duration-150 hover:border-[#0e8c8c] hover:text-[#0e8c8c] active:scale-[0.98]"
            >
              View Mileage Logs →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Main widget ──────────────────────────────────────────────────────────────
export default function LiveFleetStatusWidget() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedVin, setExpandedVin] = useState(null);
  const navigate = useNavigate();

  const fetchLiveStatus = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await VehicleService.getFleetDashboard();
      setVehicles(data || []);
    } catch (err) {
      console.error('Failed to fetch live fleet status', err);

    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  const filtered = vehicles.filter((v) => {
    if (!v.liveStatus) return false;
    const term = searchTerm.toLowerCase();
    return (
      (v.registrationNumber || '').toLowerCase().includes(term) ||
      (v.chassisNumber || '').toLowerCase().includes(term)
    );
  });

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
          <Skeleton className="h-5 w-36 rounded-md bg-slate-200" />
          <Skeleton className="h-8 w-8 rounded-lg bg-slate-200" />
        </div>
        <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded bg-slate-200" />
                  <Skeleton className="h-3 w-24 rounded bg-slate-200" />
                </div>
                <Skeleton className="h-8 w-14 shrink-0 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty ──
  if (!vehicles.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <TruckIcon />
        </span>
        <p className="text-sm font-medium text-slate-500">No vehicles found</p>
        <p className="text-xs text-slate-400">Vehicles with live data will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <TruckIcon />
          </span>
          <span className="text-[13.5px] font-semibold text-slate-800">Live Fleet Data</span>
          {filtered.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-500">
              {filtered.length}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchLiveStatus(true)}
          disabled={isRefreshing}
          title="Refresh data"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#0e8c8c]' : ''} />
        </button>
      </div>

      {/* ── Search ── */}
      <div className="border-b border-slate-100 px-3 py-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search registration or VIN…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[12.5px] text-slate-700 outline-none placeholder:text-slate-400 transition-all focus:border-[#0e8c8c] focus:bg-white focus:ring-1 focus:ring-[#0e8c8c]/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-2 border-b border-blue-100 bg-blue-50/50 px-4 py-2.5">
        <Info size={13} className="mt-0.5 shrink-0 text-blue-400" />
        <p className="text-[11px] leading-relaxed text-blue-700/80">
          Data from the last sync. Use{' '}
          <strong className="font-semibold">Pull from FleetEdge</strong> in the browser extension,
          then click refresh.
        </p>
        {isRefreshing && (
          <RefreshCw size={12} className="mt-0.5 shrink-0 animate-spin text-blue-400" />
        )}
      </div>

      {/* ── Card list ── */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search size={17} />
            </span>
            <p className="text-[13px] font-medium text-slate-500">No results</p>
            <p className="text-[11px] text-slate-400">Try a different registration or VIN</p>
          </div>
        ) : (
          filtered.map((v) => (
            <VehicleCard
              key={v._id}
              vehicle={v}
              isExpanded={expandedVin === v.chassisNumber}
              onToggle={() =>
                setExpandedVin(expandedVin === v.chassisNumber ? null : v.chassisNumber)
              }
              navigate={navigate}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Truck SVG ────────────────────────────────────────────────────────────────
function TruckIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
      <rect x="9" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
    </svg>
  );
}
