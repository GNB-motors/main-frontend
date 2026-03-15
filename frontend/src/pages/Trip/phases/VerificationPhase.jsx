/**
 * VerificationPhase Component - Phase 3 of Trip Creation
 * Redesigned: progress bar, modern card-based layout, success animation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Eye, AlertCircle, CheckCircle, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import './VerificationPhase.css';
import ImagePreviewModal from '../components/ImagePreviewModal';

/* ── Success overlay shown after submit ── */
const SuccessOverlay = () => (
  <div className="vp-success-overlay">
    <div className="vp-success-card">
      <div className="vp-success-icon-ring">
        <CheckCircle size={48} className="vp-success-icon" />
      </div>
      <h2 className="vp-success-title">Trip Created!</h2>
      <p className="vp-success-sub">Your journey has been submitted successfully.<br />Redirecting you now…</p>
      <div className="vp-success-dots">
        <span /><span /><span />
      </div>
    </div>
  </div>
);

const VerificationPhase = ({
  onBack,
  onSubmit,
  isSubmitting,
  onCancel,
  fixedDocs: propsFixedDocs = {},
  weightSlips: propsWeightSlips = [],
  journeyData
}) => {
  const [weightSlips] = useState(propsWeightSlips);
  const [fixedDocs]   = useState(propsFixedDocs);
  const [submitted, setSubmitted]   = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, imageSrc: null, title: '' });

  const isDataComplete = useMemo(() => {
    if (!weightSlips || weightSlips.length === 0) return false;
    return weightSlips.every((slip) => {
      if (slip.isDone === true) return true;
      const hasWeights = (slip.grossWeight || slip.weights?.grossWeight) &&
        (slip.tareWeight || slip.weights?.tareWeight) &&
        (slip.netWeight  || slip.weights?.netWeight);
      const hasMaterialType = slip.materialType && slip.materialType !== '';
      const hasRoute = slip.routeData && (
        slip.routeData.sourceLocation || slip.routeData.destLocation ||
        Object.keys(slip.routeData).length > 0
      );
      return hasWeights && hasMaterialType && hasRoute;
    });
  }, [weightSlips]);

  const completedCount = useMemo(() => weightSlips.filter(s => s.isDone).length, [weightSlips]);

  const totalWeight = useMemo(() =>
    weightSlips.reduce((sum, slip) =>
      sum + (parseFloat(slip.netWeight || slip.weights?.netWeight || slip.weight) || 0), 0
    ).toFixed(2), [weightSlips]);

  const revenueSummary = useMemo(() => {
    const totalRevenue = weightSlips.reduce((sum, slip) =>
      sum + (parseFloat(slip.totalAmountReceived) || slip.revenue?.actualAmountReceived || 0), 0);
    const totalCalculated = weightSlips.reduce((sum, slip) => {
      const netWeight = parseFloat(slip.netWeight) || slip.weights?.netWeight || 0;
      const ratePerKg = parseFloat(slip.amountPerKg) || slip.revenue?.ratePerKg || 0;
      return sum + (netWeight * ratePerKg / 1000);
    }, 0);
    return { totalRevenue, totalCalculated, totalVariance: totalRevenue - totalCalculated };
  }, [weightSlips]);

  const totalExpense = useMemo(() => weightSlips.reduce((sum, slip) =>
    sum + (parseFloat(slip.materialCost) || slip.expenses?.materialCost || 0) +
          (parseFloat(slip.toll) || slip.expenses?.toll || 0) +
          (parseFloat(slip.driverCost) || slip.expenses?.driverCost || 0) +
          (parseFloat(slip.driverTripExpense) || slip.expenses?.driverTripExpense || 0) +
          (parseFloat(slip.royalty) || slip.expenses?.royalty || 0) +
          (parseFloat(slip.otherExpenses) || slip.expenses?.otherExpenses || 0), 0), [weightSlips]);

  const profit = useMemo(() => (revenueSummary.totalRevenue || 0) - (totalExpense || 0), [revenueSummary, totalExpense]);

  /* ── Image preview ── */
  const createdObjectUrls = React.useRef(new Set());
  React.useEffect(() => () => {
    createdObjectUrls.current.forEach(u => { try { URL.revokeObjectURL(u); } catch(e){} });
    createdObjectUrls.current.clear();
  }, []);

  const resolveImageSrc = (fileOrObj) => {
    if (!fileOrObj) return null;
    if (typeof fileOrObj === 'string') return fileOrObj;
    if (fileOrObj.preview && typeof fileOrObj.preview === 'string') return fileOrObj.preview;
    if (fileOrObj.s3Url  && typeof fileOrObj.s3Url  === 'string') return fileOrObj.s3Url;
    const candidate = fileOrObj.file || fileOrObj.originalFile || fileOrObj;
    try {
      if (candidate instanceof File || candidate instanceof Blob) {
        const url = URL.createObjectURL(candidate);
        createdObjectUrls.current.add(url);
        return url;
      }
    } catch(e) {}
    return null;
  };

  const openPreview  = useCallback((src, title) => setPreviewModal({ isOpen: true, imageSrc: src, title }), []);
  const closePreview = useCallback(() => setPreviewModal({ isOpen: false, imageSrc: null, title: '' }), []);

  const handleSubmit = useCallback(async () => {
    if (!isDataComplete) { toast.error('Please complete all weight slips before submitting'); return; }
    if (onSubmit) {
      setSubmitted(true);
      onSubmit();
    }
  }, [isDataComplete, onSubmit]);

  /* ── Helper: doc thumbnail ── */
  const DocThumb = ({ src, label, onPreview }) => (
    <div className="vp-doc-thumb" onClick={() => src && onPreview(src, label)}>
      {src
        ? <img src={src} alt={label} />
        : <div className="vp-doc-thumb-empty">No Image</div>}
      <div className="vp-doc-thumb-label">{label}</div>
      {src && (
        <div className="vp-doc-thumb-overlay">
          <Eye size={18} />
        </div>
      )}
    </div>
  );

  /* ── Journey metrics ── */
  const journeyMetrics = journeyData ? (() => {
    const startOdometer   = journeyData?.mileageData?.startOdometer    ?? journeyData?.startOdometer    ?? null;
    const endOdometer     = journeyData?.mileageData?.endOdometer      ?? journeyData?.endOdometer      ?? null;
    const totalDistance   = journeyData?.mileageData?.totalDistanceKm  ?? journeyData?.totalDistance    ?? null;
    const fullTankLitres  = journeyData?.fuelData?.litres              ?? journeyData?.fuelLitres       ?? null;
    const fuelRate        = journeyData?.fuelData?.rate                ?? journeyData?.fuelRate         ?? null;
    const partialSum      = (fixedDocs?.partialFuel || []).reduce((s, pf) => {
      const o = pf?.ocrData || pf?.file?.ocrData || {};
      return s + (parseFloat(o?.volume || o?.litres || o?.liters || o?.quantity || 0) || 0);
    }, 0);
    const totalFuelUsed   = (Number(fullTankLitres) || 0) + (Number(partialSum) || 0);
    const providedEff     = journeyData?.fuelData?.efficiency ?? journeyData?.fuelEfficiency ?? null;
    const computedEff     = (totalDistance && totalFuelUsed > 0) ? Number(totalDistance) / Number(totalFuelUsed) : null;
    const fuelEfficiency  = providedEff ?? computedEff;
    const fuelCost        = journeyData?.fuelCost ?? ((Number(fullTankLitres) && Number(fuelRate)) ? Number(fullTankLitres) * Number(fuelRate) : null);
    return [
      { label: 'Start Odometer',  value: startOdometer  !== null ? `${Number(startOdometer).toLocaleString()} km`  : '—' },
      { label: 'End Odometer',    value: endOdometer    !== null ? `${Number(endOdometer).toLocaleString()} km`    : '—' },
      { label: 'Total Distance',  value: totalDistance  !== null ? `${Number(totalDistance).toLocaleString()} km`  : '—' },
      { label: 'Full Tank Fuel',  value: fullTankLitres !== null ? `${Number(fullTankLitres).toLocaleString()} L`  : '—' },
      { label: 'Partial Fuel',    value: partialSum > 0           ? `${Number(partialSum).toLocaleString()} L`     : '—' },
      { label: 'Total Fuel Used', value: totalFuelUsed > 0        ? `${Number(totalFuelUsed).toLocaleString()} L`  : '—' },
      { label: 'Fuel Rate',       value: fuelRate       !== null  ? `₹${Number(fuelRate).toLocaleString()}`        : '—' },
      { label: 'Fuel Efficiency', value: fuelEfficiency !== null  ? `${Number(fuelEfficiency).toFixed(2)} km/L`   : '—' },
      { label: 'Fuel Cost',       value: fuelCost       !== null  ? `₹${Number(fuelCost).toLocaleString()}`        : '—' },
    ];
  })() : [];

  return (
    <div className="vp-page">

      {/* ── Step progress bar (Step 3 of 4 = 75%) ── */}
      <div className="vp-progress-header">
        <div className="vp-progress-track">
          <div className="vp-progress-fill" style={{ width: '75%' }} />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="vp-content">

        {/* Journey Summary */}
        {journeyData && (
          <section className="vp-card">
            <div className="vp-card-header">
              <h2 className="vp-card-title">JOURNEY SUMMARY</h2>
            </div>
            <div className="vp-metric-grid">
              {journeyMetrics.map(({ label, value }) => (
                <div key={label} className="vp-metric">
                  <span className="vp-metric-label">{label}</span>
                  <span className="vp-metric-value">{value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attached Documents */}
        <section className="vp-card">
          <div className="vp-card-header">
            <h2 className="vp-card-title">ATTACHED DOCUMENTS</h2>
          </div>
          <div className="vp-docs-row">
            {fixedDocs.odometer && (
              <DocThumb
                src={resolveImageSrc(fixedDocs.odometer.preview || fixedDocs.odometer.file || fixedDocs.odometer)}
                label="Odometer"
                onPreview={openPreview}
              />
            )}
            {fixedDocs.fuel && (
              <DocThumb
                src={resolveImageSrc(fixedDocs.fuel.preview || fixedDocs.fuel.file || fixedDocs.fuel)}
                label="Full Tank Fuel"
                onPreview={openPreview}
              />
            )}
            {(fixedDocs.partialFuel || []).map((fuel, i) => (
              <DocThumb
                key={i}
                src={resolveImageSrc(fuel.preview || fuel.file || fuel)}
                label={`Partial Fuel #${i + 1}`}
                onPreview={openPreview}
              />
            ))}
          </div>
        </section>

        {/* Weight Slips Table */}
        <section className="vp-card">
          <div className="vp-card-header">
            <h2 className="vp-card-title">WEIGHT SLIPS ({weightSlips.length})</h2>
            <div className={`vp-completeness-badge ${isDataComplete ? 'complete' : 'incomplete'}`}>
              {isDataComplete ? <><CheckCircle size={13} /> Complete</> : <><AlertCircle size={13} /> Incomplete</>}
            </div>
          </div>

          <div className="vp-table-wrap">
            <table className="vp-table">
              <thead>
                <tr>
                  <th>Slip</th>
                  <th>Image</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Weight</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {weightSlips.map((slip, i) => {
                  const src = resolveImageSrc(slip.file || slip);
                  const weight = slip.weights?.netWeight || slip.netWeight || slip.weight || 0;
                  const originText  = slip.origin || (slip.routeData?.sourceLocation ? `${slip.routeData.sourceLocation.city}, ${slip.routeData.sourceLocation.state}` : '—');
                  const destText    = slip.destination || (slip.routeData?.destLocation ? `${slip.routeData.destLocation.city}, ${slip.routeData.destLocation.state}` : '—');
                  return (
                    <tr key={i} className={slip.isDone ? 'vp-row-done' : 'vp-row-pending'}>
                      <td className="vp-slip-num">#{i + 1}</td>
                      <td>
                        {src
                          ? <img src={src} alt={`Slip ${i+1}`} className="vp-slip-thumb" onClick={() => openPreview(src, `Weight Slip #${i+1}`)} />
                          : <span className="vp-no-img">—</span>}
                      </td>
                      <td className="vp-loc">{originText}</td>
                      <td className="vp-loc">{destText}</td>
                      <td className="vp-weight">{weight > 0 ? `${Number(weight).toLocaleString()} kg` : '—'}</td>
                      <td>
                        {slip.isDone
                          ? <span className="vp-status-done"><CheckCircle size={13} /> Done</span>
                          : <span className="vp-status-pending">Pending</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary stat bar */}
          <div className="vp-stats-bar">
            <div className="vp-stat">
              <span className="vp-stat-val">{weightSlips.length}</span>
              <span className="vp-stat-lbl">Total Slips</span>
            </div>
            <div className="vp-stat-div" />
            <div className="vp-stat">
              <span className="vp-stat-val">{completedCount} / {weightSlips.length}</span>
              <span className="vp-stat-lbl">Completed</span>
            </div>
            <div className="vp-stat-div" />
            <div className="vp-stat">
              <span className="vp-stat-val">{Number(totalWeight).toLocaleString()} kg</span>
              <span className="vp-stat-lbl">Total Weight</span>
            </div>
            {revenueSummary.totalRevenue > 0 && (
              <>
                <div className="vp-stat-div" />
                <div className="vp-stat">
                  <span className="vp-stat-val">₹{Number(revenueSummary.totalRevenue).toLocaleString()}</span>
                  <span className="vp-stat-lbl">Total Revenue</span>
                </div>
              </>
            )}
            {profit !== 0 && (
              <>
                <div className="vp-stat-div" />
                <div className={`vp-stat ${profit >= 0 ? 'profit' : 'loss'}`}>
                  <span className="vp-stat-val">₹{Math.abs(profit).toLocaleString()}</span>
                  <span className="vp-stat-lbl">{profit >= 0 ? 'Profit' : 'Loss'}</span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── Sticky footer ── */}
      <div className="vp-footer">
        <button className="vp-btn-back" onClick={onBack} disabled={isSubmitting}>
          ← Back
        </button>
        <button
          className={`vp-btn-submit ${(!isDataComplete || isSubmitting) ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={!isDataComplete || isSubmitting}
        >
          {isSubmitting ? (
            <><span className="vp-spinner" /> Submitting…</>
          ) : (
            <><Truck size={16} /> Submit Journey</>
          )}
        </button>
      </div>

      {/* ── Success overlay ── */}
      {submitted && isSubmitting === false && <SuccessOverlay />}

      {/* Image Preview Modal */}
      {previewModal.isOpen && (
        <ImagePreviewModal
          imageSrc={previewModal.imageSrc}
          title={previewModal.title}
          onClose={closePreview}
        />
      )}
    </div>
  );
};

export default VerificationPhase;
