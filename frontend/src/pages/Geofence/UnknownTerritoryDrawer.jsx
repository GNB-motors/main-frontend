import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building2,
  Coffee,
  Navigation,
} from 'lucide-react';
import KaaranService from '../../services/KaaranService';
import { toast } from 'react-toastify';

const CLASSIFICATIONS = [
  {
    key: 'CUSTOMER_SITE',
    label: 'Customer / Factory Site',
    zoneType: 'CUSTOM',
    icon: Building2,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    key: 'APPROVED_DHABA',
    label: 'Approved Dhaba / Rest Stop',
    zoneType: 'PARKING',
    icon: Coffee,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    key: 'TRANSIT_HALT',
    label: 'Regular Transit Halt',
    zoneType: 'CUSTOM',
    icon: Navigation,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  {
    key: 'UNAUTHORIZED_STOP',
    label: 'Unauthorized / Risk Dwell',
    zoneType: 'ACCIDENT_PRONE',
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
];

export default function UnknownTerritoryDrawer({ isOpen, onClose, onZonePromoted }) {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [formName, setFormName] = useState('');
  const [formClassification, setFormClassification] = useState('CUSTOMER_SITE');
  const [formRadius, setFormRadius] = useState(250);
  const [saving, setSaving] = useState(false);

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const data = await KaaranService.getUnknownTerritories({ status: 'PENDING' });
      setClusters(data || []);
      if (data && data.length > 0 && !selectedCluster) {
        selectCluster(data[0]);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load unknown clusters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClusters();
    }
  }, [isOpen]);

  const selectCluster = (c) => {
    setSelectedCluster(c);
    setFormName(
      c.proposedName ||
        c.placeName ||
        `Unmapped Site (${(c.center?.lat || c.location?.lat)?.toFixed(3)}, ${(c.center?.lng || c.location?.lng)?.toFixed(3)})`,
    );
    setFormRadius(c.radiusMeters || 250);
    setFormClassification('CUSTOMER_SITE');
  };

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await KaaranService.detectUnknownTerritories(72);
      toast.success(res.message || 'Territory scan completed');
      await fetchClusters();
    } catch (err) {
      toast.error(err.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!selectedCluster) return;
    if (!formName.trim()) {
      toast.warn('Please enter a site name');
      return;
    }

    const sel = CLASSIFICATIONS.find((c) => c.key === formClassification) || CLASSIFICATIONS[0];
    setSaving(true);
    try {
      await KaaranService.classifyTerritory(selectedCluster._id, {
        classification: formClassification,
        name: formName.trim(),
        zoneType: sel.zoneType,
        radiusMeters: Number(formRadius) || 250,
      });

      toast.success(`Promoted "${formName}" to recognized geofence zone!`);
      const remaining = clusters.filter((c) => c._id !== selectedCluster._id);
      setClusters(remaining);
      setSelectedCluster(remaining[0] || null);
      if (onZonePromoted) onZonePromoted();
    } catch (err) {
      toast.error(err.message || 'Failed to promote zone');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-[1201] animate-in slide-in-from-right duration-250 border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex-shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-900">
              <Compass size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  Unmapped Halts &amp; Territory Learning
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  AI Auto-Dwell
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Frequent vehicle stops (&gt; 20 min) outside recognized geofences — verify and
                promote
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRunScan}
              disabled={scanning}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 flex items-center gap-1.5 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 transition shadow-sm disabled:opacity-50"
            >
              <Sparkles
                size={14}
                className={scanning ? 'animate-spin text-indigo-600' : 'text-indigo-600'}
              />
              {scanning ? 'Scanning...' : 'Scan Trips'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Cluster List (Left Column) */}
          <div className="w-full md:w-1/2 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-indigo-500" />
                Unmapped Dwell Locations ({clusters.length})
              </span>
              <button
                onClick={fetchClusters}
                disabled={loading}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 transition"
                title="Refresh unmapped halts"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw size={24} className="animate-spin text-indigo-500 mx-auto" />
                <div>Scanning telemetry for unmapped stops...</div>
              </div>
            ) : clusters.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <ShieldCheck size={24} />
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  All Corridors Fully Recognized
                </div>
                <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">
                  No unmapped halt locations detected. All frequent vehicle halts are currently
                  inside recognized geofences!
                </p>
                <button
                  type="button"
                  onClick={handleRunScan}
                  disabled={scanning}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-slate-200 shadow-sm text-indigo-600 hover:bg-slate-50 transition"
                >
                  <Sparkles size={12} />
                  Run Territory Scan Now
                </button>
              </div>
            ) : (
              clusters.map((c) => {
                const isSelected = selectedCluster?._id === c._id;
                const lat = c.center?.lat || c.location?.lat || 0;
                const lng = c.center?.lng || c.location?.lng || 0;
                const name =
                  c.proposedName || c.placeName || `Site (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
                const halts = c.totalDwells || c.stopCount || 1;
                const duration = c.totalDurationMin || c.dwellMinutes || 0;
                const regNo = c.registrationNumber || c.dwells?.[0]?.registrationNumber;

                return (
                  <div
                    key={c._id}
                    onClick={() => selectCluster(c)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-slate-700 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {name}
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold whitespace-nowrap">
                        {halts} halt{halts !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400 font-mono">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
                        <Clock size={12} className="text-amber-500" /> {duration} min dwell
                      </span>
                      {regNo && (
                        <span className="flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          <Truck size={11} /> {regNo}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Classification Detail & Action (Right Column) */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between bg-white dark:bg-slate-900">
            {selectedCluster ? (
              <form onSubmit={handlePromote} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Selected Unmapped Site
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      GPS Validated
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {((selectedCluster.center?.lat || selectedCluster.location?.lat) ?? 0).toFixed(
                      5,
                    )}
                    ,{' '}
                    {((selectedCluster.center?.lng || selectedCluster.location?.lng) ?? 0).toFixed(
                      5,
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      Total dwell:{' '}
                      <strong>
                        {selectedCluster.totalDurationMin || selectedCluster.dwellMinutes || 0} min
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Halts recorded:{' '}
                      <strong>
                        {selectedCluster.totalDwells || selectedCluster.stopCount || 1}
                      </strong>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Recognized Site / Facility Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jindal Steel Loading Bay / Baba Ka Dhaba"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Classification &amp; Zone Type
                  </label>
                  <div className="space-y-2">
                    {CLASSIFICATIONS.map((cl) => {
                      const Icon = cl.icon;
                      const isChosen = formClassification === cl.key;
                      return (
                        <div
                          key={cl.key}
                          onClick={() => setFormClassification(cl.key)}
                          className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                            isChosen
                              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-md ${cl.color}`}>
                              <Icon size={14} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {cl.label}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Generates {cl.zoneType} geofence zone
                              </div>
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="classification"
                            checked={isChosen}
                            onChange={() => setFormClassification(cl.key)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Geofence Radius
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {formRadius} metres
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={formRadius}
                    onChange={(e) => setFormRadius(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>100m (Tight yard)</span>
                    <span>500m (Standard hub)</span>
                    <span>1500m (Industrial zone)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1 border border-slate-200/70 dark:border-slate-700/70">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Why Promote to Geofence Zone?
                  </div>
                  <div>• Adds this location immediately to active geofences on the map.</div>
                  <div>• Resolves future dwell events to this place name automatically.</div>
                  <div>• Suppresses false unauthorized stoppage alerts for regular halts.</div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={17} />
                  {saving ? 'Promoting Zone...' : 'Promote to Recognized Geofence Zone'}
                </button>
              </form>
            ) : (
              <div className="h-full py-16 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Compass size={32} className="text-slate-300 dark:text-slate-600" />
                <div className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                  Select an Unmapped Halt
                </div>
                <p className="text-xs text-slate-400 max-w-xs">
                  Choose a dwell cluster from the list on the left to classify it into a Customer
                  Site, Approved Rest Stop, or Risk Zone.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
