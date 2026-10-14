import { MousePointerClick } from 'lucide-react';

export default function DraftHint({ draft }) {
  return (
    <div className="ph-draft-hint" role="status">
      <MousePointerClick size={15} />
      {draft.shape === 'polygon'
        ? draft.polygonDone
          ? 'Outline closed. Save, or clear it to redraw.'
          : 'Click the map to add corners. Click the first corner to close.'
        : draft.center
          ? 'Drag the pin to move it, drag the circle edge to resize.'
          : 'Click the map to drop the pin.'}
    </div>
  );
}
