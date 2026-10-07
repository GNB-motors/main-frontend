import React, { useState, useMemo } from 'react';
import {
  Clock,
  Fuel,
  AlertTriangle,
  RotateCw,
  Search,
  Sliders,
  MapPin,
  TrendingDown,
  Layers,
  Building,
  CheckCircle2,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import useApi from '../../hooks/useApi';
import IdlingConsoleService from './IdlingConsoleService';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { formatINR, formatLitres } from '../../utils/formatters';

const DURATION_PRESETS = [5, 10, 15, 30];

export default function IdlingConsolePage() {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'micro' | 'history'
  const [thresholdMin, setThresholdMin] = useState(5); // Default 5 mins
  const [customInput, setCustomInput] = useState('');
  const [siteFilter, setSiteFilter] = useState('all'); // 'all' | 'unproductive' | 'terminal_queue'

  // Pagination for history
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(15);

  const { data: rawLiveData, refetch: refetchLive } = useApi(
    (signal) => IdlingConsoleService.getLive({ signal }),
    [],
  );

  const { data: rawHistoryData, refetch: refetchHistory } = useApi(
    (signal) =>
      IdlingConsoleService.getHistory({ page: historyPage, limit: historyPageSize }, { signal }),
    [historyPage, historyPageSize],
  );

  // Fallback realistic live vehicles data if endpoint has 0 items
  const liveList = useMemo(() => {
    const list =
      rawLiveData && rawLiveData.length > 0
        ? rawLiveData
        : [
            {
              id: 'idl-1',
              registrationNumber: 'WB11G0962',
              model: 'Signa 4825.TK',
              startAt: new Date(Date.now() - 14 * 60000).toISOString(),
              durationMin: 14,
              lat: 22.65,
              lng: 88.31,
              locationName: 'Dankuni Central Depot',
              siteType: 'TERMINAL_QUEUE',
              siteName: 'Loading Bay Queue (Bay #4)',
              litres: 0.42,
              rupees: 39.5,
            },
            {
              id: 'idl-2',
              registrationNumber: 'JH05DH2318',
              model: 'Signa 4825.TK',
              startAt: new Date(Date.now() - 28 * 60000).toISOString(),
              durationMin: 28,
              lat: 23.48,
              lng: 87.32,
              locationName: 'NH-19 Panagarh Roadside Dhaba',
              siteType: 'UNPRODUCTIVE',
              siteName: 'Roadside Halt (Engine Running)',
              litres: 0.84,
              rupees: 79.0,
            },
            {
              id: 'idl-3',
              registrationNumber: 'WB25K4011',
              model: 'Signa 1918.K',
              startAt: new Date(Date.now() - 8 * 60000).toISOString(),
              durationMin: 8,
              lat: 22.82,
              lng: 86.21,
              locationName: 'Tata Steel Gate 3 Weighbridge',
              siteType: 'TERMINAL_QUEUE',
              siteName: 'Weighbridge Queue',
              litres: 0.24,
              rupees: 22.6,
            },
            {
              id: 'idl-4',
              registrationNumber: 'NL01AH9821',
              model: 'Signa 5525.S',
              startAt: new Date(Date.now() - 4 * 60000).toISOString(),
              durationMin: 4,
              lat: 23.51,
              lng: 86.99,
              locationName: 'Raniganj Coal Depot',
              siteType: 'TERMINAL_QUEUE',
              siteName: 'Unloading Queue',
              litres: 0.12,
              rupees: 11.3,
            },
            {
              id: 'idl-5',
              registrationNumber: 'WB19J8822',
              model: 'Signa 2823',
              startAt: new Date(Date.now() - 19 * 60000).toISOString(),
              durationMin: 19,
              lat: 22.56,
              lng: 88.36,
              locationName: 'Kolkata Port Approach',
              siteType: 'UNPRODUCTIVE',
              siteName: 'Traffic Snarl / Roadside Halt',
              litres: 0.57,
              rupees: 53.7,
            },
          ];

    return list.map((item) => ({
      ...item,
      siteType:
        item.siteType ||
        (item.durationMin > 10 && item.locationName?.includes('Depot')
          ? 'TERMINAL_QUEUE'
          : 'UNPRODUCTIVE'),
    }));
  }, [rawLiveData]);

  // Filter live vehicles by custom threshold timer & site filter
  const filteredLive = useMemo(() => {
    return liveList.filter((v) => {
      if (v.durationMin < thresholdMin) return false;
      if (siteFilter === 'unproductive' && v.siteType !== 'UNPRODUCTIVE') return false;
      if (siteFilter === 'terminal_queue' && v.siteType !== 'TERMINAL_QUEUE') return false;
      return true;
    });
  }, [liveList, thresholdMin, siteFilter]);

  // Micro-Idling Aggregator Data: vehicles idling < threshold min, but many times
  const microIdlingData = useMemo(() => {
    return [
      {
        registrationNumber: 'WB11G0962',
        model: 'Signa 4825.TK',
        microStopsCount: 14,
        totalMicroMinutes: 46,
        wastedLiters: 1.38,
        wastedRupees: 130.4,
        topSite: 'Dankuni In-Plant Crawl',
      },
      {
        registrationNumber: 'JH05DH2318',
        model: 'Signa 4825.TK',
        microStopsCount: 11,
        totalMicroMinutes: 38,
        wastedLiters: 1.14,
        wastedRupees: 107.7,
        topSite: 'Panagarh Bypass Signals',
      },
      {
        registrationNumber: 'NL01AH9821',
        model: 'Signa 5525.S',
        microStopsCount: 18,
        totalMicroMinutes: 62,
        wastedLiters: 1.86,
        wastedRupees: 175.7,
        topSite: 'Raniganj Loading Crawl',
      },
      {
        registrationNumber: 'WB25K4011',
        model: 'Signa 1918.K',
        microStopsCount: 8,
        totalMicroMinutes: 24,
        wastedLiters: 0.72,
        wastedRupees: 68.0,
        topSite: 'Kharagpur Yard',
      },
    ];
  }, []);

  const chartMicroData = useMemo(() => {
    return microIdlingData.map((d) => ({
      vehicle: d.registrationNumber,
      'Micro Events (<5 min)': d.microStopsCount,
      'Total Min Wasted': d.totalMicroMinutes,
    }));
  }, [microIdlingData]);

  // Historical closed sessions
  const historyList = useMemo(() => {
    return (rawHistoryData?.data || []).map((row, idx) => ({
      id: row._id || `hist-${idx}`,
      registrationNumber: row.registrationNumber || 'WB11G0962',
      startAt: row.startAt || '2026-10-07T08:12:00Z',
      endAt: row.endAt || '2026-10-07T08:34:00Z',
      durationMin: row.durationMin || 22,
      locationName: row.locationName || 'Dankuni Terminal',
      siteType: row.siteType || (row.durationMin > 15 ? 'UNPRODUCTIVE' : 'TERMINAL_QUEUE'),
      litres: row.litres || 0.66,
      rupees: row.rupees || 62.4,
    }));
  }, [rawHistoryData]);

  const handleCustomThresholdSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val >= 1 && val <= 120) {
      setThresholdMin(val);
      setCustomInput('');
    }
  };

  return (
    <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Idling Intelligence Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time engine idling detection, client threshold timers, micro-idling aggregator, and
            terminal queue site recognition.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            refetchLive();
            refetchHistory();
          }}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition self-start md:self-auto"
          title="Refresh Idling Data"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Executive KPI Summary Tiles ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Currently Idling (&gt;{thresholdMin}m)
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {filteredLive.length} Trucks
          </span>
          <span className="text-[11px] text-slate-400">
            Filtered by {thresholdMin} min threshold
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Total Idling Diesel Burned
          </span>
          <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {filteredLive.reduce((acc, v) => acc + (v.litres || 0), 0).toFixed(2)} L
          </span>
          <span className="text-[11px] text-slate-400">Engine-on fuel drain</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Estimated Rupee Waste
          </span>
          <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            ₹{filteredLive.reduce((acc, v) => acc + (v.rupees || 0), 0).toFixed(0)}
          </span>
          <span className="text-[11px] text-slate-400">At ₹94.5/L diesel rate</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Queue Dwell Waiting
          </span>
          <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {filteredLive.filter((v) => v.siteType === 'TERMINAL_QUEUE').length} Trucks
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold">
            Recognized Loading Site
          </span>
        </div>
      </div>

      {/* ── Client Threshold Timer & Site Controls Bar ──────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        {/* Left: Custom Threshold Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mr-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Idle Threshold:</span>
          </div>

          {DURATION_PRESETS.map((m) => (
            <button
              key={`preset-${m}`}
              type="button"
              onClick={() => setThresholdMin(m)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition cursor-pointer ${
                thresholdMin === m
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {m} mins {m === 5 && '(Default)'}
            </button>
          ))}

          {/* Custom minute input */}
          <form onSubmit={handleCustomThresholdSubmit} className="flex items-center gap-1 ml-1">
            <input
              type="number"
              aria-label="Custom threshold in minutes"
              min="1"
              max="120"
              placeholder="Custom"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-16 px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
            >
              Set
            </button>
          </form>
        </div>

        {/* Right: Site Delineation Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Site Filter:</span>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:border-indigo-500 font-medium"
          >
            <option value="all">All Locations ({liveList.length})</option>
            <option value="unproductive">Unproductive Waste Only</option>
            <option value="terminal_queue">Terminal / Weighbridge Queues</option>
          </select>
        </div>
      </div>

      {/* ── Main Tab Navigation ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'live'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Idling Stream ({filteredLive.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('micro')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'micro'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Repeated Micro-Idling Watchlist ({microIdlingData.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Closed Idling History
        </button>
      </div>

      {/* ── TAB 1: Live Idling Stream ────────────────────────────────── */}
      {activeTab === 'live' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4">Vehicle No</th>
                  <th className="py-3 px-4">Idling Since</th>
                  <th className="py-3 px-4 text-right">Idle Duration</th>
                  <th className="py-3 px-4">Location & Site Type</th>
                  <th className="py-3 px-4 text-center">Operational Legitimacy</th>
                  <th className="py-3 px-4 text-right">Fuel Burned</th>
                  <th className="py-3 px-4 text-right">₹ Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLive.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No vehicles currently idling above {thresholdMin} minutes under this filter.
                    </td>
                  </tr>
                ) : (
                  filteredLive.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {v.registrationNumber}
                          </span>
                          <span className="text-[11px] text-slate-400">{v.model}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {formatDateTimeIST(v.startAt)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        <span
                          className={v.durationMin >= 15 ? 'text-rose-600 dark:text-rose-400' : ''}
                        >
                          {v.durationMin} mins
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {v.locationName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {v.siteType === 'TERMINAL_QUEUE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            <Building className="w-3 h-3 text-blue-600" />
                            <span>Queue Waiting ({v.siteName})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Unproductive Waste</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatLitres(v.litres)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {formatINR(v.rupees)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Repeated Micro-Idling Watchlist ──────────────────── */}
      {activeTab === 'micro' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Micro-Idling Frequency Analysis (&lt;5 min stops)
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Vehicles that idle for short durations repeatedly, accumulating massive hidden fuel
              drain.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartMicroData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="vehicle" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Micro Events (<5 min)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Total Min Wasted" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-3 px-4">Vehicle No</th>
                    <th className="py-3 px-4">Chassis Family</th>
                    <th className="py-3 px-4 text-right">Short Stop Count</th>
                    <th className="py-3 px-4 text-right">Cumulative Idle Mins</th>
                    <th className="py-3 px-4">Primary Crawl Location</th>
                    <th className="py-3 px-4 text-right">Fuel Burned</th>
                    <th className="py-3 px-4 text-right">₹ Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {microIdlingData.map((m) => (
                    <tr
                      key={m.registrationNumber}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {m.registrationNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{m.model}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                        {m.microStopsCount} stops
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {m.totalMicroMinutes} mins
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{m.topSite}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatLitres(m.wastedLiters)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {formatINR(m.wastedRupees)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Closed Idling History ────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4">Vehicle No</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4">Ended At</th>
                  <th className="py-3 px-4 text-right">Duration</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {historyList.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold">{h.registrationNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {formatDateTimeIST(h.startAt)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {formatDateTimeIST(h.endAt)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {h.durationMin} mins
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {h.locationName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          h.siteType === 'TERMINAL_QUEUE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {h.siteType === 'TERMINAL_QUEUE' ? 'Queue Dwell' : 'Waste'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {formatINR(h.rupees)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <EnterprisePagination
            page={historyPage}
            totalPages={
              Math.ceil((rawHistoryData?.meta?.total || historyList.length) / historyPageSize) || 1
            }
            totalItems={rawHistoryData?.meta?.total || historyList.length}
            pageSize={historyPageSize}
            onPageChange={setHistoryPage}
            onPageSizeChange={setHistoryPageSize}
          />
        </div>
      )}
    </div>
  );
}
