import React, { useEffect, useState } from 'react';
import { PageHeader } from '../Drivers/Component';
import EnterpriseRolesTab from './EnterpriseRolesTab';
import BranchAccessTab from './BranchAccessTab';
import { useActiveBranch } from '../../contexts/BranchContext';
import '../Superadmin/components/FeatureFlags.css';
import '../Superadmin/components/Rbac.css';
import './AccessControl.css';

/**
 * Employee Access Control — the enterprise-facing RBAC screen.
 *  - At the enterprise scope ("All locations"): Enterprise Roles + Branch Access.
 *  - Inside a location: only Branch Access applies, so the Enterprise Roles tab is
 *    hidden and Branch Access is shown for the active location directly.
 */
const AccessControlPage = () => {
  const { branchId, activeBranch } = useActiveBranch();
  const insideBranch = !!branchId;
  const [tab, setTab] = useState('enterprise');

  // Follow the header scope: a selected location forces Branch Access; switching
  // back to "All locations" restores the enterprise view.
  useEffect(() => { setTab(insideBranch ? 'branch' : 'enterprise'); }, [insideBranch]);

  return (
    <div className="ff-page">
      <PageHeader
        currentLabel="Employee Access Control"
        title="Employee Access Control"
        description={insideBranch
          ? `Role access for ${activeBranch?.name || 'this location'}. Switch to “All locations” to manage enterprise roles.`
          : 'Control the permissions accessible by different employee roles across your enterprise.'}
      />

      {/* The tab switcher only makes sense at the enterprise scope. Inside a
          location there is a single view (Branch Access), so no tabs are shown. */}
      {!insideBranch && (
        <div className="ac-tabs">
          <button
            type="button"
            className={`ac-tab ${tab === 'enterprise' ? 'ac-tab--active' : ''}`}
            onClick={() => setTab('enterprise')}
          >
            Enterprise Roles
          </button>
          <button
            type="button"
            className={`ac-tab ${tab === 'branch' ? 'ac-tab--active' : ''}`}
            onClick={() => setTab('branch')}
          >
            Branch Access
          </button>
        </div>
      )}

      {insideBranch || tab === 'branch'
        ? <BranchAccessTab initialBranchId={branchId || ''} />
        : <EnterpriseRolesTab />}
    </div>
  );
};

export default AccessControlPage;
