import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Satellite } from 'lucide-react';
import { getUserRole } from '../../../utils/session';
import useApi from '../../../hooks/useApi';
import FleetEdgeHealthService from '../../../services/FleetEdgeHealthService';
import '../SuperAdminPage.css';

/**
 * Superadmin list step: pick an organisation to open its FleetEdge data-flow
 * audit. Drill-down lives in FleetEdgeHealthOrgPage.
 */
const FleetEdgeHealthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (getUserRole() !== 'SUPER_ADMIN') navigate('/profile');
  }, [navigate]);

  const { data, loading, error } = useApi(
    (signal) => FleetEdgeHealthService.listOrganizations(signal),
    [],
  );
  const orgs = Array.isArray(data) ? data : [];

  const open = (id) => navigate(`/superadmin/fleetedge-health/${id}`);

  return (
    <div className="super-admin-dashboard">
      <div className="orgs-table-card">
        <div className="orgs-table-header">
          <div>
            <h2>
              <Satellite size={20} /> Fleet Data Health
            </h2>
            <p className="orgs-table-subtitle">
              Choose an organisation to audit per-vehicle FleetEdge connection and telemetry
              freshness.
            </p>
          </div>
        </div>

        {loading && <p style={{ padding: 16 }}>Loading organisations…</p>}
        {error && (
          <p style={{ padding: 16, color: 'var(--danger, crimson)' }}>
            Failed to load organisations.
          </p>
        )}

        {!loading && !error && (
          <div className="orgs-table-wrapper">
            <table className="orgs-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org._id}>
                    <td className="org-name-cell">{org.companyName || org._id}</td>
                    <td>
                      <button
                        type="button"
                        className="orgs-table-view-link"
                        onClick={() => open(org._id)}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
                {orgs.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ padding: 16 }}>
                      No organisations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetEdgeHealthPage;
