import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Clock, Lock, Zap,
} from 'lucide-react';

const TONE_ICON = {
  act: Zap,
  wait: Clock,
  blocked: Lock,
  done: CheckCircle2,
};

/**
 * The "what can I do right now" hero card. One next step, always on screen,
 * with the blocked reason spelled out when the step is waiting on something —
 * so the operator never has to scan the whole lifecycle to know what is next.
 */
const CurrentActionCard = ({ action, onDrawer }) => {
  const navigate = useNavigate();
  if (!action) return null;
  const Icon = TONE_ICON[action.tone] || Zap;

  const handleCta = () => {
    if (!action.cta) return;
    if (action.cta.drawer) onDrawer(action.cta.drawer);
    else if (action.cta.route) navigate(action.cta.route);
  };

  return (
    <section className={`trip360-action trip360-action--${action.tone}`}>
      <span className="trip360-action-icon">
        <Icon size={18} />
      </span>
      <div className="trip360-action-body">
        <div className="trip360-action-head">
          <strong>{action.title}</strong>
          {action.accountsOnly && <span className="trip360-accounts-only">Accounts only</span>}
        </div>
        {action.detail && <p className="trip360-action-detail">{action.detail}</p>}
      </div>
      {action.cta && (
        <button type="button" className="trip360-btn primary trip360-action-cta" onClick={handleCta}>
          {action.cta.label}
          <ArrowRight size={15} />
        </button>
      )}
    </section>
  );
};

export default CurrentActionCard;
