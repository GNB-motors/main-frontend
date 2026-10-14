import { Minus } from 'lucide-react';
import { getVarianceMeta } from '../mileageIntervalDetailFormat';

/* ── 2. Compact KPI Card ── */
const CompactKpiCard = (props) => {
  const {
    type = 'mileage',
    title,
    primaryValue,
    unit = '',
    systemValue,
    gpsValue,
    variancePct,
    extraNote,
  } = props;
  const CardIcon = props.icon;
  const meta = getVarianceMeta(variancePct);
  const VIcon = meta.Icon || Minus;

  const sysNum = systemValue != null ? Number(systemValue) : null;
  const gpsNum = gpsValue != null ? Number(gpsValue) : null;

  return (
    <div className={`mt-compact-kpi mt-compact-kpi--${type}`}>
      <div className="mt-compact-kpi__header">
        <span className="mt-compact-kpi__label">
          {CardIcon && <CardIcon size={14} />}
          <span>{title}</span>
        </span>
        {variancePct != null && (
          <span
            className="mt-compact-kpi__badge"
            style={{
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.color}33`,
            }}
          >
            <VIcon size={12} /> {meta.label}
          </span>
        )}
      </div>

      <div className="mt-compact-kpi__body">
        <span className="mt-compact-kpi__value">{primaryValue ?? '—'}</span>
        {unit && <span className="mt-compact-kpi__unit">{unit}</span>}
      </div>

      <div className="mt-compact-kpi__footer">
        <span>
          GPS:{' '}
          <strong>{gpsNum != null ? `${gpsNum.toFixed(2)}${unit ? ' ' + unit : ''}` : '—'}</strong>
        </span>
        {extraNote ? (
          <span>{extraNote}</span>
        ) : (
          <span>
            Bill:{' '}
            <strong>
              {sysNum != null ? `${sysNum.toFixed(2)}${unit ? ' ' + unit : ''}` : '—'}
            </strong>
          </span>
        )}
      </div>
    </div>
  );
};

export default CompactKpiCard;
