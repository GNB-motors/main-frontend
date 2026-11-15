import React, { useState, useEffect } from 'react';
import ImageCropper from '../../../components/ImageCropper/ImageCropper';
import DocumentCard from './DocumentCard';
import { toast } from 'react-toastify';
import './DocumentUpload.css';
import logger from '../../../utils/logger';

const DocumentUpload = ({
  initialData = {},
  onDocumentsChange = () => {},
  onDeleteDocument = null,
  isSubmitting = false,
  digilockerStatus = undefined,
}) => {
  const [documents, setDocuments] = useState({
    driverLicense: {
      file: initialData.driverLicense?.file || null,
      imageUrl: initialData.driverLicense?.imageUrl || null,
      preview: initialData.driverLicense?.preview || null,
      name: initialData.driverLicense?.name || '',
      documentId: initialData.driverLicense?.documentId || null,
      isUploaded: initialData.driverLicense?.isUploaded || false,
      isVerified: initialData.driverLicense?.isVerified || false,
      licenseNumber: initialData.driverLicense?.licenseNumber || null,
      ocrStatus: initialData.driverLicense?.ocrStatus || null,
    },
    panCard: {
      file: initialData.panCard?.file || null,
      imageUrl: initialData.panCard?.imageUrl || null,
      preview: initialData.panCard?.preview || null,
      name: initialData.panCard?.name || '',
      documentId: initialData.panCard?.documentId || null,
      isUploaded: initialData.panCard?.isUploaded || false,
      isVerified: initialData.panCard?.isVerified || false,
    },
    aadharCard: {
      file: initialData.aadharCard?.file || null,
      imageUrl: initialData.aadharCard?.imageUrl || null,
      preview: initialData.aadharCard?.preview || null,
      name: initialData.aadharCard?.name || '',
      documentId: initialData.aadharCard?.documentId || null,
      isUploaded: initialData.aadharCard?.isUploaded || false,
      isVerified: initialData.aadharCard?.isVerified || false,
    },
  });

  // Sync internal state if initialData changes (e.g. loaded asynchronously)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setDocuments((prev) => ({
        driverLicense: {
          ...prev.driverLicense,
          ...initialData.driverLicense,
          documentId:
            initialData.driverLicense?.documentId || prev.driverLicense?.documentId || null,
          isUploaded:
            initialData.driverLicense?.isUploaded ??
            Boolean(
              initialData.driverLicense?.preview ||
              initialData.driverLicense?.documentId ||
              prev.driverLicense?.isUploaded,
            ),
          isVerified:
            initialData.driverLicense?.isVerified ?? prev.driverLicense?.isVerified ?? false,
          licenseNumber:
            initialData.driverLicense?.licenseNumber ?? prev.driverLicense?.licenseNumber ?? null,
          name: initialData.driverLicense?.name || prev.driverLicense?.name || '',
        },
        panCard: {
          ...prev.panCard,
          ...initialData.panCard,
          documentId: initialData.panCard?.documentId || prev.panCard?.documentId || null,
          isUploaded:
            initialData.panCard?.isUploaded ??
            Boolean(
              initialData.panCard?.preview ||
              initialData.panCard?.documentId ||
              prev.panCard?.isUploaded,
            ),
          isVerified: initialData.panCard?.isVerified ?? prev.panCard?.isVerified ?? false,
          name: initialData.panCard?.name || prev.panCard?.name || '',
        },
        aadharCard: {
          ...prev.aadharCard,
          ...initialData.aadharCard,
          documentId: initialData.aadharCard?.documentId || prev.aadharCard?.documentId || null,
          isUploaded:
            initialData.aadharCard?.isUploaded ??
            Boolean(
              initialData.aadharCard?.preview ||
              initialData.aadharCard?.documentId ||
              prev.aadharCard?.isUploaded,
            ),
          isVerified: initialData.aadharCard?.isVerified ?? prev.aadharCard?.isVerified ?? false,
          name: initialData.aadharCard?.name || prev.aadharCard?.name || '',
        },
      }));
    }
  }, [initialData]);

  const [cropperState, setCropperState] = useState({
    isOpen: false,
    currentDocument: null,
    imageSrc: null,
  });

  // Handle file selection
  const handleDocumentSelect = (documentType) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];

        if (file.size > 5 * 1024 * 1024) {
          toast.error('File size should be less than 5MB');
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

  // Handle crop completion
  const handleCropComplete = (croppedBlob) => {
    const { currentDocument } = cropperState;

    if (!currentDocument) return;

    const preview = URL.createObjectURL(croppedBlob);
    const oldDocId = documents[currentDocument]?.documentId;

    const updated = {
      file: croppedBlob,
      preview: preview,
      imageUrl: preview,
      name: `${currentDocument}-${Date.now()}.jpg`,
      documentId: null, // New file replaces old; will get new ID after upload
      _previousDocumentId: oldDocId || null, // Track old doc for deletion on save
      isUploaded: true,
      isVerified: false, // New upload is unverified
      licenseNumber: documents[currentDocument]?.licenseNumber || null,
    };

    setDocuments((prev) => ({
      ...prev,
      [currentDocument]: updated,
    }));

    // Call parent callback with updated documents
    onDocumentsChange({
      ...documents,
      [currentDocument]: updated,
    });

    // Close cropper
    setCropperState({
      isOpen: false,
      currentDocument: null,
      imageSrc: null,
    });
  };

  const handleRemoveDocument = async (documentType) => {
    const docId = documents[documentType]?.documentId;

    // Call server-side delete if document exists on backend
    if (docId && onDeleteDocument) {
      try {
        await onDeleteDocument(docId);
      } catch (err) {
        logger.warn('DocumentUpload', `Failed to delete ${documentType} from server`, err);
        return; // Don't clear local state if server delete failed
      }
    }

    const cleared = {
      file: null,
      imageUrl: null,
      preview: null,
      name: '',
      documentId: null,
      isUploaded: false,
      isVerified: false,
      licenseNumber: null,
    };

    setDocuments((prev) => ({
      ...prev,
      [documentType]: cleared,
    }));

    onDocumentsChange({
      ...documents,
      [documentType]: cleared,
    });
  };

  return (
    <div className="document-upload-wrapper">
      <div className="document-upload-outer-container">
        {/* Header Section */}
        <div className="document-upload-header">
          <div className="document-upload-header-content">
            <div className="document-upload-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M14 2H6C5.44772 2 5 2.44772 5 3V17C5 17.5523 5.44772 18 6 18H14C14.5523 18 15 17.5523 15 17V3C15 2.44772 14.5523 2 14 2Z"
                  stroke="#454547"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path d="M8 6H12" stroke="#454547" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 10H12" stroke="#454547" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 14H11" stroke="#454547" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="document-upload-title">Documents</div>
          </div>
        </div>

        {/* Documents Container */}
        <div className="document-upload-container">
          <div className="document-cards-grid">
            <DocumentCard
              documentType="driverLicense"
              label="Driver License"
              description="Upload a clear image of your driver license"
              preview={documents.driverLicense.preview}
              fileName={documents.driverLicense.name}
              isUploaded={
                documents.driverLicense.isUploaded ||
                Boolean(documents.driverLicense.preview || documents.driverLicense.documentId)
              }
              isVerified={documents.driverLicense.isVerified}
              licenseNumber={documents.driverLicense.licenseNumber}
              ocrStatus={documents.driverLicense.ocrStatus}
              onSelect={() => handleDocumentSelect('driverLicense')}
              onRemove={() => handleRemoveDocument('driverLicense')}
              onView={() => {
                if (documents.driverLicense.preview) {
                  window.open(documents.driverLicense.preview, '_blank', 'noopener,noreferrer');
                }
              }}
              isDisabled={isSubmitting}
              digilockerStatus={digilockerStatus}
            />

            <DocumentCard
              documentType="panCard"
              label="PAN Card"
              description="Upload a clear image of your PAN card"
              preview={documents.panCard.preview}
              fileName={documents.panCard.name}
              isUploaded={
                documents.panCard.isUploaded ||
                Boolean(documents.panCard.preview || documents.panCard.documentId)
              }
              isVerified={documents.panCard.isVerified}
              onSelect={() => handleDocumentSelect('panCard')}
              onRemove={() => handleRemoveDocument('panCard')}
              onView={() => {
                if (documents.panCard.preview) {
                  window.open(documents.panCard.preview, '_blank', 'noopener,noreferrer');
                }
              }}
              isDisabled={isSubmitting}
            />

            <DocumentCard
              documentType="aadharCard"
              label="Aadhar Card"
              description="Upload a clear image of your Aadhar card"
              preview={documents.aadharCard.preview}
              fileName={documents.aadharCard.name}
              isUploaded={
                documents.aadharCard.isUploaded ||
                Boolean(documents.aadharCard.preview || documents.aadharCard.documentId)
              }
              isVerified={documents.aadharCard.isVerified}
              onSelect={() => handleDocumentSelect('aadharCard')}
              onRemove={() => handleRemoveDocument('aadharCard')}
              onView={() => {
                if (documents.aadharCard.preview) {
                  window.open(documents.aadharCard.preview, '_blank', 'noopener,noreferrer');
                }
              }}
              isDisabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        src={cropperState.imageSrc}
        isOpen={cropperState.isOpen}
        onCropComplete={handleCropComplete}
        onCancel={() =>
          setCropperState({
            isOpen: false,
            currentDocument: null,
            imageSrc: null,
          })
        }
        title={
          cropperState.currentDocument === 'driverLicense'
            ? 'Crop Driver License'
            : cropperState.currentDocument === 'panCard'
              ? 'Crop PAN Card'
              : 'Crop Aadhar Card'
        }
        aspectRatio={NaN}
        circularCrop={false}
      />
    </div>
  );
};

export default DocumentUpload;
