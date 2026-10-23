import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatDateIST } from '../../../utils/dateUtils';
import useApi from '../../../hooks/useApi';
import { VehicleService } from '../../Profile/VehicleService.js';
import logger from '../../../utils/logger';
import { documentSummary } from '../vehicle360Logic';
import { mapFetchedDocsToUiState } from '../../Profile/addVehicleDocMapping.js';
} from '../../Profile/Component/VehicleDocumentUpload.jsx';
  emptyDocsState,
  VEHICLE_DOC_TYPES,
import VehicleDocumentUpload, {
import Empty from './Empty';

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
  const summary = documentSummary(rows);

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
      <div className="v360-panel v360-panel--halves">
        <section className={`v360-card ${summary.expired > 0 ? 'v360-card--alert' : ''}`.trim()}>
          <div className="v360-card-head">
            <p className="v360-card-title">Documents</p>
          </div>
          {rows.length === 0 ? (
            <Empty
              title={docsLoading ? 'Loading documents…' : 'No documents on record'}
              hint={
                docsLoading
                  ? undefined
                  : 'RC, insurance, fitness and permits have never been uploaded, so nothing can be checked for expiry. Upload them below.'
              }
            />
          ) : (
            <>
              <span
                className={`v360-pill v360-pill--${summary.expired > 0 ? 'crit' : summary.expiring > 0 ? 'warn' : 'ok'}`}
              >
                <span className="v360-pill-dot" aria-hidden="true" />
                {summary.expired > 0
                  ? `${summary.expired} expired`
                  : summary.expiring > 0
                    ? `${summary.expiring} expiring soon`
                    : 'All current'}
              </span>
              <table className="v360-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th className="is-num">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.docType}>
                      <td>{d.docType}</td>
                      <td className="is-num">
                        {d.expiryDate ? formatDateIST(d.expiryDate) : 'no expiry recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        <section className="v360-card">
          <p className="v360-card-title">Why these matter</p>
          <dl className="v360-kv">
            <dt>Registration</dt>
            <dd className="is-dim">Proves the truck is yours and legally on the road</dd>
            <dt>Insurance</dt>
            <dd className="is-dim">Without it a claim cannot be filed at all</dd>
            <dt>Fitness</dt>
            <dd className="is-dim">Checked at every state border</dd>
            <dt>Permit</dt>
            <dd className="is-dim">Covers the routes this truck is allowed to run</dd>
          </dl>
        </section>
      </div>

      {vehicleId ? (
        <div className="v360-panel--single v360-panel" style={{ marginTop: 12 }}>
          <section className="v360-card">
            <VehicleDocumentUpload
              initialData={uiState}
              onDocumentsChange={handleDocumentsChange}
              onDeleteDocument={handleDeleteDocument}
            />
          </section>
        </div>
      ) : null}
    </PanelErrorBoundary>
  );
}
