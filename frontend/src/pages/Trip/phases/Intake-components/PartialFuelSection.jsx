import React, { useCallback, useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { OCRService } from '../../services';
import './PartialFuelSection.css';

function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  return validTypes.includes(file.type) &&
    validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) &&
    file.size <= 10 * 1024 * 1024;
}

const PartialFuelSection = ({ fixedDocs, setFixedDocs, onOcrPreview }) => {
  const [partialFuelScanning, setPartialFuelScanning] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files) => {
    if (files.length === 0) return;
    const validFiles = Array.from(files).filter(file => {
      if (!validateImageFile(file)) { toast.error(`${file.name} is not a valid image`); return false; }
      return true;
    });
    if (validFiles.length === 0) return;

    const startIndex = fixedDocs.partialFuel?.length || 0;
    const newFuels = [];
    let processed = 0;

    validFiles.forEach((file, fileIndex) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fuelIndex = startIndex + fileIndex;
        newFuels.push({
          file: { originalFile: file, preview: e.target.result, s3Url: null, ocrData: null, ocrStatus: 'scanning' },
          fuelType: 'partial', index: fuelIndex + 1
        });
        processed++;

        if (processed === validFiles.length) {
          setFixedDocs(prev => ({ ...prev, partialFuel: [...(prev.partialFuel || []), ...newFuels] }));
          setPartialFuelScanning(prev => [...prev, ...new Array(validFiles.length).fill(true)]);
          toast.success(`Added ${validFiles.length} partial fuel receipt(s). Scanning...`);

          validFiles.forEach(async (f, idx) => {
            const actualIndex = startIndex + idx;
            try {
              const ocrResult = await OCRService.scan(f, 'FUEL_SLIP');
              if (ocrResult.success) {
                setFixedDocs(prev => {
                  const updated = [...(prev.partialFuel || [])];
                  if (updated[actualIndex]) updated[actualIndex] = { ...updated[actualIndex], ocrData: ocrResult.data, ocrStatus: 'success' };
                  return { ...prev, partialFuel: updated };
                });
                if (ocrResult.data?.volume) toast.success(`Partial fuel #${actualIndex + 1}: ${ocrResult.data.volume}L`);
              } else {
                setFixedDocs(prev => {
                  const updated = [...(prev.partialFuel || [])];
                  if (updated[actualIndex]) updated[actualIndex] = { ...updated[actualIndex], ocrData: null, ocrStatus: 'error', ocrError: ocrResult.error };
                  return { ...prev, partialFuel: updated };
                });
              }
            } catch (error) {
              setFixedDocs(prev => {
                const updated = [...(prev.partialFuel || [])];
                if (updated[actualIndex]) updated[actualIndex] = { ...updated[actualIndex], file: { ...updated[actualIndex].file, ocrData: null, ocrStatus: 'error', ocrError: error.message } };
                return { ...prev, partialFuel: updated };
              });
            } finally {
              setPartialFuelScanning(prev => { const u = [...prev]; u[actualIndex] = false; return u; });
            }
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }, [fixedDocs.partialFuel, setFixedDocs]);

  const removeFuel = useCallback((index) => {
    setFixedDocs(prev => ({ ...prev, partialFuel: prev.partialFuel?.filter((_, i) => i !== index) || [] }));
    setPartialFuelScanning(prev => prev.filter((_, i) => i !== index));
  }, [setFixedDocs]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const partialFuels = fixedDocs.partialFuel || [];
  const isEmpty = partialFuels.length === 0;

  return (
    <div
      className={`intake-partial-fuel${isDragging ? ' section-dragging' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="multi-slot-header">
        <h2 className="multi-slot-title">
          SLOT D: PARTIAL FILL FUEL{' '}
          <span style={{ fontWeight: 400, color: '#94a3b8', textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(Optional)</span>
        </h2>
        <span className="multi-slot-counter">{partialFuels.length} files</span>
      </div>

      <input
        type="file"
        id="partial-fuel-input"
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
                <p className="slot-dropzone-drag-text">Drop fuel receipts here!</p>
              </>
            ) : (
              <>
                <Plus size={28} color="#94a3b8" strokeWidth={1.5} />
                <p className="multi-slot-dz-title">
                  Drag &amp; drop your <span className="slot-highlight">partial fuel receipts</span>
                </p>
                <p className="slot-dropzone-sub">
                  or{' '}
                  <label htmlFor="partial-fuel-input" className="slot-browse-link">browse files</label>
                  {' '}on your computer
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Has files: thumbnail grid ── */
        <div className={`multi-slot-grid${isDragging ? ' grid-dragging' : ''}`}>
          {partialFuels.map((fuel, index) => {
            const scanning = partialFuelScanning[index];
            const status = fuel.ocrStatus || fuel.file?.ocrStatus;
            return (
              <div key={index} className="multi-slot-thumb">
                <img src={fuel.file.preview} alt={`Fuel ${index + 1}`} className="multi-slot-img" />
                <div className="multi-slot-num">#{index + 1}</div>
                <div className={`multi-slot-status ${scanning ? 'scanning' : status}`}>
                  {scanning ? <Loader2 size={11} className="spinning" /> :
                    status === 'success' ? <CheckCircle size={11} /> :
                    status === 'error' ? <AlertCircle size={11} /> :
                    <Loader2 size={11} className="spinning" />}
                </div>
                {fuel.ocrData?.volume && !scanning && (
                  <div className="multi-slot-data-tag">{fuel.ocrData.volume}L</div>
                )}
                <div className="multi-slot-hover-actions">
                  {fuel.ocrData && (
                    <button className="multi-slot-action-btn view" onClick={() => onOcrPreview(`Partial Fuel #${fuel.index}`, fuel.ocrData)}>OCR</button>
                  )}
                  <button className="multi-slot-action-btn remove" onClick={() => removeFuel(index)} disabled={scanning}><X size={12} /></button>
                </div>
              </div>
            );
          })}
          {/* Add tile */}
          <label htmlFor="partial-fuel-input" className="multi-slot-add-tile">
            <Plus size={22} color="#94a3b8" />
            <span>Add</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default PartialFuelSection;