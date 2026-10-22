import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowUpRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../../components/ui/button';
import useApi from '../../../hooks/useApi';
import useMutation from '../../../hooks/useMutation';
import { getUserRole } from '../../../utils/session';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SapRequestState from '../../Sap/SapRequestState';
import { canEditSap, kmText } from '../../Sap/sapModel';
import { minutesLabel } from './model/unitLabels';
export default function DeliveryRouteDetail({ id, onChanged }) {
  const q = useApi((signal) => PlaceIntelligenceService.getDeliveryLeg(id, { signal }), [id]);
  const m = useMutation(PlaceIntelligenceService.reviewDeliveryLeg);
  const [note, setNote] = useState('');
  const [limit, setLimit] = useState(5);
  const act = async (status) => {
    try {
      await m.mutate({ id, status, note });
      toast.success('Route review saved');
      q.refetch();
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not review route');
    }
  };
  const samples = q.data?.samples || [];
  return (
    <div className="sap-panel sap-sample-detail">
      <SapRequestState query={q}>
        {canEditSap(getUserRole()) && (
          <div className="sap-toolbar">
            <label className="sap-field" style={{ flex: 1, minWidth: 200 }}>
              Review note (optional)
              <input
                aria-label="Review note (optional)"
                placeholder="Add context for this route…"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <div className="sap-row">
              <Button size="sm" disabled={m.loading} onClick={() => act('ACCEPTED')}>
                <Check size={14} />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={m.loading}
                onClick={() => act('REJECTED')}
              >
                <X size={14} />
                Reject
              </Button>
            </div>
          </div>
        )}
        <div className="sap-toolbar">
          <h3>Trips on this route</h3>
          <span className="sap-muted">{samples.length} samples available</span>
        </div>
        {!samples.length ? (
          <p className="sap-muted">No samples available.</p>
        ) : (
          <div className="sap-scroll">
            <table>
              <thead>
                <tr>
                  <th>Truck / trip</th>
                  <th>Left plant</th>
                  <th>Distance</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {samples.slice(0, limit).map((s) => (
                  <tr key={s.autoTripId || `${s.registrationNumber}:${s.departedAt}`}>
                    <td>
                      <Link className="sap-link" to={`/auto-trips/${s.autoTripId}`}>
                        {s.registrationNumber || 'Open trip'}
                        <ArrowUpRight size={12} aria-hidden="true" />
                      </Link>
                    </td>
                    <td>
                      {s.departedAt
                        ? new Date(s.departedAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                          })
                        : '—'}
                    </td>
                    <td>{kmText(s.km)}</td>
                    <td>{minutesLabel(s.minutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {samples.length > limit && (
          <Button variant="outline" size="sm" onClick={() => setLimit((n) => n + 10)}>
            Show more trips ({samples.length - limit} remaining)
          </Button>
        )}
      </SapRequestState>
    </div>
  );
}
