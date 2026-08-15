import React, { useState } from 'react';
import { PageHeader } from '../Drivers/Component';
import EnterpriseRolesTab from './EnterpriseRolesTab';
import BranchAccessTab from './BranchAccessTab';
import '../Superadmin/components/FeatureFlags.css';
import '../Superadmin/components/Rbac.css';
import './AccessControl.css';

/**
 * Employee Access Control — the enterprise-facing RBAC screen.
 *  - Enterprise Roles: the roles available to this enterprise + assign to employees.
 *  - Branch Access: per-branch availability & overrides of those roles.
 */
const AccessControlPage = () => {
  const [tab, setTab] = useState('enterprise');

  return (
    <div className="ff-page">
      <PageHeader
        currentLabel="Employee Access Control"
        title="Employee Access Control"
        description="Control the permissions accessible by different employee roles across your enterprise."
      />

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

      {tab === 'enterprise' ? <EnterpriseRolesTab /> : <BranchAccessTab />}
    </div>
  );
};

export default AccessControlPage;
