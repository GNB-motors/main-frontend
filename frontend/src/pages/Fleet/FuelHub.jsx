import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import FleetHub from '../../components/Fleet/FleetHub.jsx';

import MileageTrackingPage from '../MileageTracking/MileageTrackingPage.jsx';
import AdBlueTrackingPage from '../MileageTracking/AdBlueTrackingPage.jsx';
import FieldAgentFuelPage from '../FieldAgentFuel/FieldAgentFuelPage.jsx';
import FuelIntegrityPage from '../FuelIntegrity/FuelIntegrityPage.jsx';
import FuelComparisonPage from '../FuelComparison/FuelComparisonPage.jsx';
import FuelSpendPage from '../FuelSpend/FuelSpendPage.jsx';
import DefLedgerPage from '../DefLedger/DefLedgerPage.jsx';

/**
 * FuelHub — the twelve fuel surfaces, reorganised into three tabs.
 *
 * The old sidebar had seven fuel rows (plus five more screens reachable only
 * from inside them). They were grouped by DATA SOURCE, which is why "AdBlue"
 * and "DEF Ledger" sat next to each other as separate rows despite AdBlue
 * being the trade name for diesel exhaust fluid — the same substance, twice,
 * under two names the user has to reconcile.
 *
 * These tabs group by JOB instead:
 *   Logs   — record what happened   (mileage, AdBlue, field-agent uploads)
 *   Checks — is it honest?          (integrity, comparison)
 *   Costs  — what did it cost?      (spend, AdBlue cost ledger)
 *
 * Fuel type is a facet inside a tab, not a destination. So AdBlue stops being
 * a parallel product and becomes a filter, which is what it always was.
 *
 * Each tab embeds the existing page unchanged via `embedded` — no page was
 * rewritten, they just stop drawing their own header and outer padding.
 */

const SEARCHABLE = new Set(['mileage', 'adblue']);

const FuelSearch = ({ value, onChange }) => (
  <label className="fleet-search" title="Search by vehicle">
    <Search size={15} />
    <input
      type="search"
      value={value}
      placeholder="Search vehicle…"
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search fuel logs by vehicle"
    />
  </label>
);

const FuelHub = () => {
  const navigate = useNavigate();
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');

  // Debounce once, here, so the embedded pages receive a settled query and
  // don't each re-implement it. AdBlueTrackingPage bypasses its own debounce
  // when embedded for exactly this reason.
  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const tabs = [
    {
      id: 'logs',
      label: 'Logs',
      defaultFacet: 'mileage',
      facets: [
        { id: 'mileage', label: 'Mileage' },
        { id: 'adblue', label: 'AdBlue' },
        { id: 'field', label: 'Field entries' },
      ],
      // Field entries has its own vehicle+date filter set, so the shared
      // search would be a second, conflicting control on that facet.
      toolbar: ({ facet }) =>
        SEARCHABLE.has(facet) ? <FuelSearch value={rawSearch} onChange={setRawSearch} /> : null,
      render: ({ facet }) => {
        if (facet === 'adblue') return <AdBlueTrackingPage embedded search={search} />;
        if (facet === 'field') return <FieldAgentFuelPage embedded />;
        return <MileageTrackingPage embedded search={search} />;
      },
    },
    {
      id: 'checks',
      label: 'Checks',
      defaultFacet: 'integrity',
      facets: [
        { id: 'integrity', label: 'Fuel integrity' },
        { id: 'comparison', label: 'Bill vs telemetry' },
      ],
      render: ({ facet }) =>
        facet === 'comparison' ? <FuelComparisonPage embedded /> : <FuelIntegrityPage embedded />,
    },
    {
      id: 'costs',
      label: 'Costs',
      defaultFacet: 'spend',
      facets: [
        { id: 'spend', label: 'Fuel spend' },
        { id: 'adblue', label: 'AdBlue costs' },
      ],
      render: ({ facet }) => (facet === 'adblue' ? <DefLedgerPage embedded /> : <FuelSpendPage embedded />),
    },
  ];

  return (
    <FleetHub
      title="Fuel"
      subtitle="Fuel and AdBlue logs, integrity checks, and what it all cost"
      breadcrumbs={[{ label: 'Fleet' }, { label: 'Fuel' }]}
      defaultTab="logs"
      tabs={tabs}
      actions={
        <>
          <Link className="ov-btn" to="/reports?r=mileageIntervals">View mileage report</Link>
          <button type="button" className="ov-btn ov-btn--primary" onClick={() => navigate('/mileage-tracking/new')}>
            <Plus size={15} /> Log fuel
          </button>
        </>
      }
    />
  );
};

export default FuelHub;
