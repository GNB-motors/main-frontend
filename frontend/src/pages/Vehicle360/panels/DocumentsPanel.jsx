import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatDateIST } from '../../../utils/dateUtils';
import useApi from '../../../hooks/useApi';
import { VehicleService } from '../../Profile/VehicleService.js';
import VehicleDocumentUpload, {
  VEHICLE_DOC_TYPES,
  emptyDocsState,
} from '../../Profile/Component/VehicleDocumentUpload.jsx';
import { mapFetchedDocsToUiState } from '../../Profile/addVehicleDocMapping.js';
import logger from '../../../utils/logger';
import { OverviewCardSkeleton } from './overview/OverviewSkeleton';
import './overview/referenceOverview.css';
import './vehicleDocuments.css';

/**
 * Documents tab — the real thing, not a summary of it. Reads and writes the
 * same `/api/vehicles/:id/documents` subdocs as the Add/Edit Vehicle form
 * (`VehicleDocumentUpload`), so a document uploaded here is the document
 * uploaded there. `documents` (the lightweight vehicle-profile embed) is only
 * a first-paint fallback while the live fetch is in flight.
 */
export default function DocumentsPanel({ vehicleId, documents, onChanged }) {
  const {
    data: fetchedDocs,
    loading: docsLoading,
    refetch: refetchDocs,
  } = useApi(
    (signal) =>
      vehicleId ? VehicleService.getVehicleDocuments(vehicleId, { signal }) : Promise.resolve(null),
    [vehicleId],
    { enabled: Boolean(vehicleId) },
  );

  const [uiState, setUiState] = useState(emptyDocsState);
  const uploadingKeys = useRef(new Set());

  useEffect(() => {
    setUiState(mapFetchedDocsToUiState(fetchedDocs || [], emptyDocsState));
  }, [fetchedDocs]);

  const rows = fetchedDocs ?? documents ?? [];
  const uploadRef = useRef(null);
  const cards = VEHICLE_DOC_TYPES.map((meta) => {
    const doc = rows.find((row) => row.docType === meta.backendType);
    const expiry = doc?.expiryDate ? new Date(doc.expiryDate).getTime() : NaN;
    const days = Number.isFinite(expiry) ? Math.ceil((expiry - Date.now()) / 86400000) : null;
    const status = !doc
      ? 'Missing'
      : days == null
        ? 'Expiry unknown'
        : days < 0
          ? 'Expired'
          : days <= 30
            ? 'Expiring soon'
            : 'Current';
    return {
      ...meta,
      doc,
      days,
      status,
      tone: !doc || days < 0 ? 'danger' : days == null || days <= 30 ? 'warn' : 'ok',
    };
  });
  const onFile = cards.filter((card) => card.doc).length;
  const expired = cards.filter((card) => card.status === 'Expired').length;
  const expiring = cards.filter((card) => card.status === 'Expiring soon').length;
  const missing = cards.length - onFile;
  const goToUploads = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    uploadRef.current?.focus({ preventScroll: true });
  };

  const handleDocumentsChange = async (updated) => {
    setUiState(updated);

    for (const meta of VEHICLE_DOC_TYPES) {
      if (uploadingKeys.current.has(meta.key)) continue;
      const entry = updated[meta.key];
      const filesInOrder = [];
      const sidesInOrder = [];
      meta.sides.forEach((side) => {
        const slot = entry?.[side];
        if (slot?.file) {
          filesInOrder.push(slot.file);
          sidesInOrder.push(side);
        }
      });
      if (filesInOrder.length === 0) continue;

      uploadingKeys.current.add(meta.key);
      try {
        await VehicleService.uploadVehicleDocument(vehicleId, meta.backendType, filesInOrder, {
          sides: sidesInOrder,
          expiryDate: entry.expiryDate || undefined,
        });
        await refetchDocs();
        onChanged?.();
      } catch (err) {
        logger.warn('vehicle360PanelsB', `Failed to upload ${meta.backendType}`, err);
        toast.error(`Failed to upload ${meta.label}`);
      } finally {
        uploadingKeys.current.delete(meta.key);
      }
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await VehicleService.deleteVehicleDocument(vehicleId, documentId);
      await refetchDocs();
      onChanged?.();
    } catch (err) {
      toast.error('Failed to delete document');
      throw err;
    }
  };

  return (
    <PanelErrorBoundary name="vehicle-docs">
      <div className="vdo-overview vdocs">
        <section className="vdo-card vdocs-summary">
          <div className="vdocs-summary-head">
            <div>
              <h3>Vehicle documents</h3>
              <p>Records, validity and renewals for this vehicle.</p>
            </div>
            {vehicleId ? (
              <button className="vdocs-button vdocs-button--primary" onClick={goToUploads}>
                Manage documents →
              </button>
            ) : null}
          </div>
          {docsLoading && !fetchedDocs ? (
            <div className="vdocs-loading">Loading document records…</div>
          ) : (
            <>
              <div className="vdocs-metrics">
                {[
                  [`${onFile} / ${cards.length}`, 'On file'],
                  [missing, 'Missing'],
                  [expired, 'Expired'],
                  [expiring, 'Expiring in 30 days'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div
                className="vdocs-progress"
                aria-label={`${onFile} of ${cards.length} document types on file`}
              >
                <span style={{ width: `${(onFile / cards.length) * 100}%` }} />
              </div>
              <p className="vdocs-summary-note">
                {missing || expired || expiring
                  ? 'Review missing documents and upcoming renewals before the next trip.'
                  : 'Check that every uploaded document has a recorded expiry date.'}
              </p>
            </>
          )}
        </section>
        <div className="vdocs-grid">
          {docsLoading && !fetchedDocs
            ? cards.map((card) => <OverviewCardSkeleton key={card.key} />)
            : cards.map((card) => (
                <section className="vdo-card vdocs-document" key={card.key}>
                  <div className="vdocs-card-head">
                    <span className="vdocs-file-icon" aria-hidden="true">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
                        <path d="M14 3v6h5M8 13h8M8 17h5" />
                      </svg>
                    </span>
                    <span className={`vdocs-badge vdocs-badge--${card.tone}`}>● {card.status}</span>
                  </div>
                  <h3>
                    {card.label === 'RC'
                      ? 'Registration (RC)'
                      : card.label === 'PUCC'
                        ? 'Pollution (PUCC)'
                        : card.label}
                  </h3>
                  <p className="vdocs-description">{card.description}</p>
                  <div className="vdocs-validity">
                    <span>Valid until</span>
                    <strong>
                      {card.doc?.expiryDate && card.days != null
                        ? formatDateIST(card.doc.expiryDate)
                        : '—'}
                    </strong>
                  </div>
                  <p className={`vdocs-expiry vdocs-expiry--${card.tone}`}>
                    {!card.doc
                      ? 'Upload this document to track its validity.'
                      : card.days == null
                        ? 'No valid expiry date recorded.'
                        : card.days < 0
                          ? `Expired ${Math.abs(card.days)} ${Math.abs(card.days) === 1 ? 'day' : 'days'} ago`
                          : card.days === 0
                            ? 'Expires today'
                            : `${card.days} days remaining`}
                  </p>
                  {vehicleId ? (
                    <button className="vdocs-button" onClick={goToUploads}>
                      {card.doc ? 'View or update document' : 'Upload document'} →
                    </button>
                  ) : (
                    <p className="vdocs-description">
                      A vehicle record is needed to upload documents.
                    </p>
                  )}
                </section>
              ))}
        </div>
        {vehicleId ? (
          <section className="vdo-card vdocs-upload" ref={uploadRef} tabIndex={-1}>
            <h3>Manage documents</h3>
            <p className="vdocs-description">
              Upload, preview or replace files and update expiry dates below.
            </p>
            <VehicleDocumentUpload
              initialData={uiState}
              onDocumentsChange={handleDocumentsChange}
              onDeleteDocument={handleDeleteDocument}
            />
          </section>
        ) : null}
      </div>
    </PanelErrorBoundary>
  );
}
