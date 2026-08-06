import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Replaces the hand-rolled `fixed inset-0 z-[10000]` overlays this feature used
 * to ship. Those painted *under* the Dialog primitive (z-[10050]) and had no
 * focus trap, Esc handling, or scroll lock.
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'destructive',
}) => {
  const [working, setWorking] = useState(false);

  const handleConfirm = async () => {
    setWorking(true);
    try {
      await onConfirm();
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !working) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={onClose} disabled={working}>
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={working}
            className={
              tone === 'destructive'
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }
          >
            {working ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
