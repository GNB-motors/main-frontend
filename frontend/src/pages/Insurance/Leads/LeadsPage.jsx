import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search, Plus, Upload, Trash2, Eye, Users, CalendarClock, Briefcase,
  ChevronLeft, ChevronRight, ArrowUpDown,
} from 'lucide-react';
import { InsuranceService } from '../InsuranceService';
import { LEAD_STATUSES, LEAD_PRIORITIES } from '../insuranceConstants';
import { StatusBadge, PriorityDropdown } from '../components/badges';
import KpiCard from '../components/KpiCard';
import AddLeadModal from './AddLeadModal';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isPastDue(d) {
  return d && new Date(d) < new Date();
}

const inputCls =
  'rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none';

export default function LeadsPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [agents, setAgents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [filters, setFilters] = useState({
    search: '', status: '', priority: '', assignedAgent: '',
    page: 1, limit: 10, sortBy: 'createdAt', sortDir: 'desc',
  });

  const loadSidecars = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([InsuranceService.leadSummary(), InsuranceService.listAgents()]);
      setSummary(s);
      setAgents(a);
    } catch {
      // KPI bar / agents are non-critical; the table still works.
    }
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
      const res = await InsuranceService.listLeads(params);
      setLeads(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSidecars();
  }, [loadSidecars]);

  // Debounce so typing in search doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(loadLeads, 300);
    return () => clearTimeout(t);
  }, [loadLeads]);

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const toggleSort = (col) =>
    setFilters((f) => ({
      ...f,
      sortBy: col,
      sortDir: f.sortBy === col && f.sortDir === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));

  const changePriority = async (lead, priority) => {
    const prev = lead.priority;
    setLeads((ls) => ls.map((l) => (l._id === lead._id ? { ...l, priority } : l)));
    try {
      await InsuranceService.updatePriority(lead._id, priority);
    } catch {
      setLeads((ls) => ls.map((l) => (l._id === lead._id ? { ...l, priority: prev } : l)));
      toast.error('Failed to update priority');
    }
  };

  const removeLead = async (lead, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete lead "${lead.customerName}"? This cannot be undone.`)) return;
    try {
      await InsuranceService.deleteLead(lead._id);
      toast.success('Lead deleted');
      loadLeads();
      loadSidecars();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  const onCreated = (lead) => {
    setShowAdd(false);
    loadSidecars();
    navigate(`/insurance/leads/${lead._id || lead.id}`);
  };

  const SortHead = ({ col, children, className = '' }) => (
    <th className={`px-4 py-3 ${className}`}>
      <button onClick={() => toggleSort(col)} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-700">
        {children}
        <ArrowUpDown size={12} className={filters.sortBy === col ? 'text-blue-500' : 'text-slate-300'} />
      </button>
    </th>
  );

  const agentName = (a) => (a ? `${a.firstName || ''} ${a.lastName || ''}`.trim() : null);

  const kpis = useMemo(
    () => [
      { label: 'My Open Leads', value: summary?.myOpenLeads, icon: Briefcase, accent: 'blue' },
      { label: 'New This Week', value: summary?.newThisWeek, icon: Users, accent: 'violet' },
      { label: 'Follow-ups Today', value: summary?.followUpsToday, icon: CalendarClock, accent: 'amber' },
    ],
    [summary],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Leads</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage and track your insurance opportunities.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/insurance/leads/bulk')} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Upload size={15} /> Bulk Import
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} value={k.value ?? 0} loading={!summary} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputCls} w-full pl-9`}
            placeholder="Search name, mobile, vehicle, company…"
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
          />
        </div>
        <select className={inputCls} value={filters.status} onChange={(e) => setFilter({ status: e.target.value })}>
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={inputCls} value={filters.priority} onChange={(e) => setFilter({ priority: e.target.value })}>
          <option value="">All Priorities</option>
          {LEAD_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className={inputCls} value={filters.assignedAgent} onChange={(e) => setFilter({ assignedAgent: e.target.value })}>
          <option value="">All Agents</option>
          {agents.map((a) => <option key={a._id} value={a._id}>{agentName(a)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide">
              <tr>
                <SortHead col="customerName">Customer</SortHead>
                <th className="px-4 py-3 font-semibold text-slate-500">Vehicle / Company</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Agent</th>
                <SortHead col="status">Status</SortHead>
                <SortHead col="nextFollowUpAt">Next Follow-up</SortHead>
                <th className="px-4 py-3 font-semibold text-slate-500">Priority</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3"><div className="h-5 w-full animate-pulse rounded bg-slate-100" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <p className="text-sm font-semibold text-slate-600">No leads yet</p>
                    <p className="mt-1 text-xs text-slate-400">Add your first lead to start tracking opportunities.</p>
                    <button onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      <Plus size={15} /> Add Lead
                    </button>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} onClick={() => navigate(`/insurance/leads/${lead._id}`)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{lead.customerName}</div>
                      <div className="text-xs text-slate-400">{lead.mobileNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{lead.vehicleNumber || lead.companyName || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{agentName(lead.assignedAgent) || <span className="text-slate-300">Unassigned</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className={`px-4 py-3 ${isPastDue(lead.nextFollowUpAt) ? 'font-semibold text-red-500' : 'text-slate-600'}`}>
                      {fmtDate(lead.nextFollowUpAt)}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityDropdown value={lead.priority} onChange={(p) => changePriority(lead, p)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/insurance/leads/${lead._id}`); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="View">
                          <Eye size={15} />
                        </button>
                        <button onClick={(e) => removeLead(lead, e)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>{meta.total} lead{meta.total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 hover:bg-slate-50">
              <ChevronLeft size={14} />
            </button>
            <span>Page {meta.page} of {meta.totalPages || 1}</span>
            <button disabled={filters.page >= (meta.totalPages || 1)} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 hover:bg-slate-50">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {showAdd && <AddLeadModal agents={agents} onClose={() => setShowAdd(false)} onCreated={onCreated} />}
    </div>
  );
}
