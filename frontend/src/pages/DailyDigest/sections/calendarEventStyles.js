import { Wrench, Route as RouteIcon, FileWarning } from 'lucide-react';

// "insp" (inspection) intentionally omitted — no inspection/roadworthiness
// scheduling exists anywhere in the backend, so getFleetCalendar can never
// emit that event type.
export const EVT_COLOR = {
  trip: 'var(--nova-rage-400)',
  service: '#C56200',
  doc: '#C2323A',
};

export const EVT_ICON = {
  trip: RouteIcon,
  service: Wrench,
  doc: FileWarning,
};
