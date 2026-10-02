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
import BulkUploadDriversContent from './BulkUploadDriversContent.jsx';
import '../Profile/BulkUploadVehiclesPage.css';

/**
 * Bulk Upload Employees as a right-side slide-over on the Employees page, instead
 * of a separate route. Reuses the same flow component the /drivers/bulk-upload
 * page renders. `onUploaded` lets the host refresh its list after a real upload.
 */
const BulkUploadDriversPanel = ({ isOpen, onClose, onUploaded }) => {
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
              Bulk Upload Employees
            </SheetTitle>
            <SheetDescription className="mt-1 text-[13px] leading-snug text-[var(--ds-ink3)]">
              Upload employee data via .xlsx, .xls or .csv file. Map columns and preview before
              submitting.
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
          <BulkUploadDriversContent
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

export default BulkUploadDriversPanel;
