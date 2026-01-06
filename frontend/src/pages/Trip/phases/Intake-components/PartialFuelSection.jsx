import React, { useCallback, useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import DropZone from '../../../../components/DropZone/DropZone';
import { OCRService } from '../../services';
import './PartialFuelSection.css';

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

const PartialFuelSection = ({
  fixedDocs,
  setFixedDocs,
  onOcrPreview
}) => {
  const [partialFuelScanning, setPartialFuelScanning] = useState([]); // Array of boolean for each partial fuel

  // Handle partial fill fuel receipt uploads (multiple files with OCR)
  const handlePartialFuelDrop = useCallback((files) => {
    if (files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (!validateImageFile(file)) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      return true;
    });

    const newPartialFuels = [];
    let processed = 0;
    const startIndex = fixedDocs.partialFuel?.length || 0;

    validFiles.forEach((file, fileIndex) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fuelIndex = startIndex + fileIndex;

        // Add fuel with scanning status
        const newFuel = {
          file: {
            originalFile: file,
            preview: e.target.result,
            s3Url: null,
            ocrData: null,
            ocrStatus: 'scanning'
          },
          fuelType: 'partial',
          index: fuelIndex + 1
        };

        newPartialFuels.push(newFuel);
        processed++;

        if (processed === validFiles.length) {
          setFixedDocs(prev => ({
            ...prev,
            partialFuel: [...(prev.partialFuel || []), ...newPartialFuels]
          }));

          // Initialize scanning states for new fuels
          setPartialFuelScanning(prev => [
            ...prev,
            ...new Array(validFiles.length).fill(true)
          ]);

          toast.success(`Added ${validFiles.length} partial fuel receipt(s). Scanning...`);

          // Run OCR on all new partial fuels
          validFiles.forEach(async (f, idx) => {
            const actualIndex = startIndex + idx;
            try {
              console.log(`🔍 Starting OCR scan for partial fuel #${actualIndex + 1}...`);
              const ocrResult = await OCRService.scan(f, 'FUEL_SLIP');

              if (ocrResult.success) {
                console.log(`✅ Partial fuel #${actualIndex + 1} scanned:`, ocrResult.data);

                // Update partial fuel with OCR data
                setFixedDocs(prev => {
                  const updated = [...(prev.partialFuel || [])];
                  if (updated[actualIndex]) {
                    updated[actualIndex] = {
                      ...updated[actualIndex],
                      ocrData: ocrResult.data,
                      ocrStatus: 'success'
                    };
                  }
                  return { ...prev, partialFuel: updated };
                });

                if (ocrResult.data?.volume) {
                  toast.success(`Partial fuel #${actualIndex + 1}: ${ocrResult.data.volume}L detected`);
                }
              } else {
                console.warn(`⚠️ Partial fuel #${actualIndex + 1} OCR failed:`, ocrResult.error);
                setFixedDocs(prev => {
                  const updated = [...(prev.partialFuel || [])];
                  if (updated[actualIndex]) {
                    updated[actualIndex] = {
                      ...updated[actualIndex],
                      ocrData: null,
                      ocrStatus: 'error',
                      ocrError: ocrResult.error
                    };
                  }
                  return { ...prev, partialFuel: updated };
                });
              }
            } catch (error) {
              console.error(`❌ Partial fuel #${actualIndex + 1} OCR error:`, error);
              setFixedDocs(prev => {
                const updated = [...(prev.partialFuel || [])];
                if (updated[actualIndex]) {
                  updated[actualIndex] = {
                    ...updated[actualIndex],
                    file: {
                      ...updated[actualIndex].file,
                      ocrData: null,
                      ocrStatus: 'error',
                      ocrError: error.message
                    }
                  };
                }
                return { ...prev, partialFuel: updated };
              });
            } finally {
              setPartialFuelScanning(prev => {
                const updated = [...prev];
                updated[actualIndex] = false;
                return updated;
              });
            }
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }, [fixedDocs.partialFuel, setFixedDocs]);

  // Remove partial fuel receipt
  const removePartialFuel = useCallback((index) => {
    setFixedDocs(prev => ({
      ...prev,
      partialFuel: prev.partialFuel?.filter((_, i) => i !== index) || []
    }));
    setPartialFuelScanning(prev => prev.filter((_, i) => i !== index));
  }, [setFixedDocs]);

  return (
    <div className="intake-partial-fuel">
      <div className="partial-fuel-header">
        <h2>Slot D: Partial Fill Fuel (Optional)</h2>
        <span className="counter">{fixedDocs.partialFuel?.length || 0} files</span>
      </div>

      {fixedDocs.partialFuel && fixedDocs.partialFuel.length > 0 && (
        <div className="partial-fuel-grid">
          {fixedDocs.partialFuel.map((fuel, index) => (
            <div key={index} className="partial-fuel-item">
              <div className="fuel-thumbnail-container">
                <img src={fuel.file.preview} alt={`Partial Fuel ${fuel.index}`} className="fuel-thumbnail" />
                <div className="fuel-index">Partial #{fuel.index}</div>
                {partialFuelScanning[index] && (
                  <div className="ocr-status scanning">
                    <Loader2 size={14} className="spinning" />
                    <span>Scanning...</span>
                  </div>
                )}
                {fuel.ocrData && !partialFuelScanning[index] && (
                  <div className="ocr-status success" onClick={() => onOcrPreview(`Partial Fuel #${fuel.index}`, fuel.ocrData)}>
                    <Eye size={14} />
                    <span>OCR Data</span>
                  </div>
                )}
                {fuel.ocrStatus === 'error' && !partialFuelScanning[index] && (
                  <div className="ocr-status error">
                    <AlertCircle size={14} />
                    <span>OCR Failed</span>
                  </div>
                )}

                {/* OCR Data Preview */}
                {fuel.ocrData && (
                  <div className="ocr-data-preview">
                    <div className="ocr-data-item">
                      <span className="ocr-label">Volume:</span>
                      <span className="ocr-value">{fuel.ocrData?.volume || 'N/A'}L</span>
                    </div>
                    <div className="ocr-data-item">
                      <span className="ocr-label">Rate:</span>
                      <span className="ocr-value">₹{fuel.ocrData?.rate || 'N/A'}/L</span>
                    </div>
                    <div className="ocr-data-item">
                      <span className="ocr-label">Location:</span>
                      <span className="ocr-value ocr-value-truncate">{fuel.ocrData?.location || 'N/A'}</span>
                    </div>
                    <div className="ocr-data-item">
                      <span className="ocr-label">Date:</span>
                      <span className="ocr-value">{fuel.ocrData?.date || 'N/A'}</span>
                    </div>
                  </div>
                )}
                <button
                  className="btn-remove-fuel"
                  onClick={() => removePartialFuel(index)}
                  title="Remove"
                  disabled={partialFuelScanning[index]}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Upload Area */}
      <div className="compact-upload-zone">
        <DropZone
          onDrop={handlePartialFuelDrop}
          acceptedFormats={['image/*']}
          multiple={true}
          label={(fixedDocs.partialFuel?.length || 0) === 0 ? "Drop partial fuel receipts here or click to upload" : "Add more partial fuel receipts"}
          isCompact={true}
        />
      </div>
    </div>
  );
};

export default PartialFuelSection;