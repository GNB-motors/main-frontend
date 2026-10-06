import { useEffect, useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DataTable from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/button';
import apiClient from '../../../utils/axiosConfig';
import useApi from '../../../hooks/useApi';
import { LearningService } from '../../../services/LearningService';

const TABS = [
  { key: 'audit', label: 'Audit queue' },
  { key: 'promotion', label: 'Promotion reports' },
  { key: 'drift', label: 'Drift reports' },
];

function fmt(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN');
}
const idTail = (v) => (v ? String(v._id || v).slice(-6) : '—');
const pct = (v) => (typeof v === 'number' ? `${Math.round(v * 100)}%` : '—');

export default function SuperAdminLearningPage() {
  const [orgId, setOrgId] = useState('');
  const [tab, setTab] = useState('audit');

  const { data: orgsData } = useApi(
    (signal) => apiClient.get('/api/admin/organizations', { signal }),
    [],
  );
  const orgs = useMemo(() => {
    const raw = orgsData?.data?.data ?? orgsData?.data ?? [];
    return (Array.isArray(raw) ? raw : [])
      .map((o) => ({
        id: String(o._id || o.id),
        label: o.name || o.orgName || String(o._id).slice(-6),
      }))
      .filter((o) => o.id && o.id !== 'undefined');
  }, [orgsData]);

  // Default to the first org once the list loads.
  useEffect(() => {
    if (!orgId && orgs.length) setOrgId(orgs[0].id);
  }, [orgs, orgId]);

  const { data, loading, error, refetch } = useApi(
    (signal) => {
      if (!orgId) return Promise.resolve({ items: [] });
      const p = { orgId };
      if (tab === 'audit') return LearningService.audit(p, { signal });
      if (tab === 'promotion') return LearningService.promotionReports(p, { signal });
      return LearningService.driftReports(p, { signal });
    },
    [orgId, tab],
  );
  const rows = data?.items ?? [];

  const columns = useMemo(() => {
    if (tab === 'audit') {
      return [
        { key: 'type', label: 'Decision', render: (r) => r.type || '—' },
        {
          key: 'subject',
          label: 'Subject',
          render: (r) => `${r.subjectType || '—'} ${idTail(r.subjectId)}`,
        },
        {
          key: 'confidence',
          label: 'Confidence',
          align: 'right',
          render: (r) => pct(r.confidence),
        },
        { key: 'shadow', label: 'Shadow', render: (r) => (r.shadow ? 'yes' : 'no') },
        { key: 'at', label: 'When', render: (r) => fmt(r.at || r.createdAt) },
      ];
    }
    if (tab === 'promotion') {
      return [
        { key: 'type', label: 'Type', render: (r) => r.type || r.decisionType || '—' },
        {
          key: 'version',
          label: 'Version',
          render: (r) =>
            `${r.oldVersion || r.fromVersion || '—'} → ${r.newVersion || r.toVersion || '—'}`,
        },
        {
          key: 'labels',
          label: 'Labels',
          align: 'right',
          render: (r) => (r.nLabels != null ? r.nLabels : '—'),
        },
        {
          key: 'verdict',
          label: 'Verdict',
          render: (r) =>
            r.verdict != null
              ? String(r.verdict)
              : r.gatesPassed != null
                ? r.gatesPassed
                  ? 'PASS'
                  : 'FAIL'
                : '—',
        },
        { key: 'at', label: 'When', render: (r) => fmt(r.createdAt || r.promotedAt) },
      ];
    }
    return [
      { key: 'week', label: 'Week', render: (r) => r.week || '—' },
      {
        key: 'alerts',
        label: 'Alerts',
        render: (r) => (Array.isArray(r.alerts) && r.alerts.length ? r.alerts.length : '—'),
      },
      {
        key: 'range',
        label: 'Range',
        render: (r) => `${fmt(r.from).slice(0, 11)} – ${fmt(r.to).slice(0, 11)}`,
      },
      { key: 'at', label: 'Built', render: (r) => fmt(r.createdAt) },
    ];
  }, [tab]);

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Learning &amp; Audit</h1>
          <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
            Per-org learning signals — the audit queue, model-promotion reports and weekly drift.
          </p>
        </div>
        <div style={{ minWidth: 220 }}>
          <Select value={orgId} onValueChange={setOrgId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent align="end">
              {orgs.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <Button
            key={t.key}
            type="button"
            size="sm"
            variant={tab === t.key ? 'default' : 'outline'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r._id}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyTitle={orgId ? 'Nothing here for this org' : 'Pick an organization'}
        emptyHint={
          orgId
            ? 'This org has no learning records in this view yet.'
            : 'Select an organization to view its learning data.'
        }
      />
    </div>
  );
}
