import { Check } from 'lucide-react';
import { formatINR } from '../../../utils/formatters';
import { onActivateKey } from '../../../utils/onActivateKey';
import { BRIEF_SECTION, BRIEF_FALLBACK } from './briefSections';

export default function NdBriefCard({ section, onOpenVehicle }) {
  const meta = BRIEF_SECTION[section.key] || BRIEF_FALLBACK;
  const vehicles = section.vehicles || [];
  const Icon = meta.icon;

  return (
    <div className="nd-card nd-opcard" style={{ '--c': meta.c }}>
      <div className="nd-card-head">
        <h2>{section.label}</h2>
        <span className="nd-sp" />
        <span className="nd-hint">Today · top 5 vehicles</span>
      </div>
      {section.status !== 'ok' ? (
        <div className="nd-empty">
          <span className="nd-ok">
            <Check size={22} />
          </span>
          <b>Clean today</b>
          <span>{meta.clean}</span>
        </div>
      ) : (
        <>
          <div className="nd-big">
            <span className="nd-v" style={{ color: meta.c }}>
              {formatINR(section.rupees)}
            </span>
            <span className="nd-u">
              <Icon size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              {meta.sub}
            </span>
          </div>
          <table className="nd-tbl">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>{meta.col}</th>
                <th className="nd-num">Cost today</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr
                  key={v.registrationNumber}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenVehicle(v.registrationNumber)}
                  onKeyDown={onActivateKey(() => onOpenVehicle(v.registrationNumber))}
                >
                  <td>
                    <span className="nd-plate">{v.registrationNumber}</span>
                  </td>
                  <td className="nd-muted">{meta.detail(v)}</td>
                  <td className="nd-num" style={{ color: meta.c }}>
                    {formatINR(v.rupees)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
