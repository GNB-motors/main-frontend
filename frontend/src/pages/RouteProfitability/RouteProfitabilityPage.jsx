import React from 'react';
import { Link } from 'react-router-dom';
import {
  Unplug,
  Route,
  Truck,
  Fuel,
  TrendingUp,
  ArrowRight,
  Calculator,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Receipt,
  Clock,
  Sparkles,
} from 'lucide-react';
import './RouteProfitability.css';

const SAMPLE_CORRIDORS = [
  {
    rank: 1,
    origin: 'Kolkata, WB',
    destination: 'Jamshedpur, JH',
    distanceKm: 285,
    avgRevenue: 42500,
    avgCost: 31200,
    marginInr: 11300,
    marginPct: 26.6,
    status: 'OPTIMAL',
  },
  {
    rank: 2,
    origin: 'Durgapur, WB',
    destination: 'Ranchi, JH',
    distanceKm: 240,
    avgRevenue: 36000,
    avgCost: 27800,
    marginInr: 8200,
    marginPct: 22.8,
    status: 'HEALTHY',
  },
  {
    rank: 3,
    origin: 'Haldia Port, WB',
    destination: 'Siliguri, WB',
    distanceKm: 610,
    avgRevenue: 85000,
    avgCost: 71400,
    marginInr: 13600,
    marginPct: 16.0,
    status: 'MONITOR',
  },
  {
    rank: 4,
    origin: 'Asansol, WB',
    destination: 'Patna, BR',
    distanceKm: 375,
    avgRevenue: 48000,
    avgCost: 43200,
    marginInr: 4800,
    marginPct: 10.0,
    status: 'LOW MARGIN',
  },
];

export default function RouteProfitabilityPage() {
  return (
    <div className="pshell min-h-screen">
      {/* Header */}
      <header className="pshell-head mb-6">
        <div className="pshell-head-main">
          <div className="flex items-center gap-3">
            <h1 className="pshell-title text-2xl font-bold text-slate-900 tracking-tight">
              Route Profitability
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles size={12} className="text-amber-600" />
              Live Ledger Engine
            </span>
          </div>
          <p className="pshell-subtitle text-sm text-slate-500 mt-1">
            Real-time ₹ margin per trip — converging commercial ERP ledger billing with physical
            telematics costs.
          </p>
        </div>
      </header>

      {/* Operations KPI Rail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Coupled Corridors */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Coupled Corridors</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              <Route size={14} />
            </span>
          </div>
          <span className="ov-kpi-value">ERP + GPS</span>
          <span className="ov-kpi-sub">automated pairing active</span>
        </div>

        {/* 2. Telematics Feeds */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Telematics Tracking</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Truck size={14} />
            </span>
          </div>
          <span className="ov-kpi-value">Real-time</span>
          <span className="ov-kpi-sub">live sensor & mileage ingestion</span>
        </div>

        {/* 3. Direct Cost Tracking */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Direct Cost Tracking</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              <Fuel size={14} />
            </span>
          </div>
          <span className="ov-kpi-value">₹ / km</span>
          <span className="ov-kpi-sub">fuel, AdBlue & Fastag toll sync</span>
        </div>

        {/* 4. Target Margin */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Target Benchmark</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              <TrendingUp size={14} />
            </span>
          </div>
          <span className="ov-kpi-value">22.5%</span>
          <span className="ov-kpi-sub">recommended operating margin</span>
        </div>
      </div>

      {/* Dual-Engine Architecture Card */}
      <div className="rp-engine-card">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Automated Data Convergence Architecture
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Route Profitability unites your enterprise ledger with real-world road operations so you
          see honest, un-doctored margins per trip.
        </p>

        <div className="rp-engine-grid">
          {/* Stream 1: ERP Ledger */}
          <div className="rp-stream-box">
            <div className="rp-stream-title">
              <Building2 size={15} className="text-blue-600" />
              <span>1. Commercial Revenue (ERP)</span>
            </div>
            <p className="rp-stream-desc">
              Customer contracted freight rates, billed invoices, detention charges, and loading
              manifests.
            </p>
            <div className="rp-stream-links">
              <Link to="/erp/billing" className="rp-stream-link">
                <span>ERP Billing</span>
                <ArrowRight size={12} />
              </Link>
              <Link to="/khata-ledger" className="rp-stream-link">
                <span>Khata Ledger</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <div className="rp-operator">−</div>

          {/* Stream 2: Telematics */}
          <div className="rp-stream-box">
            <div className="rp-stream-title">
              <Fuel size={15} className="text-amber-600" />
              <span>2. Telematics & Direct Cost</span>
            </div>
            <p className="rp-stream-desc">
              GPS odometer kilometers, diesel refuels, AdBlue top-ups, Fastag toll debits, and trip
              allowances.
            </p>
            <div className="rp-stream-links">
              <Link to="/route-intelligence" className="rp-stream-link">
                <span>Corridor Intel</span>
                <ArrowRight size={12} />
              </Link>
              <Link to="/fuel-spend" className="rp-stream-link">
                <span>Fuel Spend</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <div className="rp-operator">=</div>

          {/* Result: Net Margin */}
          <div className="rp-result-box">
            <div className="rp-result-title">
              <TrendingUp size={15} className="text-emerald-700" />
              <span>3. Net Margin Per Route</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Automated ranking of top and bottom earning routes, detecting unbilled kilometers,
              diesel siphoning, and rate undercutting.
            </p>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded inline-block self-start mt-1">
              Zero Guesswork · Side-by-side Provenance
            </span>
          </div>
        </div>
      </div>

      {/* Corridor Benchmark Leaderboard */}
      <div className="oa-table-wrapper">
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Route size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Corridor Profitability Benchmark</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live preview model calculating trip margin benchmarks across active transit lanes.
            </p>
          </div>
          <Link to="/route-intelligence" className="ov-btn text-xs font-semibold">
            <span>Explore Learned Corridors</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="oa-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                <th>Corridor Route</th>
                <th style={{ textAlign: 'right' }}>Distance</th>
                <th style={{ textAlign: 'right' }}>Avg Invoiced Rev</th>
                <th style={{ textAlign: 'right' }}>Avg Running Cost</th>
                <th style={{ textAlign: 'right' }}>Estimated Margin</th>
                <th style={{ textAlign: 'right' }}>Margin %</th>
                <th style={{ textAlign: 'center' }}>Health</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_CORRIDORS.map((c) => (
                <tr key={c.rank}>
                  <td style={{ textAlign: 'center' }}>
                    <span className="num font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      #{c.rank}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{c.origin}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-slate-900">{c.destination}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="num font-mono text-slate-700">{c.distanceKm} km</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="num font-mono font-semibold text-slate-900">
                      ₹{c.avgRevenue.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="num font-mono font-semibold text-slate-600">
                      ₹{c.avgCost.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="num font-mono font-bold text-emerald-700">
                      +₹{c.marginInr.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="num font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {c.marginPct.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                        c.status === 'OPTIMAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'HEALTHY'
                            ? 'bg-blue-100 text-blue-800'
                            : c.status === 'MONITOR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
