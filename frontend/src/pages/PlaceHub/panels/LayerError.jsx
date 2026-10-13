import { CircleAlert } from 'lucide-react';

export default function LayerError({ errors, what = 'places' }) {
  const failed = Object.entries(errors).filter(([, e]) => e);
  if (!failed.length) return null;
  return (
    <p className="ph-layer-error" role="status">
      <CircleAlert size={13} /> Some {what} could not load ({failed.map(([k]) => k).join(', ')}).
      What loaded is shown.
    </p>
  );
}
