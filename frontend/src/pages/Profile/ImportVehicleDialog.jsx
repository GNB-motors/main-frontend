import { Truck, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import NewButton from '@/components/ui/NewButton';

/**
 * Shown when the entered registration number already belongs to a vehicle
 * elsewhere in the enterprise — offers importing it into the current location
 * instead of creating a duplicate.
 */
export const ImportVehicleDialog = ({ candidate, importing, onCancel, onConfirm }) => (
  <Dialog
    open={!!candidate}
    onOpenChange={(o) => {
      if (!o && !importing) onCancel();
    }}
  >
    <DialogContent className="max-w-md p-0">
      <DialogHeader>
        <DialogTitle>Import existing vehicle</DialogTitle>
        <DialogDescription>
          This registration number already belongs to a vehicle in your enterprise. Import it into
          the current location instead of creating a duplicate — it becomes active here and is
          deactivated in its previous location.
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 py-4">
        {candidate && (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck size={18} />
            </div>
            <div className="text-sm">
              <div className="font-semibold">{candidate.registrationNumber}</div>
              <div className="text-muted-foreground">
                {[candidate.manufacturer, candidate.model].filter(Boolean).join(' ') ||
                  candidate.vehicleType ||
                  '—'}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Building2 size={13} />
                Currently in: {candidate.homeBranch?.name || 'Enterprise'}
              </div>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Its existing records stay with its previous location (history isn't moved).
        </p>
      </div>

      <DialogFooter>
        <NewButton
          variant="secondary"
          size="md"
          type="button"
          text="Cancel"
          onClick={onCancel}
          disabled={importing}
        />
        <NewButton
          variant="primary"
          size="md"
          type="button"
          text="Import to this location"
          onClick={onConfirm}
          loading={importing}
        />
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
