import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Users, UserPlus, CalendarClock, ShieldCheck, CheckCircle2, XCircle, ArrowRight,
} from 'lucide-react';
import { InsuranceService } from '../InsuranceService';
import KpiCard from '../components/KpiCard';
import { StatusBadge } from '../components/badges';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function Panel({ title, children, empty }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-slate-800">{title}</h3>
      {empty ? <p className="text-xs text-slate-400">{empty}</p> : children}
    </div>
  );
}

export default function InsuranceOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    InsuranceService.getOverview(30)
      .then(setData)
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load overview'))
      .finally(() => setLoading(false));
  }, []);

  const k = data?.kpis || {};
  const cards = [
    { label: 'Total Leads', value: k.totalLeads, icon: Users, accent: 'blue' },
    { label: 'New (30d)', value: k.newLeads, icon: UserPlus, accent: 'violet' },
    { label: 'Follow-ups Today', value: k.followUpsToday, icon: CalendarClock, accent: 'amber' },
    { label: 'Policies Issued', value: k.policiesIssued, icon: ShieldCheck, accent: 'teal' },
    { label: 'Converted', value: k.converted, icon: CheckCircle2, accent: 'emerald' },
    { label: 'Closed', value: k.closed, icon: XCircle, accent: 'slate' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Business Overview</h1>
        <p className="mt-0.5 text-sm text-slate-500">Your insurance pipeline at a glance.</p>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <KpiCard key={c.label} {...c} value={c.value ?? 0} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Leads */}
        <Panel
          title="Recent Leads"
          empty={!loading && (!data?.recentLeads?.length) ? 'No leads yet.' : null}
        >
          <ul className="divide-y divide-slate-100">
            {(data?.recentLeads || []).map((l) => (
              <li key={l._id} className="py-2.5">
                <Link to={`/insurance/leads/${l._id}`} className="group flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800 group-hover:text-blue-600">{l.customerName}</div>
                    <div className="truncate text-xs text-slate-400">{l.vehicleNumber || l.companyName || '—'} · {fmtDate(l.createdAt)}</div>
                  </div>
                  <StatusBadge status={l.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Today's Follow-ups */}
        <Panel
          title="Today's Follow-ups"
          empty={!loading && (!data?.todaysFollowUps?.length) ? 'Nothing scheduled for today.' : null}
        >
          <ul className="divide-y divide-slate-100">
            {(data?.todaysFollowUps || []).map((l) => (
              <li key={l._id} className="py-2.5">
                <Link to={`/insurance/leads/${l._id}`} className="group flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800 group-hover:text-blue-600">{l.customerName}</div>
                    <div className="truncate text-xs text-slate-400">{l.nextFollowUpNote || 'Follow-up'}</div>
                  </div>
                  <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">{fmtTime(l.nextFollowUpAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Recent Activities */}
        <Panel
          title="Recent Activities"
          empty={!loading && (!data?.recentActivities?.length) ? 'No activity yet.' : null}
        >
          <ul className="space-y-3">
            {(data?.recentActivities || []).map((a) => {
              const actor = a.actor ? `${a.actor.firstName || ''} ${a.actor.lastName || ''}`.trim() : 'System';
              return (
                <li key={a._id} className="flex items-start gap-2 text-sm">
                  <ArrowRight size={13} className="mt-1 shrink-0 text-slate-300" />
                  <div className="min-w-0">
                    <div className="text-slate-700">
                      {a.message}
                      {a.leadId?.customerName ? <span className="text-slate-400"> · {a.leadId.customerName}</span> : null}
                    </div>
                    <div className="text-[11px] text-slate-400">{actor} · {fmtDate(a.createdAt)} {fmtTime(a.createdAt)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
