import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import apiClient from '../../utils/axiosConfig';
import useApi from '../../hooks/useApi';
import OwnerValueService from '../../services/OwnerValueService';
import SlideOver from '../../components/cluster/SlideOver';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { formatINR, formatNum } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';

const DOC_TYPES = ['ALL', 'RC', 'INSURANCE', 'FITNESS', 'PERMIT', 'NATIONAL_PERMIT'];
const DOC_LABELS = {
  RC: 'RC',
  INSURANCE: 'Insurance',
  FITNESS: 'Fitness',
  PERMIT: 'Permit',
  NATIONAL_PERMIT: 'National Permit',
};
const WINDOWS = [30, 60, 90];

const EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'docType', label: 'Document' },
  { key: 'expiryDate', label: 'Expiry', type: 'date' },
  { key: 'daysLeft', label: 'Days left', type: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'exposureInr', label: 'Exposure (INR)', type: 'currency' },
];

function urgencyOf(doc) {
  if (doc.status === 'EXPIRED' || doc.daysLeft < 0) return 'critical';
  if (doc.daysLeft < 15) return 'critical';
  if (doc.daysLeft <= 30) return 'caution';
  return 'ok';
}

const URGENCY_LABEL = { critical: 'Act now', caution: 'Renew soon', ok: 'OK' };

function StatTile({ label, value, tone }) {
  return (
    <div className="cluster-inset flex flex-col gap-1 p-4">
      <span className="cluster-eyebrow">{label}</span>
      <span className="num text-xl font-bold" style={{ color: tone }}>
        {value}
      </span>
    </div>
  );
}

function DocumentDrawer({ doc, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!doc?.vehicleId) return undefined;
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    setError(null);
    apiClient
      .get(`/api/vehicles/${doc.vehicleId}/documents`)
      .then((res) => {
        if (cancelled) return;
        const docs = res.data?.data || [];
        setDetail(docs.find((d) => d.docType === doc.docType) || null);
      })
      .catch(
        (err) =>
          !cancelled && setError(err.response?.data?.message || 'Could not load the document.'),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doc?.vehicleId, doc?.docType]);

  const fields =
    detail?.ocr?.fields && typeof detail.ocr.fields === 'object'
      ? Object.entries(detail.ocr.fields)
      : [];
  const files = detail?.files || [];

  return (
    <SlideOver
      open={Boolean(doc)}
      onClose={onClose}
      title={doc ? `${DOC_LABELS[doc.docType] || doc.docType} — ${doc.registrationNumber}` : ''}
      subtitle={
        doc
          ? `Expires ${formatDateIST(doc.expiryDate)} · ${doc.daysLeft < 0 ? `${formatNum(-doc.daysLeft)} days overdue` : `${formatNum(doc.daysLeft)} days left`}`
          : ''
      }
    >
      {loading ? (
        <div className="text-dim text-sm">Loading document…</div>
      ) : error ? (
        <EmptyState title="Document unavailable" hint={error} />
      ) : !detail ? (
        <EmptyState
          title="No stored file for this document"
          hint="The expiry date is recorded, but the document image hasn't been uploaded yet. Upload it from the vehicle's profile to see the scan and its OCR fields here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {files.map((f, i) => (
            <a
              key={f.fileKey || i}
              href={f.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <img
                src={f.publicUrl}
                alt={`${DOC_LABELS[detail.docType] || detail.docType} ${f.side || ''}`}
                className="cluster-inset w-full object-contain"
                style={{ maxHeight: 320 }}
              />
            </a>
          ))}
          {detail.ocr?.status ? (
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`lamp ${detail.ocr.status === 'SUCCESS' ? 'lamp--ok' : 'lamp--caution'}`}
              >
                OCR {String(detail.ocr.status).toLowerCase()}
              </span>
              {detail.ocr.confidence != null ? (
                <span className="num text-dim">
                  {Math.round(detail.ocr.confidence)}% confidence
                </span>
              ) : null}
            </div>
          ) : null}
          {fields.length ? (
            <table className="w-full text-sm">
              <tbody>
                {fields.map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td className="text-dim py-1.5 pr-3 text-xs capitalize">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </td>
                    <td className="num py-1.5 text-right text-xs font-semibold">
                      {String(v ?? '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-dim text-xs">No OCR fields extracted for this document.</p>
          )}
        </div>
      )}
    </SlideOver>
  );
}

export default function CompliancePage() {
  const [days, setDays] = useState(30);
  const [docType, setDocType] = useState('ALL');
  const [selected, setSelected] = useState(null);

  const { data, loading, error } = useApi(
    (signal) => OwnerValueService.getComplianceRisk({ days }, signal),
    [days],
  );

  const docs = useMemo(() => {
    const all = data?.documents || [];
    return docType === 'ALL' ? all : all.filter((d) => d.docType === docType);
  }, [data, docType]);

  const stats = useMemo(() => {
    const all = data?.documents || [];
    return {
      expired: all.filter((d) => d.status === 'EXPIRED' || d.daysLeft < 0).length,
      under15: all.filter((d) => d.daysLeft >= 0 && d.daysLeft < 15).length,
      under30: all.filter((d) => d.daysLeft >= 15 && d.daysLeft <= 30).length,
      exposure: data?.totalExposureInr ?? 0,
    };
  }, [data]);

  const columns = [
    {
      key: 'registrationNumber',
      label: 'Vehicle',
      render: (d) => <span className="reg-plate">{d.registrationNumber}</span>,
    },
    { key: 'docType', label: 'Document', render: (d) => DOC_LABELS[d.docType] || d.docType },
    { key: 'expiryDate', label: 'Expiry', render: (d) => formatDateIST(d.expiryDate) },
    {
      key: 'daysLeft',
      label: 'Days left',
      align: 'right',
      render: (d) => {
        const tone = urgencyOf(d);
        return (
          <span className="font-semibold" style={{ color: `var(--${tone})` }}>
            {d.daysLeft < 0 ? `−${formatNum(-d.daysLeft)}` : formatNum(d.daysLeft)}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (d) => {
        const tone = urgencyOf(d);
        return (
          <span className={`lamp ${tone === 'ok' ? 'lamp--ok' : `lamp--${tone}`}`}>
            {URGENCY_LABEL[tone]}
          </span>
        );
      },
    },
    {
      key: 'exposureInr',
      label: 'Exposure',
      align: 'right',
      render: (d) => formatINR(d.exposureInr),
    },
  ];

  return (
    <div className="cluster-page">
      <PageShell
        title="Compliance & Documents"
        subtitle={`Vehicle documents expired or expiring in the next ${days} days, with estimated fine exposure.`}
        count={docs.length}
        actions={
          <ExportButton
            rows={docs}
            columns={EXPORT_COLUMNS}
            filename={`compliance-risk-${days}d`}
            disabled={!docs.length}
          />
        }
        filters={
          <FilterBar
            chips={DOC_TYPES.map((t) => ({ key: t, label: DOC_LABELS[t] || t }))}
            selectedKeys={[docType]}
            onToggleChip={setDocType}
            right={
              <div className="flex items-center gap-2">
                {WINDOWS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    aria-pressed={days === d}
                    className="cluster-inset num px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                    style={
                      days === d
                        ? { borderColor: 'var(--gnb-400)', color: 'var(--gnb-400)' }
                        : { color: 'var(--cluster-text-dim)' }
                    }
                  >
                    {d}d
                  </button>
                ))}
              </div>
            }
          />
        }
        footer={data?.disclaimer || null}
      >
        <PanelErrorBoundary name="compliance">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Expired" value={formatNum(stats.expired)} tone="var(--critical)" />
            <StatTile
              label="Under 15 days"
              value={formatNum(stats.under15)}
              tone="var(--caution)"
            />
            <StatTile
              label="Under 30 days"
              value={formatNum(stats.under30)}
              tone="var(--caution)"
            />
            <StatTile
              label="Fine exposure"
              value={formatINR(stats.exposure)}
              tone="var(--cluster-text)"
            />
          </div>

          <div className="mt-4">
            <DataTable
              columns={columns}
              rows={docs}
              rowKey={(d, i) => `${d.vehicleId}-${d.docType}-${i}`}
              loading={loading}
              error={error && !data ? error : null}
              onRowClick={(d) => setSelected(d)}
              showing={docs.length}
              total={docs.length}
              emptyTitle={
                docType === 'ALL'
                  ? `No documents expiring in ${days} days`
                  : `No ${DOC_LABELS[docType]} expiring in ${days} days`
              }
              emptyHint="Expiry dates come from the documents uploaded on each vehicle (RC, insurance, fitness, permits). Uploads with readable expiry dates are picked up automatically after OCR."
              emptyAction={
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ok)' }}>
                  <ShieldCheck size={13} /> Nothing to renew right now
                </span>
              }
            />
          </div>
        </PanelErrorBoundary>

        <DocumentDrawer doc={selected} onClose={() => setSelected(null)} />
      </PageShell>
    </div>
  );
}
