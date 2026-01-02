import React, { useCallback, useState } from 'react';
import { Trash2, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import DropZone from '../../../../components/DropZone/DropZone';
import { OCRService } from '../../services';

/**
 * Validate that file is a valid image
 */
function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const isValidType = validTypes.includes(file.type);
  const isValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  return isValidType && isValidExtension && file.size <= 10 * 1024 * 1024; // 10MB max
}

const FixedDocumentsSection = ({
  fixedDocs,
  setFixedDocs,
  ocrScanning,
  setOcrScanning,
  onOcrPreview
}) => {
  const [ocrResults, setOcrResults] = useState({
    odometer: null,
    fuel: null,
  });

  // Handle fixed document uploads (odometer, fuel) with OCR
  const handleFixedDocDrop = useCallback(async (docType, files) => {
    if (files.length === 0) return;

    const file = files[0]; // Only accept 1 file
    if (!validateImageFile(file)) {
      toast.error('Please upload a valid image file');
      return;
    }

    // Read file for preview first
    const reader = new FileReader();
    reader.onload = async (e) => {
      // Set document with preview immediately
      setFixedDocs(prev => ({
        ...prev,
        [docType]: {
          file,
          preview: e.target.result,
          s3Url: null,
          ocrData: null,
          ocrStatus: 'scanning'
        }
      }));

      // Start OCR scanning
      // Note: ocrScanning state is managed by parent component
      setOcrScanning(prev => ({ ...prev, [docType]: true }));
      
      try {
        // Determine OCR document type
        const ocrDocType = docType === 'odometer' ? 'ODOMETER' : 'FUEL_RECEIPT';

        console.log(`🔍 Starting OCR scan for ${ocrDocType}...`);
        const ocrResult = await OCRService.scan(file, ocrDocType);

        if (ocrResult.success) {
          console.log(`✅ OCR scan successful for ${ocrDocType}:`, ocrResult.data);

          // Check if OCR data has meaningful values
          const hasOdometerData = docType === 'odometer' && ocrResult.data?.reading;
          const hasFuelData = docType === 'fuel' && (ocrResult.data?.volume || ocrResult.data?.rate);
          const hasUsefulData = hasOdometerData || hasFuelData;

          // Update document with OCR data
          setFixedDocs(prev => ({
            ...prev,
            [docType]: {
              ...prev[docType],
              ocrData: ocrResult.data,
              ocrStatus: hasUsefulData ? 'success' : 'warning'
            }
          }));

          setOcrResults(prev => ({ ...prev, [docType]: ocrResult }));

          // Show success message only if we have meaningful data
          if (docType === 'odometer' && ocrResult.data?.reading) {
            toast.success(`Odometer reading detected: ${ocrResult.data.reading}`);
          } else if (docType === 'fuel' && ocrResult.data?.volume) {
            toast.success(`Fuel volume detected: ${ocrResult.data.volume}L`);
          } else if (!hasUsefulData) {
            // Show warning if OCR succeeded but returned no useful data
            toast.warning(`${docType.charAt(0).toUpperCase() + docType.slice(1)} scanned but no data detected. Please enter manually.`);
          }
        } else {
          console.warn(`⚠️ OCR scan failed for ${ocrDocType}:`, ocrResult.error);
          setFixedDocs(prev => ({
            ...prev,
            [docType]: {
              ...prev[docType],
              ocrData: null,
              ocrStatus: 'error',
              ocrError: ocrResult.error
            }
          }));
          toast.warning(`OCR scan incomplete for ${docType}. You can still proceed.`);
        }
      } catch (error) {
        console.error(`❌ OCR error for ${docType}:`, error);
        setFixedDocs(prev => ({
          ...prev,
          [docType]: {
            ...prev[docType],
            ocrData: null,
            ocrStatus: 'error',
            ocrError: error.message
          }
        }));
      } finally {
        setOcrScanning(prev => ({ ...prev, [docType]: false }));
      }
    };
    reader.readAsDataURL(file);
  }, [setFixedDocs, setOcrScanning]);

  // Remove fixed document
  const removeFixedDoc = useCallback((docType) => {
    setFixedDocs(prev => ({
      ...prev,
      [docType]: null
    }));
  }, [setFixedDocs]);

  return (
    <div className="intake-fixed-docs">
      <div className="intake-doc-slot">
        <h3>Slot A: End Odometer Image</h3>
        {!fixedDocs.odometer ? (
          <DropZone
            onDrop={(files) => handleFixedDocDrop('odometer', files)}
            acceptedFormats={['image/*']}
            maxFiles={1}
            label="Drop End Odometer Image Here"
          />
        ) : (
          <div className="document-preview-container">
            <img src={fixedDocs.odometer?.preview} alt="Odometer" className="document-thumbnail" />

              {/* OCR Status Indicator */}
              <div className={`ocr-status-badge ${fixedDocs.odometer?.ocrStatus || 'pending'}`}>
                {ocrScanning.odometer ? (
                  <><Loader2 size={14} className="spinning" /> Scanning...</>
                ) : fixedDocs.odometer?.ocrStatus === 'success' ? (
                  <><CheckCircle size={14} /> OCR Done</>
                ) : fixedDocs.odometer?.ocrStatus === 'error' ? (
                  <><AlertCircle size={14} /> OCR Failed</>
                ) : null}
            </div>

            {/* OCR Data Preview */}
            {fixedDocs.odometer?.ocrData && (
              <div className="ocr-data-preview">
                <div className="ocr-data-item">
                  <span className="ocr-label">Reading:</span>
                  <span className="ocr-value">{fixedDocs.odometer?.ocrData?.reading || 'N/A'}</span>
                </div>
                {fixedDocs.odometer?.ocrData?.confidence && (
                  <div className="ocr-data-item">
                    <span className="ocr-label">Confidence:</span>
                    <span className="ocr-value">{fixedDocs.odometer?.ocrData?.confidence}%</span>
                  </div>
                )}
                <button
                  className="btn-view-ocr"
                  onClick={() => onOcrPreview('Odometer', fixedDocs.odometer?.ocrData)}
                  title="View full OCR data"
                >
                  <Eye size={14} /> Details
                </button>
              </div>
            )}

            <button
              className="btn-remove"
              onClick={() => removeFixedDoc('odometer')}
              title="Remove"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="intake-doc-slot">
        <h3>Slot B: Full Tank Fuel Slip</h3>
        {!fixedDocs.fuel ? (
          <DropZone
            onDrop={(files) => handleFixedDocDrop('fuel', files)}
            acceptedFormats={['image/*']}
            maxFiles={1}
            label="Drop Full Tank Fuel Slip Here"
          />
        ) : (
          <div className="document-preview-container">
            <img src={fixedDocs.fuel?.preview} alt="Fuel Receipt" className="document-thumbnail" />
            <span className="fuel-type-badge fullTank">Full Tank</span>

            {/* OCR Status Indicator */}
            <div className={`ocr-status-badge ${fixedDocs.fuel?.ocrStatus || 'pending'}`}>
              {ocrScanning.fuel ? (
                <><Loader2 size={14} className="spinning" /> Scanning...</>
              ) : fixedDocs.fuel?.ocrStatus === 'success' ? (
                <><CheckCircle size={14} /> OCR Done</>
              ) : fixedDocs.fuel?.ocrStatus === 'error' ? (
                <><AlertCircle size={14} /> OCR Failed</>
              ) : null}
            </div>

            {/* OCR Data Preview */}
            {fixedDocs.fuel?.ocrData && (
              <div className="ocr-data-preview">
                {fixedDocs.fuel?.ocrData?.volume && (
                  <div className="ocr-data-item">
                    <span className="ocr-label">Volume:</span>
                    <span className="ocr-value">{fixedDocs.fuel?.ocrData?.volume}L</span>
                  </div>
                )}
                {fixedDocs.fuel?.ocrData?.rate && (
                  <div className="ocr-data-item">
                    <span className="ocr-label">Rate:</span>
                    <span className="ocr-value">₹{fixedDocs.fuel?.ocrData?.rate}/L</span>
                  </div>
                )}
                {fixedDocs.fuel?.ocrData?.location && (
                  <div className="ocr-data-item">
                    <span className="ocr-label">Location:</span>
                    <span className="ocr-value ocr-value-truncate">{fixedDocs.fuel?.ocrData?.location}</span>
                  </div>
                )}
                <button
                  className="btn-view-ocr"
                  onClick={() => onOcrPreview('Fuel Receipt', fixedDocs.fuel?.ocrData)}
                  title="View full OCR data"
                >
                  <Eye size={14} /> Details
                </button>
              </div>
            )}

            <button
              className="btn-remove"
              onClick={() => removeFixedDoc('fuel')}
              title="Remove"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedDocumentsSection;