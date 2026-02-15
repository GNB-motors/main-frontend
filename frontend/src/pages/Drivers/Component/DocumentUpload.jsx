import React, { useState, useRef } from 'react';
import ImageCropper from '../../../components/ImageCropper/ImageCropper';
import DocumentCard from './DocumentCard';
import './DocumentUpload.css';

const DocumentUpload = ({ 
  initialData = {}, 
  onDocumentsChange = () => {},
  isSubmitting = false 
}) => {
  const [documents, setDocuments] = useState({
    driverLicense: {
      file: initialData.driverLicense?.file || null,
      imageUrl: initialData.driverLicense?.imageUrl || null,
      preview: initialData.driverLicense?.preview || null,
      name: initialData.driverLicense?.name || '',
    },
    panCard: {
      file: initialData.panCard?.file || null,
      imageUrl: initialData.panCard?.imageUrl || null,
      preview: initialData.panCard?.preview || null,
      name: initialData.panCard?.name || '',
    },
  });

  const [cropperState, setCropperState] = useState({
    isOpen: false,
    currentDocument: null,
    imageSrc: null,
  });

  const fileInputRef = useRef(null);

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
          alert('File size should be less than 5MB');
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
    
    setDocuments(prev => ({
      ...prev,
      [currentDocument]: {
        file: croppedBlob,
        preview: preview,
        imageUrl: preview,
        name: `${currentDocument}-${Date.now()}`,
      },
    }));

    // Call parent callback with updated documents
    onDocumentsChange({
      ...documents,
      [currentDocument]: {
        file: croppedBlob,
        preview: preview,
        imageUrl: preview,
        name: `${currentDocument}-${Date.now()}`,
      },
    });

    // Close cropper
    setCropperState({
      isOpen: false,
      currentDocument: null,
      imageSrc: null,
    });
  };

  const handleRemoveDocument = (documentType) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: {
        file: null,
        imageUrl: null,
        preview: null,
        name: '',
      },
    }));

    onDocumentsChange({
      ...documents,
      [documentType]: {
        file: null,
        imageUrl: null,
        preview: null,
        name: '',
      },
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
            <DocumentCard
              documentType="driverLicense"
              label="Driver License"
              description="Upload a clear image of your driver license"
              preview={documents.driverLicense.preview}
              onSelect={() => handleDocumentSelect('driverLicense')}
              onRemove={() => handleRemoveDocument('driverLicense')}
              isDisabled={isSubmitting}
            />
            
            <DocumentCard
              documentType="panCard"
              label="PAN Card"
              description="Upload a clear image of your PAN card"
              preview={documents.panCard.preview}
              onSelect={() => handleDocumentSelect('panCard')}
              onRemove={() => handleRemoveDocument('panCard')}
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
        onCancel={() => setCropperState({
          isOpen: false,
          currentDocument: null,
          imageSrc: null,
        })}
        title={
          cropperState.currentDocument === 'driverLicense'
            ? 'Crop Driver License'
            : 'Crop PAN Card'
        }
        aspectRatio={NaN}
        circularCrop={false}
      />
    </div>
  );
};

export default DocumentUpload;
