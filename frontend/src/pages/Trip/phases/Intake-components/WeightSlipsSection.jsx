import React, { useCallback, useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { OCRService } from '../../services';

function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  return validTypes.includes(file.type) &&
    validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) &&
    file.size <= 10 * 1024 * 1024;
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
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files) => {
    if (files.length === 0) return;
    const validFiles = Array.from(files).filter(file => {
      if (!validateImageFile(file)) { toast.error(`${file.name} is not a valid image`); return false; }
      return true;
    });
    if (validFiles.length === 0) return;

    const startIndex = weightSlips.length;
    let loadedCount = 0;
    const newSlips = [];

    validFiles.forEach((file, fileIndex) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const slipIndex = startIndex + fileIndex;
        newSlips[fileIndex] = {
          file: { originalFile: file, preview: e.target.result, s3Url: null },
          origin: '', destination: '', weight: '',
          isDone: false, ocrData: null, ocrStatus: 'scanning',
          fileName: file.name, uploadIndex: slipIndex
        };
        loadedCount++;

        if (loadedCount === validFiles.length) {
          setWeightSlips(prev => [...prev, ...newSlips]);
          setWeightSlipScanning(prev => [...prev, ...new Array(validFiles.length).fill(true)]);
          setWeightSlipOcrResults(prev => [...prev, ...new Array(validFiles.length).fill(null)]);
          toast.success(`Added ${validFiles.length} weight slip(s). Scanning...`);

          validFiles.forEach((file, idx) => {
            const actualIndex = startIndex + idx;
            (async () => {
              try {
                const ocrResult = await OCRService.scanWeightCert(file);
                if (ocrResult.success) {
                  const hasWeightData = ocrResult.data?.netWeight || ocrResult.data?.finalWeight || ocrResult.data?.grossWeight;
                  const hasUsefulData = hasWeightData || ocrResult.data?.materialType || ocrResult.data?.origin || ocrResult.data?.destination;
                  setWeightSlips(prev => {
                    const updated = [...prev];
                    if (updated[actualIndex]) {
                      let endOdometer = ocrResult.data?.endOdometer || updated[actualIndex].endOdometer;
                      if (!endOdometer && fixedDocs?.odometer?.ocrData?.reading) endOdometer = fixedDocs.odometer.ocrData.reading;
                      updated[actualIndex] = {
                        ...updated[actualIndex],
                        ocrData: ocrResult.data, ocrStatus: hasUsefulData ? 'success' : 'warning',
                        weight: ocrResult.data?.netWeight || ocrResult.data?.finalWeight || updated[actualIndex].weight,
                        endOdometer,
                        grossWeight: ocrResult.data?.grossWeight || updated[actualIndex].grossWeight,
                        tareWeight: ocrResult.data?.tareWeight || updated[actualIndex].tareWeight,
                        netWeight: ocrResult.data?.netWeight || updated[actualIndex].netWeight,
                        materialType: ocrResult.data?.materialType || updated[actualIndex].materialType,
                        origin: ocrResult.data?.origin || updated[actualIndex].origin,
                        destination: ocrResult.data?.destination || updated[actualIndex].destination,
                      };
                    }
                    return updated;
                  });
                  setWeightSlipOcrResults(prev => { const u = [...prev]; u[actualIndex] = ocrResult; return u; });
                  if (hasWeightData) toast.success(`Slip #${actualIndex + 1}: ${ocrResult.data.netWeight || ocrResult.data.finalWeight || ocrResult.data.grossWeight} kg`);
                  else if (!hasUsefulData) toast.warning(`Slip #${actualIndex + 1}: No data detected. Enter manually.`);
                } else {
                  setWeightSlips(prev => { const u = [...prev]; if (u[actualIndex]) u[actualIndex] = { ...u[actualIndex], ocrData: null, ocrStatus: 'error', ocrError: ocrResult.error }; return u; });
                }
              } catch (error) {
                setWeightSlips(prev => { const u = [...prev]; if (u[actualIndex]) u[actualIndex] = { ...u[actualIndex], ocrData: null, ocrStatus: 'error', ocrError: error.message }; return u; });
              } finally {
                setWeightSlipScanning(prev => { const u = [...prev]; u[actualIndex] = false; return u; });
              }
            })();
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }, [setWeightSlips, weightSlips.length, fixedDocs, setWeightSlipScanning, setWeightSlipOcrResults]);

  const removeSlip = useCallback((index) => {
    setWeightSlips(prev => prev.filter((_, i) => i !== index));
    setWeightSlipOcrResults(prev => prev.filter((_, i) => i !== index));
    setWeightSlipScanning(prev => prev.filter((_, i) => i !== index));
  }, [setWeightSlips, setWeightSlipOcrResults, setWeightSlipScanning]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const isEmpty = weightSlips.length === 0;

  return (
    <div
      className={`intake-weight-slips${isDragging ? ' section-dragging' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="multi-slot-header">
        <h2 className="multi-slot-title">SLOT C: WEIGHT SLIPS</h2>
        <span className="multi-slot-counter">{weightSlips.length} files</span>
      </div>

      <input
        type="file"
        id="weight-slip-input"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.length) { handleFiles(Array.from(e.target.files)); e.target.value = ''; } }}
      />

      {isEmpty ? (
        /* ── Empty: full drop zone ── */
        <div className={`multi-slot-dropzone${isDragging ? ' dragging' : ''}`}>
          <div className={`multi-slot-dropzone-inner${isDragging ? ' dragging' : ''}`}>
            {isDragging ? (
              <>
                <div className="slot-dropzone-drag-icon">⬇️</div>
                <p className="slot-dropzone-drag-text">Drop weight slips here!</p>
              </>
            ) : (
              <>
                <Plus size={28} color="#94a3b8" strokeWidth={1.5} />
                <p className="multi-slot-dz-title">
                  Drag &amp; drop your <span className="slot-highlight">weight slips</span>
                </p>
                <p className="slot-dropzone-sub">
                  or{' '}
                  <label htmlFor="weight-slip-input" className="slot-browse-link">browse files</label>
                  {' '}on your computer
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Has files: thumbnail grid ── */
        <div className={`multi-slot-grid${isDragging ? ' grid-dragging' : ''}`}>
          {weightSlips.map((slip, index) => {
            const scanning = weightSlipScanning[index];
            const status = slip.ocrStatus;
            return (
              <div key={index} className="multi-slot-thumb">
                <img src={slip.file.preview} alt={`Slip ${index + 1}`} className="multi-slot-img" />
                <div className="multi-slot-num">#{index + 1}</div>
                <div className={`multi-slot-status ${scanning ? 'scanning' : status}`}>
                  {scanning ? <Loader2 size={11} className="spinning" /> :
                    status === 'success' ? <CheckCircle size={11} /> :
                    status === 'error' ? <AlertCircle size={11} /> :
                    <Loader2 size={11} className="spinning" />}
                </div>
                {slip.ocrData && (slip.ocrData.netWeight || slip.ocrData.grossWeight) && !scanning && (
                  <div className="multi-slot-data-tag">
                    {slip.ocrData.netWeight ? `${slip.ocrData.netWeight}kg` : `${slip.ocrData.grossWeight}kg`}
                  </div>
                )}
                <div className="multi-slot-hover-actions">
                  {slip.ocrData && (
                    <button className="multi-slot-action-btn view" onClick={() => onOcrPreview(`Weight Slip #${index + 1}`, slip.ocrData)}>OCR</button>
                  )}
                  <button className="multi-slot-action-btn remove" onClick={() => removeSlip(index)}><X size={12} /></button>
                </div>
              </div>
            );
          })}
          {/* Add tile */}
          <label htmlFor="weight-slip-input" className="multi-slot-add-tile">
            <Plus size={22} color="#94a3b8" />
            <span>Add</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default WeightSlipsSection;