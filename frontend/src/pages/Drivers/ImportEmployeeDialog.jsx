import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { UserPlus, Building2 } from 'lucide-react';
import NewButton from '@/components/ui/NewButton';

/** Import Employee — shown when the phone already exists in the enterprise. */
const ImportEmployeeDialog = ({
  importCandidate,
  setImportCandidate,
  importing,
  confirmImport,
}) => (
  <Dialog
    open={!!importCandidate}
    onOpenChange={(o) => {
      if (!o && !importing) setImportCandidate(null);
    }}
  >
    <DialogContent className="max-w-md p-0">
      <DialogHeader>
        <DialogTitle>Import existing employee</DialogTitle>
        <DialogDescription>
          This phone number already belongs to an employee in your enterprise. Import them into the
          current location instead of creating a duplicate — they become active here and are
          deactivated in their previous location.
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 py-4">
        {importCandidate && (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserPlus size={18} />
            </div>
            <div className="text-sm">
              <div className="font-semibold">
                {[importCandidate.firstName, importCandidate.lastName].filter(Boolean).join(' ') ||
                  'Employee'}
              </div>
              <div className="text-muted-foreground">{importCandidate.mobileNumber}</div>
              <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Building2 size={13} />
                Home: {importCandidate.homeBranch?.name || 'Enterprise'}
              </div>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Their existing records stay with their previous location (history isn&apos;t moved). They
          become
          <strong> active in this location</strong>, and <strong>deactivated</strong> in the
          previous one — where they can no longer be assigned anything.
        </p>
      </div>

      <DialogFooter>
        <NewButton
          variant="secondary"
          size="md"
          type="button"
          text="Cancel"
          onClick={() => setImportCandidate(null)}
          disabled={importing}
        />
        <NewButton
          variant="primary"
          size="md"
          type="button"
          text="Import to this location"
          onClick={confirmImport}
          loading={importing}
        />
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ImportEmployeeDialog;
