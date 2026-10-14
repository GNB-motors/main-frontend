import { AlertTriangle, Ban, CheckCircle2, Info } from 'lucide-react';

const PlacementVerdict = ({ checking, hardBlocks, fieldBlocks, check }) => (
  <>
    {checking && (
      <div className="erp-callout info">
        <Info size={16} />
        <span>Checking…</span>
      </div>
    )}

    {hardBlocks.map((b) => (
      <div className="erp-callout danger" key={b.code}>
        <Ban size={16} />
        <span>
          <strong>Blocked:</strong> {b.message}
        </span>
      </div>
    ))}

    {fieldBlocks.map((b) => (
      <div className="erp-callout info" key={b.code}>
        <Info size={16} />
        <span>{b.message}</span>
      </div>
    ))}

    {check?.warnings?.map((w) => (
      <div className="erp-callout warning" key={w.code}>
        <AlertTriangle size={16} />
        <span>
          <strong>{w.code === 'TIGHT_TURNAROUND' ? 'Manager override:' : 'Needs approval:'}</strong>{' '}
          {w.message}
        </span>
      </div>
    ))}

    {check?.info?.map((i) => (
      <div className="erp-callout info" key={i.code}>
        <Info size={16} />
        <span>{i.message}</span>
      </div>
    ))}

    {check?.canPlace && !check.needsApproval && (
      <div className="erp-callout success">
        <CheckCircle2 size={16} />
        <span>Nothing blocking — this will be assigned straight away.</span>
      </div>
    )}
  </>
);

export default PlacementVerdict;
