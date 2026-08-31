import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Download } from 'lucide-react';
import apiClient from '../../utils/axiosConfig';
import useApi from '../../hooks/useApi';
import OwnerValueService from '../../services/OwnerValueService';
import SlideOver from '../../components/cluster/SlideOver';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { formatINR, formatNum } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import { buildCsvString, triggerFileDownload } from '../../utils/reportCsvExport';

const DOC_TYPES = ['ALL', 'RC', 'INSURANCE', 'FITNESS', 'PERMIT', 'NATIONAL_PERMIT'];
const DOC_LABELS = {
  RC: 'RC',
  INSURANCE: 'Insurance',
  FITNESS: 'Fitness',
  PERMIT: 'Permit',
  NATIONAL_PERMIT: 'National Permit',
};

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
      <span className="num text-xl font-bold" style={{ color: tone }}>{value}</span>
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
      .catch((err) => !cancelled && setError(err.response?.data?.message || 'Could not load the document.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doc?.vehicleId, doc?.docType]);

  const fields = detail?.ocr?.fields && typeof detail.ocr.fields === 'object' ? Object.entries(detail.ocr.fields) : [];
  const files = detail?.files || [];

  return (
    <SlideOver
      open={Boolean(doc)}
      onClose={onClose}
      title={doc ? `${DOC_LABELS[doc.docType] || doc.docType} — ${doc.registrationNumber}` : ''}
      subtitle={doc ? `Expires ${formatDateIST(doc.expiryDate)} · ${doc.daysLeft < 0 ? `${formatNum(-doc.daysLeft)} days overdue` : `${formatNum(doc.daysLeft)} days left`}` : ''}
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
            <a key={f.fileKey || i} href={f.publicUrl} target="_blank" rel="noreferrer" className="block">
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
              <span className={`lamp ${detail.ocr.status === 'SUCCESS' ? 'lamp--ok' : 'lamp--caution'}`}>
                OCR {String(detail.ocr.status).toLowerCase()}
              </span>
              {detail.ocr.confidence != null ? <span className="num text-dim">{Math.round(detail.ocr.confidence)}% confidence</span> : null}
            </div>
          ) : null}
          {fields.length ? (
            <table className="w-full text-sm">
              <tbody>
                {fields.map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td className="text-dim py-1.5 pr-3 text-xs capitalize">{k.replace(/([A-Z])/g, ' $1')}</td>
                    <td className="num py-1.5 text-right text-xs font-semibold">{String(v ?? '—')}</td>
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

  const { data, loading, error } = useApi((signal) => OwnerValueService.getComplianceRisk({ days }, signal), [days]);

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

  const exportCsv = () => {
    const csv = buildCsvString(
      ['Vehicle', 'Document', 'Expiry', 'Days left', 'Status', 'Exposure (INR)'],
      docs.map((d) => [d.registrationNumber, d.docType, formatDateIST(d.expiryDate), d.daysLeft, d.status, d.exposureInr]),
    );
    triggerFileDownload(csv, `compliance-risk-${days}d.csv`, 'text/csv');
  };

  return (
    <div className="cluster-page space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="cluster-title text-xl">Compliance &amp; Documents</h1>
          <p className="text-dim mt-1 text-sm">
            Vehicle documents expired or expiring in the next {days} days, with estimated fine exposure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className="cluster-inset num px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
              style={days === d ? { borderColor: 'var(--gnb-400)', color: 'var(--gnb-400)' } : { color: 'var(--cluster-text-dim)' }}
            >
              {d}d
            </button>
          ))}
          <button
            type="button"
            onClick={exportCsv}
            disabled={!docs.length}
            className="cluster-inset flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
            style={{ color: 'var(--cluster-text-dim)' }}
          >
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      <PanelErrorBoundary name="compliance">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Expired" value={formatNum(stats.expired)} tone="var(--critical)" />
          <StatTile label="Under 15 days" value={formatNum(stats.under15)} tone="var(--caution)" />
          <StatTile label="Under 30 days" value={formatNum(stats.under30)} tone="var(--caution)" />
          <StatTile label="Fine exposure" value={formatINR(stats.exposure)} tone="var(--cluster-text)" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {DOC_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDocType(t)}
              className="cluster-inset px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
              style={docType === t ? { borderColor: 'var(--gnb-400)', color: 'var(--gnb-400)' } : { color: 'var(--cluster-text-dim)' }}
            >
              {DOC_LABELS[t] || t}
            </button>
          ))}
        </div>

        <div className="cluster-panel mt-4 overflow-hidden">
          {loading && !data ? (
            <div className="flex flex-col gap-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="cluster-inset h-10 animate-pulse" />
              ))}
            </div>
          ) : error && !data ? (
            <EmptyState
              title="Compliance data unavailable"
              hint="The risk engine reads the documents stored on each vehicle. It appears here once vehicles and documents exist."
            />
          ) : docs.length === 0 ? (
            <EmptyState
              title={docType === 'ALL' ? `No documents expiring in ${days} days` : `No ${DOC_LABELS[docType]} expiring in ${days} days`}
              hint="Expiry dates come from the documents uploaded on each vehicle (RC, insurance, fitness, permits). Uploads with readable expiry dates are picked up automatically after OCR."
              action={
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ok)' }}>
                  <ShieldCheck size={13} /> Nothing to renew right now
                </span>
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: 'var(--cluster-text-dim)', borderBottom: '1px solid var(--hairline)' }}>
                  <th className="px-4 py-3 font-semibold">Vehicle</th>
                  <th className="px-4 py-3 font-semibold">Document</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                  <th className="num px-4 py-3 text-right font-semibold">Days left</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="num px-4 py-3 text-right font-semibold">Exposure</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d, i) => {
                  const tone = urgencyOf(d);
                  return (
                    <tr
                      key={`${d.vehicleId}-${d.docType}-${i}`}
                      onClick={() => setSelected(d)}
                      className="cursor-pointer transition-opacity hover:opacity-75"
                      style={{ borderBottom: '1px solid var(--hairline)' }}
                    >
                      <td className="px-4 py-3"><span className="reg-plate">{d.registrationNumber}</span></td>
                      <td className="px-4 py-3">{DOC_LABELS[d.docType] || d.docType}</td>
                      <td className="num px-4 py-3">{formatDateIST(d.expiryDate)}</td>
                      <td className="num px-4 py-3 text-right font-semibold" style={{ color: `var(--${tone === 'ok' ? 'ok' : tone})` }}>
                        {d.daysLeft < 0 ? `−${formatNum(-d.daysLeft)}` : formatNum(d.daysLeft)}
                      </td>
                      <td className="px-4 py-3"><span className={`lamp ${tone === 'ok' ? 'lamp--ok' : `lamp--${tone}`}`}>{URGENCY_LABEL[tone]}</span></td>
                      <td className="num px-4 py-3 text-right">{formatINR(d.exposureInr)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {data?.disclaimer ? <p className="text-dim mt-3 text-[11px]">{data.disclaimer}</p> : null}
      </PanelErrorBoundary>

      <DocumentDrawer doc={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
