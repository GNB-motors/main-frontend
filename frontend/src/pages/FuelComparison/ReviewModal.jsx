import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Gauge } from 'lucide-react';
import dayjs from 'dayjs';
import { ReportsService } from '../Reports/ReportsService.jsx';
import { IST_ZONE } from './formatIST';

const ReviewModal = ({ task, onClose, onApproved }) => {
  const [fromDate, setFromDate] = useState(
    task?.fromDate ? dayjs.utc(task.fromDate).tz(IST_ZONE).format('YYYY-MM-DDTHH:mm') : '',
  );
  const [toDate, setToDate] = useState(
    task?.toDate ? dayjs.utc(task.toDate).tz(IST_ZONE).format('YYYY-MM-DDTHH:mm') : '',
  );
  const [odometerReading, setOdometerReading] = useState(task?.ocrOdometerReading ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setSaving(true);
    setError('');
    try {
      const updates = {};
      if (fromDate) updates.fromDate = dayjs.tz(fromDate, IST_ZONE).utc().toISOString();
      if (toDate) updates.toDate = dayjs.tz(toDate, IST_ZONE).utc().toISOString();
      if (odometerReading !== '') updates.odometerReading = parseFloat(odometerReading);
      await ReportsService.approveReviewTask(task._id, updates);
      onApproved();
    } catch (err) {
      setError(err.detail || 'Failed to approve task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge size={18} /> Review Odometer Task —{' '}
            {task?.vehicleId?.registrationNumber || task?.vehicleNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          {/* Document photo */}
          {task?.odometerDoc?.publicUrl && (
            <div className="mb-4">
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                Odometer document photo
              </p>
              <img
                src={task.odometerDoc.publicUrl}
                alt="Odometer"
                style={{
                  width: '100%',
                  maxHeight: 260,
                  objectFit: 'contain',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
              />
              {task.odometerDoc.ocrData?.confidence != null && (
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  OCR confidence: {task.odometerDoc.ocrData.confidence}% · Status:{' '}
                  {task.odometerDoc.ocrData.processingStatus}
                </p>
              )}
            </div>
          )}

          <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{task?.reviewReason}</p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="review-from-date">From Date (IST)</Label>
              <Input
                id="review-from-date"
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="review-to-date">To Date (IST)</Label>
              <Input
                id="review-to-date"
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="review-odometer">Corrected Odometer Reading (km)</Label>
              <Input
                id="review-odometer"
                type="number"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                className="h-8"
              />
              <p className="text-xs text-muted-foreground">
                FleetEdge reports: {task?.maxOdometer ?? '—'} km
              </p>
            </div>
          </div>
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={saving}>
            {saving ? 'Approving…' : 'Approve & Release'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
