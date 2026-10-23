import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../superAdminFormat';
import { SortIcon } from '../components/SortIcon.jsx';

const OrgsOverviewTable = ({ displayedOrgs, sortKey, sortDir, handleSort, navigate }) => (
  <table className="orgs-table">
    <thead>
      <tr>
        <th className="sortable" onClick={() => handleSort('companyName')}>
          Organisation <SortIcon active={sortKey === 'companyName'} dir={sortDir} />
        </th>
        <th className="sortable" onClick={() => handleSort('vehicleCount')}>
          Vehicles <SortIcon active={sortKey === 'vehicleCount'} dir={sortDir} />
        </th>
        <th className="sortable" onClick={() => handleSort('userCount')}>
          Users <SortIcon active={sortKey === 'userCount'} dir={sortDir} />
        </th>
        <th className="sortable" onClick={() => handleSort('totalExpenses')}>
          Expenses <SortIcon active={sortKey === 'totalExpenses'} dir={sortDir} />
        </th>
        <th>Status</th>
        <th className="sortable" onClick={() => handleSort('createdAt')}>
          Created <SortIcon active={sortKey === 'createdAt'} dir={sortDir} />
        </th>
        <th aria-label="Actions" />
      </tr>
    </thead>
    <tbody>
      {displayedOrgs.map((org) => (
        <tr
          key={org._id}
          className="orgs-table-row-clickable"
          onClick={() => navigate(`/superadmin/organizations/${org._id}`)}
        >
          {/* Name + email */}
          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
          <td>
            <div className="org-name-cell">
              <span className="org-company-name">
                {org.companyName || <span className="no-name">Unnamed Org</span>}
              </span>
              <span className="org-email">{org.ownerEmail}</span>
            </div>
          </td>
          {/* Vehicles */}
          <td>
            <span className="num">{org.vehicleCount}</span>
          </td>
          {/* Users */}
          <td>
            <span className="num">{org.userCount}</span>
          </td>
          {/* Expenses */}
          <td>
            <span className="num expense-value">{formatCurrency(org.totalExpenses)}</span>
          </td>
          {/* Status badge */}
          <td>
            {org.isOnboarded ? (
              <span className="status-badge status-active">
                <CheckCircle2 size={11} />
                Active
              </span>
            ) : (
              <span className="status-badge status-pending">
                <Clock size={11} />
                Pending
              </span>
            )}
          </td>
          {/* Created */}
          <td>
            <span className="date-value">{formatDate(org.createdAt)}</span>
          </td>
          {/* View action */}
          <td>
            <span className="orgs-table-view-link">
              View <ArrowRight size={13} />
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default OrgsOverviewTable;
