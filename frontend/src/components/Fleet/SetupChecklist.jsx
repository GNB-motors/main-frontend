import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import apiClient from '../../utils/axiosConfig';
import { GeofenceService } from '../../services/GeofenceService.jsx';
import { ReportsService } from '../../pages/Reports/ReportsService.jsx';
import { useOrganization } from '../../contexts/FeatureFlagsContext.jsx';

/**
 * SetupChecklist — what a brand-new org sees instead of a wall of zeros.
 *
 * Before this, a fresh account landed on six KPI tiles reading 0, a health
 * score with no explanation, an "Est. Waste" tile in critical red showing ₹0,
 * an empty action centre and a map with no pins. Everything technically
 * correct, and nothing to do about any of it. The product looked broken rather
 * than empty, and there was no first step anywhere on screen.
 *
 * It renders only when the live map has no positions, so an established fleet
 * never pays for these four requests. That gate is deliberately "no positions"
 * rather than "no vehicles": an org that added trucks but has not connected
 * FleetEdge also sees an empty map, and needs exactly this list to find out
 * why. Each row then reports its own real state, so the checklist explains
 * which of the two situations it is.
 */

const useCount = () => {
  const [state, setState] = useState({ loading: true, vehicles: 0, drivers: 0, accounts: 0, zones: 0 });

  useEffect(() => {
    let cancelled = false;
    const num = (r) => r?.data?.meta?.total ?? (Array.isArray(r?.data?.data) ? r.data.data.length : 0);

    Promise.all([
      apiClient.get('/api/vehicles', { params: { limit: 1 } }).catch(() => null),
      apiClient.get('/api/employees', { params: { limit: 1 } }).catch(() => null),
      ReportsService.getFleetEdgeConnectivity().catch(() => null),
      GeofenceService.getZones({ limit: 1 }).catch(() => null),
    ]).then(([v, d, conn, zones]) => {
      if (cancelled) return;
      setState({
        loading: false,
        vehicles: num(v),
        drivers: num(d),
        accounts: (conn?.accounts || []).length,
        zones: zones?.total ?? (zones?.zones || []).length,
      });
    });

    return () => { cancelled = true; };
  }, []);

  return state;
};

const Step = ({ done, title, hint, to, cta }) => (
  <li className="setup-step" data-done={done ? 'true' : undefined}>
    <span className="setup-step__mark" aria-hidden="true">
      {done ? <Check size={12} /> : null}
    </span>
    <span className="setup-step__body">
      <span className="setup-step__title">{title}</span>
      {hint && <span className="setup-step__hint">{hint}</span>}
    </span>
    {done ? (
      <span className="setup-step__done">Done</span>
    ) : (
      <Link to={to} className="setup-step__cta">
        {cta} <ArrowRight size={13} />
      </Link>
    )}
  </li>
);

const SetupChecklist = () => {
  const { organization } = useOrganization();
  const { loading, vehicles, drivers, accounts, zones } = useCount();

  if (loading) {
    return (
      <div className="setup-card">
        <p className="text-dim flex items-center gap-2 text-sm">
          <Loader2 size={15} className="animate-spin" /> Checking your setup…
        </p>
      </div>
    );
  }

  const steps = [
    {
      done: Boolean(organization?.companyName),
      title: 'Company profile',
      hint: 'Your business name and branding',
      to: '/profile',
      cta: 'Open',
    },
    {
      done: vehicles > 0,
      title: 'Add your first vehicle',
      hint: vehicles > 0 ? `${vehicles} in the fleet` : 'Nothing can be tracked until a vehicle exists',
      to: '/vehicles/add',
      cta: 'Add vehicle',
    },
    {
      done: accounts > 0,
      title: 'Connect FleetEdge',
      hint: accounts > 0
        ? `${accounts} account${accounts === 1 ? '' : 's'} connected`
        : 'This is what puts vehicles on the map',
      to: '/settings/fleetedge-accounts',
      cta: 'Connect',
    },
    {
      done: drivers > 0,
      title: 'Add drivers',
      hint: drivers > 0 ? `${drivers} on record` : 'So trips and fuel can be attributed to someone',
      to: '/drivers/add',
      cta: 'Add driver',
    },
    {
      done: zones > 0,
      title: 'Draw your first geofence zone',
      hint: zones > 0 ? `${zones} zone${zones === 1 ? '' : 's'}` : 'Get told when a vehicle enters or leaves',
      to: '/fleet/places?tab=zones',
      cta: 'Draw zone',
    },
  ];

  const remaining = steps.filter((s) => !s.done).length;

  return (
    <div className="setup-card">
      <h2 className="cluster-title text-lg">
        {vehicles === 0 ? 'Let’s get your fleet on the map' : 'Your map is empty'}
      </h2>
      <p className="text-dim mt-1 text-sm">
        {vehicles === 0
          ? 'Five short steps. You can do them in any order.'
          : accounts === 0
            ? 'You have vehicles, but no FleetEdge account is connected yet — that is what sends their positions.'
            : 'No vehicle has reported a position yet. This can take a few minutes after connecting.'}
      </p>

      <ol className="setup-steps">
        {steps.map((s) => <Step key={s.title} {...s} />)}
      </ol>

      {remaining === 0 && (
        <p className="text-dim mt-3 text-xs">
          Setup is complete — positions will appear here as soon as your vehicles report.
        </p>
      )}
    </div>
  );
};

export default SetupChecklist;
