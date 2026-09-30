import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Wrench,
  Truck,
  Calendar,
  DollarSign,
  FileText,
  UserCheck,
} from 'lucide-react';
import { classifyIssuePriority } from '../serviceIntelligenceLogic';

export default function ResolveIssueModal({ isOpen, onClose, targetItem, onConfirmResolve }) {
  const [workshop, setWorkshop] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [finalCost, setFinalCost] = useState(0);
  const [resolveDate, setResolveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (targetItem) {
      setWorkshop(targetItem.workshop || '');
      setResolutionNote('');
      setFinalCost(targetItem.amount || 0);
      setResolveDate(new Date().toISOString().split('T')[0]);
    }
  }, [targetItem]);

  if (!isOpen || !targetItem) return null;

  const isAlert = Boolean(targetItem.fingerprint);
  const priority = !isAlert ? classifyIssuePriority(targetItem) : null;
  const vehicleReg = targetItem.vehicleReg || targetItem.vehicleId?.registrationNumber || 'Vehicle';
  const vehicleModel = targetItem.model || targetItem.vehicleId?.model || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await onConfirmResolve({
        targetItem,
        workshop: workshop.trim(),
        resolutionNote: resolutionNote.trim(),
        amount: Number(finalCost) || 0,
        resolveDate,
      });
      onClose();
    } catch (err) {
      console.error('Resolve error', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="si-modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolve-modal-title"
      tabIndex={-1}
    >
      <div
        className="si-modal-box"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Modal Header */}
        <div className="si-modal-header">
          <div className="si-modal-header-icon">
            <CheckCircle2 size={24} color="#16a34a" />
          </div>
          <div className="si-modal-header-text">
            <h3 id="resolve-modal-title" className="si-modal-title">
              {isAlert ? 'Resolve Fleet Alert' : 'Mark Issue as Resolved'}
            </h3>
            <p className="si-modal-sub">
              Document repairs, mechanic notes, and final costs before returning vehicle to service.
            </p>
          </div>
          <button
            type="button"
            className="si-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Issue Target Context Card */}
        <div className="si-modal-context-card">
          <div className="si-modal-context-top">
            <div className="si-modal-veh-plate">
              <Truck size={14} />
              <span>{vehicleReg}</span>
            </div>
            {vehicleModel && <span className="si-modal-veh-model">{vehicleModel}</span>}

            {priority && (
              <span
                className="si-priority-badge"
                style={{
                  background: priority.bg,
                  color: priority.color,
                  borderColor: priority.border,
                  marginLeft: 'auto',
                }}
              >
                {priority.code === 'P0' ? (
                  <AlertOctagon size={12} />
                ) : priority.code === 'P1' ? (
                  <AlertTriangle size={12} />
                ) : (
                  <Wrench size={12} />
                )}
                <span>{priority.label}</span>
              </span>
            )}
          </div>

          <div className="si-modal-context-issue">
            <span className="si-modal-issue-label">
              {isAlert ? 'Alert Description:' : 'Reported Issue / Work:'}
            </span>
            <span className="si-modal-issue-desc">
              {targetItem.description ||
                targetItem.notes ||
                targetItem.type ||
                'Breakdown reported'}
            </span>
          </div>
        </div>

        {/* Resolve Form */}
        <form onSubmit={handleSubmit} className="si-modal-form">
          {!isAlert && (
            <div className="si-form-row">
              <div className="si-form-group">
                <label className="si-form-label" htmlFor="si-workshop-input">
                  <UserCheck size={13} /> Workshop / Mechanic Name
                </label>
                <input
                  id="si-workshop-input"
                  type="text"
                  className="si-form-input"
                  value={workshop}
                  onChange={(e) => setWorkshop(e.target.value)}
                  placeholder="e.g. Tata Authorized Workshop, Highway Repair Hub"
                  required
                />
              </div>

              <div className="si-form-group">
                <label className="si-form-label" htmlFor="si-cost-input">
                  <DollarSign size={13} /> Final Repair Cost (₹)
                </label>
                <input
                  id="si-cost-input"
                  type="number"
                  min="0"
                  step="1"
                  className="si-form-input"
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                  placeholder="e.g. 8500"
                  required
                />
              </div>
            </div>
          )}

          <div className="si-form-group">
            <label className="si-form-label" htmlFor="si-resolution-textarea">
              <FileText size={13} /> Resolution Summary &amp; Parts Replaced{' '}
              <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="si-resolution-textarea"
              className="si-form-textarea"
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Replaced rear axle shaft with OEM parts. Greased bearings and test drive completed. Vehicle roadworthy."
              required
            />
          </div>

          <div className="si-form-group">
            <label className="si-form-label" htmlFor="si-resolve-date-input">
              <Calendar size={13} /> Resolution Date
            </label>
            <input
              id="si-resolve-date-input"
              type="date"
              className="si-form-input"
              value={resolveDate}
              onChange={(e) => setResolveDate(e.target.value)}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="si-modal-actions">
            <button
              type="button"
              className="si-btn si-btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="si-btn si-btn--success"
              disabled={submitting || !resolutionNote.trim()}
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Resolving…' : 'Mark as Resolved & Roadworthy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
