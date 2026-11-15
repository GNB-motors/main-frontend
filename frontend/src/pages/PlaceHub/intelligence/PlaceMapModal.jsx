import { X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PlaceMiniMap from './PlaceMiniMap.jsx';

/**
 * A place shown in a modal: its point on a map (with a tooltip) beside a facts
 * list, with optional action buttons in the footer. Shared by the driver-home
 * and facility tabs. Controlled via `open` / `onOpenChange`.
 */
export default function PlaceMapModal({
  open,
  onOpenChange,
  icon,
  title,
  subtitle,
  lat,
  lng,
  label,
  children,
  footer,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <DialogHeader className="relative pr-10">
          <div className="pi-modal-title">
            {icon ? <span className="pi-modal-ico">{icon}</span> : null}
            <div>
              <DialogTitle>{title}</DialogTitle>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>
          <DialogClose
            aria-label="Close"
            className="absolute right-4 top-4 text-[var(--ds-ink3)] transition-colors hover:text-[var(--ds-ink)]"
          >
            <X size={18} />
          </DialogClose>
        </DialogHeader>

        <div className="pi-modal-body">
          <PlaceMiniMap key={`${lat},${lng}`} lat={lat} lng={lng} label={label} />
          <div className="pi-modal-side">{children}</div>
        </div>

        {footer ? <div className="pi-modal-foot">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
