import React, { useState } from 'react';
import {
  Settings,
  Radio,
  Sliders,
  Fuel,
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('telematics'); // 'telematics' | 'thresholds' | 'fuel' | 'org'

  // Threshold States
  const [idleThreshold, setIdleThreshold] = useState(5);
  const [speedLimit, setSpeedLimit] = useState(70);
  const [fuelTolerance, setFuelTolerance] = useState(8);
  const [defaultFuelPrice, setDefaultFuelPrice] = useState(94.5);
  const [adbluePrice, setAdbluePrice] = useState(56.5);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncVehicles = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Successfully synchronized 42 vehicles from FleetEdge telematics feed!');
    }, 1200);
  };

  const handleSaveSettings = () => {
    toast.success('Settings updated successfully!');
  };

  return (
    <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System & Fleet Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure telematics device syncing, operational thresholds, fuel price benchmarks, and
            organization preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs self-start md:self-auto cursor-pointer"
        >
          Save Configuration
        </button>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto">
        {[
          { key: 'telematics', label: 'Telematics & Device Sync', icon: Radio },
          { key: 'thresholds', label: 'Operational Thresholds', icon: Sliders },
          { key: 'fuel', label: 'Fuel & Pricing Defaults', icon: Fuel },
          { key: 'org', label: 'Notifications & Dispatch', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Telematics & Device Sync (Replaces confusing Fleet Coverage) ─ */}
      {activeTab === 'telematics' && (
        <div className="flex flex-col gap-6 max-w-4xl">
          {/* Top Explainer */}
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl p-4 flex items-start gap-3">
            <Radio className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                Simplified Telematics Vehicle Onboarding
              </h3>
              <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-0.5 leading-relaxed">
                Replaces the complex fleet coverage matrix. The platform automatically polls Tata
                FleetEdge, Wheelseye, and AIS-140 GPS streams. New vehicles detected on CAN feeds
                appear here with one-click fleet activation.
              </p>
            </div>
          </div>

          {/* Sync Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Tata FleetEdge Connected Feed
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                42 vehicles reporting live CAN bus fuel levels, odometers, and engine RPM.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSyncVehicles}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync New Vehicles'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings/fleetedge-accounts')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Manage Accounts</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Fully Tracked</span>
                <span className="font-mono text-xl font-bold text-emerald-600">42 Trucks</span>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Awaiting Activation</span>
                <span className="font-mono text-xl font-bold text-amber-600">0 Trucks</span>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500 opacity-60" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">GPS Deadband</span>
                <span className="font-mono text-xl font-bold text-slate-500">2 Inactive</span>
              </div>
              <Radio className="w-8 h-8 text-slate-400 opacity-60" />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Operational Thresholds ───────────────────────────── */}
      {activeTab === 'thresholds' && (
        <div className="flex flex-col gap-5 max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Default Idling Alarm Threshold (Minutes)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Vehicles stationary with engine running beyond this duration trigger live dispatcher
              alerts.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="idle-threshold"
                aria-label="Default Idling Alarm Threshold (Minutes)"
                min="1"
                max="60"
                value={idleThreshold}
                onChange={(e) => setIdleThreshold(Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
              <span className="text-xs font-mono text-slate-500">minutes (Default: 5 mins)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Highway Speed Ceiling (km/h)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Maximum allowed speed before overspeed distance accumulation begins.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="speed-limit"
                aria-label="Highway Speed Ceiling (km/h)"
                min="40"
                max="100"
                value={speedLimit}
                onChange={(e) => setSpeedLimit(Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
              <span className="text-xs font-mono text-slate-500">km/h</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Fuel Reconciliation Variance Margin (%)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Tolerance threshold between pump slip liters and telematics probe jumps before
              flagging as overbilled.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="fuel-tolerance"
                aria-label="Fuel Reconciliation Variance Margin (%)"
                min="2"
                max="20"
                value={fuelTolerance}
                onChange={(e) => setFuelTolerance(Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
              <span className="text-xs font-mono text-slate-500">% tolerance (Default: 8%)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Fuel & Pricing Defaults ──────────────────────────── */}
      {activeTab === 'fuel' && (
        <div className="flex flex-col gap-5 max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Default Diesel Benchmark Price (₹/L)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Fallback unit price used when a driver&apos;s fuel slip has no printed rate or total
              amount.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="default-fuel-price"
                aria-label="Default Diesel Benchmark Price (₹/L)"
                step="0.1"
                value={defaultFuelPrice}
                onChange={(e) => setDefaultFuelPrice(Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
              <span className="text-xs font-mono text-slate-500">₹ per Litre</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              AdBlue / DEF Benchmark Price (₹/L)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Used in the DEF Ledger to calculate estimated expenditure on exhaust fluid.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="adblue-price"
                aria-label="AdBlue / DEF Benchmark Price (₹/L)"
                step="0.5"
                value={adbluePrice}
                onChange={(e) => setAdbluePrice(Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
              <span className="text-xs font-mono text-slate-500">₹ per Litre (MRP)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Organization Preferences ─────────────────────────── */}
      {activeTab === 'org' && (
        <div className="flex flex-col gap-5 max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Timezone & Format
            </label>
            <p className="text-xs text-slate-500 mb-2">
              All timestamps strictly anchored to Indian Standard Time.
            </p>
            <input
              type="text"
              id="timezone"
              aria-label="Timezone & Format"
              disabled
              value="Asia/Kolkata (IST +05:30)"
              className="w-64 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              WhatsApp Alert Integration
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Send critical notifications (theft spikes, unrefueled active trips, overspeed)
              directly to fleet manager numbers.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                id="wa-alerts"
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="wa-alerts"
                className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Enable Instant WhatsApp Operational Dispatches
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
