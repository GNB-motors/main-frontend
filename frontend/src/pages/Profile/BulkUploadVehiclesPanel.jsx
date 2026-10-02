import React from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import BulkUploadVehiclesContent from './BulkUploadVehiclesContent.jsx';
import './BulkUploadVehiclesPage.css';

/**
 * Bulk Upload Vehicles as a right-side slide-over on the Vehicles page, instead
 * of a separate route. Reuses the same flow component the /vehicles/bulk-upload
 * page renders. `onUploaded` lets the host refresh its list after a real upload.
 */
const BulkUploadVehiclesPanel = ({ isOpen, onClose, onUploaded }) => {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full !max-w-[min(960px,96vw)] gap-0 p-0">
        <SheetHeader className="shrink-0 items-start gap-4 border-b border-[var(--ds-line)] bg-white px-6 py-4">
          <div className="min-w-0">
            <SheetTitle className="text-[16px] font-semibold text-[var(--ds-ink)]">
              Bulk Upload Vehicles
            </SheetTitle>
            <SheetDescription className="mt-1 text-[13px] leading-snug text-[var(--ds-ink3)]">
              Upload a .xlsx, .xls or .csv with headers Vehicle No, Model, Chassis No. Use dry-run
              to preview before writing.
            </SheetDescription>
          </div>
          <SheetClose
            className="-mr-1 mt-0.5 shrink-0 rounded-md p-1.5 text-[var(--ds-ink3)] transition-colors hover:bg-[var(--ds-sunk)] hover:text-[var(--ds-ink)]"
            aria-label="Close"
          >
            <X size={18} />
          </SheetClose>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <BulkUploadVehiclesContent
            variant="panel"
            onCompleted={() => {
              onUploaded?.();
              onClose();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BulkUploadVehiclesPanel;
