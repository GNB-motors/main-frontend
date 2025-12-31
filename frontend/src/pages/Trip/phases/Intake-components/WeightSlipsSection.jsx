import React, { useCallback } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
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

const WeightSlipsSection = ({
  weightSlips,
  setWeightSlips,
  weightSlipScanning,
  setWeightSlipScanning,
  weightSlipOcrResults,
  setWeightSlipOcrResults,
  fixedDocs,
  onOcrPreview
}) => {
  // Handle weight slip uploads (multiple)
  const handleWeightSlipsDrop = useCallback((files) => {
    if (files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (!validateImageFile(file)) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      return true;
    });

    const newSlips = [];
    let processed = 0;
    const startIndex = weightSlips.length;

    validFiles.forEach((file, fileIndex) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const slipIndex = startIndex + fileIndex;

        // Add slip with scanning status
        const newSlip = {
          file: {
            originalFile: file,
            preview: e.target.result,
            s3Url: null
          },
          origin: '',
          destination: '',
          weight: '',
          isDone: false,
          ocrData: null,
          ocrStatus: 'scanning'
        };

        newSlips.push(newSlip);
        processed++;

        if (processed === validFiles.length) {
          setWeightSlips(prev => [...prev, ...newSlips]);

          // Initialize scanning states for new slips
          setWeightSlipScanning(prev => [
            ...prev,
            ...new Array(validFiles.length).fill(true)
          ]);
          setWeightSlipOcrResults(prev => [
            ...prev,
            ...new Array(validFiles.length).fill(null)
          ]);

          toast.success(`Added ${validFiles.length} weight slip(s). Scanning...`);

          // Run OCR on all new slips
          validFiles.forEach(async (f, idx) => {
            const actualIndex = startIndex + idx;
            try {
              console.log(`🔍 Starting OCR scan for weight slip #${actualIndex + 1}...`);
              const ocrResult = await OCRService.scanWeightCert(f);

              if (ocrResult.success) {
                console.log(`✅ Weight slip #${actualIndex + 1} scanned:`, ocrResult.data);

                // Update weight slip with OCR data
                setWeightSlips(prev => {
                  const updated = [...prev];
                  if (updated[actualIndex]) {
                    // Try to get odometer reading from fixedDocs if not present in slip OCR
                    let endOdometer = ocrResult.data?.endOdometer || updated[actualIndex].endOdometer;
                    if (!endOdometer && fixedDocs?.odometer?.ocrData?.reading) {
                      endOdometer = fixedDocs?.odometer?.ocrData?.reading;
                    }
                    updated[actualIndex] = {
                      ...updated[actualIndex],
                      ocrData: ocrResult.data,
                      ocrStatus: 'success',
                      // Autofill all available fields from OCR data
                      weight: ocrResult.data?.netWeight || ocrResult.data?.finalWeight || updated[actualIndex].weight,
                      endOdometer,
                      grossWeight: ocrResult.data?.grossWeight || updated[actualIndex].grossWeight,
                      tareWeight: ocrResult.data?.tareWeight || updated[actualIndex].tareWeight,
                      netWeight: ocrResult.data?.netWeight || updated[actualIndex].netWeight,
                      materialType: ocrResult.data?.materialType || updated[actualIndex].materialType,
                      origin: ocrResult.data?.origin || updated[actualIndex].origin,
                      destination: ocrResult.data?.destination || updated[actualIndex].destination,
                      // Add more fields as needed
                    };
                  }
                  return updated;
                });

                setWeightSlipOcrResults(prev => {
                  const updated = [...prev];
                  updated[actualIndex] = ocrResult;
                  return updated;
                });

                if (ocrResult.data?.netWeight || ocrResult.data?.grossWeight) {
                  toast.success(`Weight slip #${actualIndex + 1}: ${ocrResult.data.netWeight || ocrResult.data.grossWeight} kg detected`);
                }
              } else {
                console.warn(`⚠️ Weight slip #${actualIndex + 1} OCR failed:`, ocrResult.error);
                setWeightSlips(prev => {
                  const updated = [...prev];
                  if (updated[actualIndex]) {
                    updated[actualIndex] = {
                      ...updated[actualIndex],
                      ocrData: null,
                      ocrStatus: 'error',
                      ocrError: ocrResult.error
                    };
                  }
                  return updated;
                });
              }
            } catch (error) {
              console.error(`❌ Weight slip #${actualIndex + 1} OCR error:`, error);
              setWeightSlips(prev => {
                const updated = [...prev];
                if (updated[actualIndex]) {
                  updated[actualIndex] = {
                    ...updated[actualIndex],
                    ocrData: null,
                    ocrStatus: 'error',
                    ocrError: error.message
                  };
                }
                return updated;
              });
            } finally {
              setWeightSlipScanning(prev => {
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
  }, [setWeightSlips, weightSlips.length, fixedDocs, setWeightSlipScanning, setWeightSlipOcrResults]);

  // Remove weight slip
  const removeWeightSlip = useCallback((index) => {
    setWeightSlips(prev => prev.filter((_, i) => i !== index));
    setWeightSlipOcrResults(prev => prev.filter((_, i) => i !== index));
    setWeightSlipScanning(prev => prev.filter((_, i) => i !== index));
  }, [setWeightSlips, setWeightSlipOcrResults, setWeightSlipScanning]);

  return (
    <div className="intake-weight-slips">
      <div className="weight-slips-header">
        <h2>Slot C: Weight Slips</h2>
        <span className="counter">{weightSlips.length} files</span>
      </div>

      {/* Weight Slips List */}
      {weightSlips.length > 0 && (
        <div className="weight-slips-grid">
          {weightSlips.map((slip, index) => (
            <div key={index} className="weight-slip-item">
              <div className="slip-thumbnail-container">
                <img src={slip.file.preview} alt={`Slip ${index + 1}`} className="slip-thumbnail" />
                <div className="slip-index">#{index + 1}</div>

                {/* OCR Status Indicator for Weight Slips */}
                <div className={`slip-ocr-status ${slip.ocrStatus || 'pending'}`}>
                  {weightSlipScanning[index] ? (
                    <Loader2 size={12} className="spinning" />
                  ) : slip.ocrStatus === 'success' ? (
                    <CheckCircle size={12} />
                  ) : slip.ocrStatus === 'error' ? (
                    <AlertCircle size={12} />
                  ) : null}
                </div>

                {/* Weight Preview if OCR successful */}
                {slip.ocrData && (slip.ocrData.netWeight || slip.ocrData.grossWeight) && (
                  <div className="slip-weight-preview">
                    {slip.ocrData.netWeight ? `${slip.ocrData.netWeight} kg` : `G: ${slip.ocrData.grossWeight} kg`}
                  </div>
                )}

                <button
                  className="btn-view-slip-ocr"
                  onClick={() => onOcrPreview(`Weight Slip #${index + 1}`, slip.ocrData)}
                  title="View OCR data"
                  disabled={!slip.ocrData}
                >
                  <Eye size={14} />
                </button>

                <button
                  className="btn-remove-slip"
                  onClick={() => removeWeightSlip(index)}
                  title="Remove"
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
          onDrop={handleWeightSlipsDrop}
          acceptedFormats={['image/*']}
          multiple={true}
          label={weightSlips.length === 0 ? "Drop weight slips here or click to upload" : "Add more weight slips"}
          isCompact={true}
        />
      </div>
    </div>
  );
};

export default WeightSlipsSection;