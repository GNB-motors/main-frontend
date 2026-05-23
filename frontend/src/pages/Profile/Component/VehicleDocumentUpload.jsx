import React, { useState, useEffect } from 'react';
import ImageCropper from '../../../components/ImageCropper/ImageCropper';
import DocumentCard from '../../Drivers/Component/DocumentCard';
import '../../Drivers/Component/DocumentUpload.css';

// Five canonical vehicle document types. RC and National Permit accept two
// images (front + back) — others are single-page.
// Backend enum lives in main-backend/app/modules/vehicle/vehicle.model.js.
export const VEHICLE_DOC_TYPES = [
  { key: 'rc',             label: 'RC',                backendType: 'RC',              sides: ['FRONT', 'BACK'], description: 'Registration Certificate — upload front and back' },
  { key: 'insurance',      label: 'Insurance',         backendType: 'INSURANCE',       sides: ['SINGLE'],        description: 'Motor insurance policy / schedule' },
  { key: 'fitness',        label: 'Fitness Certificate', backendType: 'FITNESS',       sides: ['SINGLE'],        description: 'RTO fitness certificate (Form 38)' },
  { key: 'permit',         label: 'Permit',            backendType: 'PERMIT',          sides: ['SINGLE'],        description: 'State Transport Authority permit' },
  { key: 'nationalPermit', label: 'National Permit',   backendType: 'NATIONAL_PERMIT', sides: ['FRONT', 'BACK'], description: 'National Permit — upload front and back' },
];

const emptySlot = () => ({ file: null, preview: null, imageUrl: null, name: '', isPdf: false });

const emptyDocEntry = (sides) => {
  const entry = { documentId: null, expiryDate: null, ocrStatus: null };
  sides.forEach((side) => { entry[side] = emptySlot(); });
  return entry;
};

export const emptyDocsState = () =>
  VEHICLE_DOC_TYPES.reduce((acc, { key, sides }) => {
    acc[key] = emptyDocEntry(sides);
    return acc;
  }, {});

const VehicleDocumentUpload = ({
  initialData = {},
  onDocumentsChange = () => {},
  onDeleteDocument = null,
  isSubmitting = false,
}) => {
  const [documents, setDocuments] = useState(emptyDocsState);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setDocuments((prev) => {
        const next = { ...prev };
        VEHICLE_DOC_TYPES.forEach(({ key, sides }) => {
          const incoming = initialData[key] || {};
          next[key] = {
            ...prev[key],
            ...incoming,
            documentId: incoming.documentId || prev[key]?.documentId || null,
          };
          sides.forEach((side) => {
            next[key][side] = { ...prev[key][side], ...(incoming[side] || {}) };
          });
        });
        return next;
      });
    }
  }, [initialData]);

  const [cropperState, setCropperState] = useState({
    isOpen: false,
    docKey: null,
    side: null,
    imageSrc: null,
  });

  const updateSlot = (docKey, side, slot) => {
    const updated = {
      ...documents,
      [docKey]: { ...documents[docKey], [side]: slot },
    };
    setDocuments(updated);
    onDocumentsChange(updated);
  };

  const handleSelect = (docKey, side) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
      }

      if (file.type === 'application/pdf') {
        updateSlot(docKey, side, {
          file,
          preview: null,
          imageUrl: null,
          name: file.name,
          isPdf: true,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropperState({ isOpen: true, docKey, side, imageSrc: ev.target.result });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleCropComplete = (croppedBlob) => {
    const { docKey, side } = cropperState;
    if (!docKey || !side) return;
    const preview = URL.createObjectURL(croppedBlob);
    updateSlot(docKey, side, {
      file: croppedBlob,
      preview,
      imageUrl: preview,
      name: `${docKey}-${side}-${Date.now()}`,
      isPdf: false,
    });
    setCropperState({ isOpen: false, docKey: null, side: null, imageSrc: null });
  };

  // The backend stores one subdoc per docType (all sides together), so removing
  // any side after upload deletes the whole subdoc on the server. Locally we
  // can clear just one slot before the user has saved.
  const handleRemove = async (docKey, side) => {
    const docId = documents[docKey]?.documentId;
    if (docId && onDeleteDocument) {
      try {
        await onDeleteDocument(docId);
      } catch (err) {
        console.error(`Failed to delete ${docKey} from server:`, err);
        return;
      }
      // Clear all sides for this docType since the whole subdoc was removed.
      const cleared = emptyDocEntry(VEHICLE_DOC_TYPES.find(d => d.key === docKey).sides);
      const updated = { ...documents, [docKey]: cleared };
      setDocuments(updated);
      onDocumentsChange(updated);
      return;
    }
    updateSlot(docKey, side, emptySlot());
  };

  const cropperTitle = () => {
    if (!cropperState.docKey) return 'Crop Document';
    const meta = VEHICLE_DOC_TYPES.find((t) => t.key === cropperState.docKey);
    const base = meta ? meta.label : 'Document';
    if (cropperState.side === 'SINGLE') return `Crop ${base}`;
    return `Crop ${base} — ${cropperState.side.charAt(0)}${cropperState.side.slice(1).toLowerCase()}`;
  };

  return (
    <div className="document-upload-wrapper">
      <div className="document-upload-outer-container">
        <div className="document-upload-header">
          <div className="document-upload-header-content">
            <div className="document-upload-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M14 2H6C5.44772 2 5 2.44772 5 3V17C5 17.5523 5.44772 18 6 18H14C14.5523 18 15 17.5523 15 17V3C15 2.44772 14.5523 2 14 2Z"
                      stroke="#454547" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M8 6H12" stroke="#454547" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8 10H12" stroke="#454547" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8 14H11" stroke="#454547" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="document-upload-title">Documents</div>
          </div>
        </div>

        <div className="document-upload-container">
          <div className="document-cards-grid">
            {VEHICLE_DOC_TYPES.map(({ key, label, sides, description }) =>
              sides.map((side) => {
                const slot = documents[key]?.[side] || emptySlot();
                const cardLabel = side === 'SINGLE'
                  ? label
                  : `${label} — ${side.charAt(0)}${side.slice(1).toLowerCase()}`;
                return (
                  <DocumentCard
                    key={`${key}-${side}`}
                    documentType={`${key}-${side}`}
                    label={cardLabel}
                    description={description}
                    preview={slot.preview}
                    onSelect={() => handleSelect(key, side)}
                    onRemove={() => handleRemove(key, side)}
                    isDisabled={isSubmitting}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>

      <ImageCropper
        src={cropperState.imageSrc}
        isOpen={cropperState.isOpen}
        onCropComplete={handleCropComplete}
        onCancel={() => setCropperState({ isOpen: false, docKey: null, side: null, imageSrc: null })}
        title={cropperTitle()}
        aspectRatio={NaN}
        circularCrop={false}
      />
    </div>
  );
};

export default VehicleDocumentUpload;
