import Field from './Field.jsx';

const RADIUS_STEPS = [
  50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000, 20000, 50000,
];

export default function RadiusControl({ draft, meta, error, onChange }) {
  const steps = RADIUS_STEPS.filter((s) => s >= meta.minRadius && s <= meta.maxRadius);
  const r = Number(draft.radiusM) || meta.defaultRadius;
  const nearest = steps.reduce(
    (best, s, i) => (Math.abs(s - r) < Math.abs(steps[best] - r) ? i : best),
    0,
  );
  return (
    <Field label="Radius" error={error} hint="Or drag the circle's edge on the map.">
      <div className="ph-radius">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={nearest}
          onChange={(e) => onChange({ radiusM: steps[Number(e.target.value)] })}
          aria-label="Radius"
        />
        <span className="ph-radius-input">
          <input
            type="number"
            value={draft.radiusM}
            min={meta.minRadius}
            max={meta.maxRadius}
            onChange={(e) =>
              onChange({ radiusM: e.target.value === '' ? '' : Number(e.target.value) })
            }
            aria-label="Radius in metres"
          />
          m
        </span>
      </div>
    </Field>
  );
}
