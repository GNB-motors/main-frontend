import { Wrench, Route as RouteIcon, FileWarning } from 'lucide-react';

// "insp" (inspection) intentionally omitted — no inspection/roadworthiness
// scheduling exists anywhere in the backend, so getFleetCalendar can never
// emit that event type.
export const EVT_COLOR = {
  trip: 'var(--nova-rage-400)',
  service: '#C56200',
  doc: '#C2323A',
};

// The calendar bars' colours: the first stop of each .nd-ev--* gradient in
// styles/nova/novaDesignSystem.css. The legend must show these.
export const EVT_BAR_COLOR = {
  trip: '#2563eb',
  service: '#d97706',
  doc: '#dc2626',
};

export const EVT_ICON = {
  trip: RouteIcon,
  service: Wrench,
  doc: FileWarning,
};
