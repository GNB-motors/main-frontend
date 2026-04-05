import React, { useState, useEffect } from 'react';
import ImageCropper from '../../../components/ImageCropper/ImageCropper';
import DocumentCard from '../../Drivers/Component/DocumentCard';
import '../../Drivers/Component/DocumentUpload.css';

const VEHICLE_DOC_TYPES = [
  { key: 'rc', label: 'RC (Registration Certificate)', description: 'Upload a clear image of the vehicle RC' },
  { key: 'puc', label: 'PUC (Pollution Certificate)', description: 'Upload a clear image of the PUC certificate' },
  { key: 'fitnessCertificate', label: 'Fitness Certificate', description: 'Upload a clear image of the fitness certificate' },
];

const VehicleDocumentUpload = ({
  initialData = {},
  onDocumentsChange = () => {},
  onDeleteDocument = null,
  isSubmitting = false,
}) => {
  const [documents, setDocuments] = useState({
    rc: { file: null, imageUrl: null, preview: null, name: '', documentId: null },
    puc: { file: null, imageUrl: null, preview: null, name: '', documentId: null },
    fitnessCertificate: { file: null, imageUrl: null, preview: null, name: '', documentId: null },
  });

  // Sync internal state if initialData changes (e.g. loaded asynchronously)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setDocuments(prev => ({
        rc: { ...prev.rc, ...initialData.rc, documentId: initialData.rc?.documentId || prev.rc?.documentId || null },
        puc: { ...prev.puc, ...initialData.puc, documentId: initialData.puc?.documentId || prev.puc?.documentId || null },
        fitnessCertificate: { ...prev.fitnessCertificate, ...initialData.fitnessCertificate, documentId: initialData.fitnessCertificate?.documentId || prev.fitnessCertificate?.documentId || null },
      }));
    }
  }, [initialData]);

  const [cropperState, setCropperState] = useState({
    isOpen: false,
    currentDocument: null,
    imageSrc: null,
  });

  const handleDocumentSelect = (documentType) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];

        if (file.size > 10 * 1024 * 1024) {
          alert('File size should be less than 10MB');
          return;
        }

        // For PDF files, skip cropping
        if (file.type === 'application/pdf') {
          const oldDocId = documents[documentType]?.documentId;
          const updated = {
            ...documents,
            [documentType]: {
              file: file,
              preview: null,
              imageUrl: null,
              name: file.name,
              isPdf: true,
              documentId: null,
              _previousDocumentId: oldDocId || null,
            },
          };
          setDocuments(updated);
          onDocumentsChange(updated);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          setCropperState({
            isOpen: true,
            currentDocument: documentType,
            imageSrc: event.target.result,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleCropComplete = (croppedBlob) => {
    const { currentDocument } = cropperState;
    if (!currentDocument) return;

    const preview = URL.createObjectURL(croppedBlob);
    const oldDocId = documents[currentDocument]?.documentId;

    const updatedDoc = {
      file: croppedBlob,
      preview: preview,
      imageUrl: preview,
      name: `${currentDocument}-${Date.now()}`,
      documentId: null,
      _previousDocumentId: oldDocId || null,
    };

    const updated = { ...documents, [currentDocument]: updatedDoc };
    setDocuments(updated);
    onDocumentsChange(updated);

    setCropperState({ isOpen: false, currentDocument: null, imageSrc: null });
  };

  const handleRemoveDocument = async (documentType) => {
    const docId = documents[documentType]?.documentId;

    // Call server-side delete if document exists on backend
    if (docId && onDeleteDocument) {
      try {
        await onDeleteDocument(docId);
      } catch (err) {
        console.error(`Failed to delete ${documentType} from server:`, err);
        return;
      }
    }

    const cleared = { file: null, imageUrl: null, preview: null, name: '', documentId: null };
    const updated = { ...documents, [documentType]: cleared };
    setDocuments(updated);
    onDocumentsChange(updated);
  };

  const getCropperTitle = () => {
    const titles = {
      rc: 'Crop RC Document',
      puc: 'Crop PUC Document',
      fitnessCertificate: 'Crop Fitness Certificate',
    };
    return titles[cropperState.currentDocument] || 'Crop Document';
  };

  return (
    <div className="document-upload-wrapper">
      <div className="document-upload-outer-container">
        {/* Header Section */}
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

        {/* Documents Container */}
        <div className="document-upload-container">
          <div className="document-cards-grid">
            {VEHICLE_DOC_TYPES.map(({ key, label, description }) => (
              <DocumentCard
                key={key}
                documentType={key}
                label={label}
                description={description}
                preview={documents[key]?.preview}
                onSelect={() => handleDocumentSelect(key)}
                onRemove={() => handleRemoveDocument(key)}
                isDisabled={isSubmitting}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        src={cropperState.imageSrc}
        isOpen={cropperState.isOpen}
        onCropComplete={handleCropComplete}
        onCancel={() => setCropperState({ isOpen: false, currentDocument: null, imageSrc: null })}
        title={getCropperTitle()}
        aspectRatio={NaN}
        circularCrop={false}
      />
    </div>
  );
};

export default VehicleDocumentUpload;
