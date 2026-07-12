import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Droplets, MapPin, Search, Info, RefreshCw } from 'lucide-react';
import { VehicleService } from '../../Profile/VehicleService';
import { useNavigate } from 'react-router-dom';

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
    } catch (error) {
      console.error("Failed to fetch live fleet status", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  const filtered = vehicles.filter(v => {
    if (!v.liveStatus) return false; // Only show vehicles with live data
    const term = searchTerm.toLowerCase();
    return (
      (v.registrationNumber || '').toLowerCase().includes(term) ||
      (v.chassisNumber || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <Card className="p-4 flex items-center justify-center h-64 text-slate-500">
        Loading live status...
      </Card>
    );
  }

  if (!vehicles.length) {
    return (
      <Card className="p-4 flex items-center justify-center h-64 text-slate-500 text-sm">
        No vehicles found.
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px] bg-slate-50/50">
      <div className="p-3 border-b border-slate-200 bg-white flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by VIN or Registration..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-[#0e8c8c] focus:ring-1 focus:ring-[#0e8c8c] transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => fetchLiveStatus(false)}
          disabled={loading || isRefreshing}
          className="px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-600 flex items-center justify-center disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={(loading || isRefreshing) ? "animate-spin text-[#0e8c8c]" : ""} />
        </button>
      </div>
      
      <div className="bg-blue-50/60 px-4 py-3 border-b border-blue-100 flex gap-2.5 items-start">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-blue-700/90 leading-relaxed">
            Showing data from the last sync. To fetch live status, use the <strong>Pull from FleetEdge now</strong> button in your browser extension, then click refresh.
          </p>
        </div>
        {isRefreshing && (
          <RefreshCw size={14} className="text-blue-500 animate-spin shrink-0 mt-0.5" />
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center p-4 text-slate-500 text-sm">No live data available for search.</div>
        )}
        
        {filtered.map(v => {
          const ls = v.liveStatus;
          const isExpanded = expandedVin === v.chassisNumber;
          
          return (
            <div 
              key={v._id} 
              className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${isExpanded ? 'border-[#0e8c8c]' : 'border-slate-200'}`}
              onClick={() => setExpandedVin(isExpanded ? null : v.chassisNumber)}
            >
              {/* Header */}
              <div className="p-4 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-[15px] flex items-center gap-2">
                    <span className="text-[#0e8c8c] flex items-center gap-1">
                      <TruckIcon />
                    </span>
                    {v.registrationNumber}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{v.chassisNumber}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-end gap-1 mb-1">
                    <Clock size={10} /> Last Update
                  </p>
                  <p className="text-xs text-slate-700 font-medium">
                    {ls.pulledAt ? new Date(ls.pulledAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true
                    }) : '—'}
                  </p>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/30 pt-4 cursor-default" onClick={e => e.stopPropagation()}>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-[#0e8c8c] mb-3">Live Vehicle Information</h5>
                  
                  <div className="grid grid-cols-3 gap-y-4 gap-x-2 mb-5">
                    <div>
                      <p className="text-[11px] text-slate-500 mb-0.5">Odometer</p>
                      <p className="text-sm font-bold text-slate-800">{ls.canOdo != null ? ls.canOdo.toLocaleString() + ' Kms' : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-0.5">Fuel Level</p>
                      <p className="text-sm font-bold text-slate-800">{ls.primaryFuelLevel != null ? ls.primaryFuelLevel + ' %' : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-0.5">DEF Level</p>
                      <p className="text-sm font-bold text-slate-800">{ls.defLevel != null ? ls.defLevel + ' %' : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-0.5">Engine Run Hrs</p>
                      <p className="text-sm font-bold text-slate-800">{ls.engineRunHour != null ? ls.engineRunHour.toLocaleString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-0.5">Next Service</p>
                      <p className="text-sm font-bold text-slate-800">{ls.nextServiceDate ? new Date(ls.nextServiceDate).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-4">
                    <ProgressBar 
                      label="Primary Fuel Level" 
                      value={ls.primaryFuelLevel} 
                      color="bg-indigo-500" 
                      icon={<Activity size={14} className="text-indigo-600" />} 
                    />
                    <ProgressBar 
                      label="DEF Level" 
                      value={ls.defLevel} 
                      color="bg-green-500" 
                      icon={<Droplets size={14} className="text-green-600" />} 
                    />
                  </div>
                  
                  <div className="mt-5 flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/mileage-tracking/vehicle/${v._id}`);
                      }}
                      className="flex-1 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      View Mileage Logs
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ProgressBar({ label, value, color, icon }) {
  const safeVal = value != null ? Math.min(100, Math.max(0, value)) : 0;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[13px] font-medium text-slate-700">{label}</span>
        </div>
        <span className="text-[13px] font-bold text-[#0e8c8c]">{value != null ? value + '%' : '—'}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 rounded-full`}
          style={{ width: `${safeVal}%` }}
        />
      </div>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M2 13h20"></path>
      <circle cx="7" cy="20" r="2"></circle>
      <circle cx="17" cy="20" r="2"></circle>
      <path d="M12 17v-4"></path>
    </svg>
  );
}
