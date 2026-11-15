import { Pencil } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { BASIS_LABEL, kmText, signed } from '../../Sap/sapModel';
import { compareBars, sapDelta } from './model/deliveryRoutesModel';

/** Learned distance against the agreed SAP, with the edit action beside it. */
export default function DeliverySapCard({ route, onEdit }) {
  const sap = route.sap;
  const comparison = sap?.comparison;
  const roundTrip = sap?.basis === 'ROUND_TRIP';
  const learnedKm = roundTrip ? route.roundTripKm?.p50 : route.km?.p50;
  const bars = compareBars(learnedKm, sap?.sapKm);
  const delta = sapDelta(route);
  const message = !sap
    ? 'SAP not set. Enter the distance agreed with your customer.'
    : !route.n
      ? 'SAP is saved. Waiting for this route’s first trip.'
      : comparison?.verdict === 'NO_KM'
        ? 'More distance evidence is needed. Missing return km is not treated as zero.'
        : `${signed(comparison?.deltaKm, ' km')}${delta?.pct ? ` (${delta.pct})` : ''} versus SAP · ${sap.tolerancePct ?? 10}% tolerance`;
  return (
    <section className="ph-delivery-sapcard" aria-label="SAP comparison">
      <div className="ph-delivery-sapcard-head">
        <span className="ph-eyebrow">{roundTrip ? 'Round trip' : 'One way · loaded'}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          aria-label={sap ? 'Edit SAP distance' : 'Set SAP distance'}
        >
          <Pencil size={13} />
          {sap ? 'Edit' : 'Set SAP'}
        </Button>
      </div>
      <div className="ud-compare-grid">
        <strong>
          <small>Typical learned</small>
          {kmText(learnedKm)}
        </strong>
        <strong>
          <small>Agreed SAP{sap ? ` · ${BASIS_LABEL[sap.basis] || ''}` : ''}</small>
          {kmText(sap?.sapKm)}
        </strong>
      </div>
      {bars && (
        <div className="ud-bars" aria-hidden="true">
          <span
            className={`ud-bar ud-bar--learned ud-bar--${delta?.tone || 'none'}`}
            style={{ width: `${bars.learned}%` }}
          />
          <span className="ud-bar ud-bar--sap" style={{ width: `${bars.sap}%` }} />
        </div>
      )}
      <p className={delta ? `ud-delta ud-delta--${delta.tone}` : 'ph-muted'}>{message}</p>
      {roundTrip && (
        <p className="ph-muted">
          {route.roundTripKm?.n || 0} of {route.n} trips have loaded + return distance.
        </p>
      )}
    </section>
  );
}
