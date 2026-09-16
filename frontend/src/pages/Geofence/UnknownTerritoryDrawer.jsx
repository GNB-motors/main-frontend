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
} from 'lucide-react';
import KaaranService from '../../services/KaaranService';
import { toast } from 'react-toastify';

const CLASSIFICATIONS = [
  { key: 'CUSTOMER_SITE', label: 'Customer / Factory Site', zoneType: 'CUSTOM' },
  { key: 'APPROVED_DHABA', label: 'Approved Dhaba / Rest Stop', zoneType: 'PARKING' },
  { key: 'TRANSIT_HALT', label: 'Regular Transit Halt', zoneType: 'CUSTOM' },
  { key: 'UNAUTHORIZED_STOP', label: 'Unauthorized / Risk Dwell', zoneType: 'ACCIDENT_PRONE' },
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
        `Unmapped Site (${c.center?.lat?.toFixed(3)}, ${c.center?.lng?.toFixed(3)})`,
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
      // Remove from list
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Unknown Territory Learning Loop
              </h2>
              <p className="text-xs text-slate-500">
                Unmapped stops &gt; 20m requiring manager classification
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunScan}
              disabled={scanning}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1 text-slate-700 dark:text-slate-200"
            >
              <Sparkles size={13} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Scanning...' : 'Scan GPS'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Cluster List */}
          <div className="w-full md:w-1/2 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Detected Clusters ({clusters.length})</span>
              <button onClick={fetchClusters} disabled={loading} className="hover:text-slate-700">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading clusters...</div>
            ) : clusters.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 px-4">
                No unmapped dwell clusters detected. All frequent vehicle halts are currently inside
                known geofences!
              </div>
            ) : (
              clusters.map((c) => {
                const isSelected = selectedCluster?._id === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => selectCluster(c)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {c.center?.lat?.toFixed(4)}, {c.center?.lng?.toFixed(4)}
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                        {c.totalDwells || 1} dwells
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {c.totalDurationMin || 0} min total
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck size={12} /> {c.vehicleCount || (c.dwells?.length ?? 1)} trucks
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Classification Detail & Action */}
          <div className="w-full md:w-1/2 p-5 overflow-y-auto flex flex-col justify-between">
            {selectedCluster ? (
              <form onSubmit={handlePromote} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Site / Facility Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jindal Steel Plant Gate 3"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classification
                  </label>
                  <select
                    value={formClassification}
                    onChange={(e) => setFormClassification(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CLASSIFICATIONS.map((cl) => (
                      <option key={cl.key} value={cl.key}>
                        {cl.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Geofence Radius (meters)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="2000"
                    step="50"
                    value={formRadius}
                    onChange={(e) => setFormRadius(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Auto-Promotion Impact:
                  </div>
                  <div>• Creates a verified Geofence Zone instantly.</div>
                  <div>• Evicts reverse-geocoder spatial cache so reports use this label.</div>
                  <div>• Eliminates future false-positive unauthorized dwell alerts here.</div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {saving ? 'Promoting...' : 'Promote to Known Geofence Zone'}
                </button>
              </form>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Select a cluster to classify
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
