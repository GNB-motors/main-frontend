import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Satellite, AlertTriangle } from 'lucide-react';
import { getUserRole } from '../../../utils/session';
import useApi from '../../../hooks/useApi';
import FleetEdgeHealthService from '../../../services/FleetEdgeHealthService';
import { formatAge, connectionChip, flowChip } from './fleetEdgeHealthFormat.js';
import '../SuperAdminPage.css';
import './FleetEdgeHealth.css';

const chip = (map) => <span className={`status-chip status-chip--${map.tone}`}>{map.text}</span>;

const ageCell = (feed) => {
  if (!feed || feed.ageSeconds == null)
    return <span style={{ color: 'var(--muted, #9ca3af)' }}>—</span>;
  return <span>{formatAge(feed.ageSeconds)}</span>;
};

const sinceNow = (iso) =>
  iso ? formatAge(Math.floor((Date.now() - new Date(iso).getTime()) / 1000)) : '—';

/**
 * Superadmin drill-down: one org's FleetEdge vehicles with connection/token
 * status and per-feed "how long ago" freshness (backend `test` + sink).
 */
const FleetEdgeHealthOrgPage = () => {
  const navigate = useNavigate();
  const { orgId } = useParams();

  useEffect(() => {
    if (getUserRole() !== 'SUPER_ADMIN') navigate('/profile');
  }, [navigate]);

  const { data, loading, error } = useApi(
    (signal) => FleetEdgeHealthService.getOrgHealth(orgId, signal),
    [orgId],
  );

  const vehicles = data?.vehicles || [];
  const vSummary = data?.summary?.vehicles || {};
  const aSummary = data?.summary?.accounts || {};
  const sinkReachable = !!data?.sinkReachable;

  return (
    <div className="super-admin-dashboard feh">
      <button
        type="button"
        className="orgs-table-view-link"
        style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        onClick={() => navigate('/superadmin/fleetedge-health')}
      >
        <ArrowLeft size={16} /> All organisations
      </button>

      <div className="orgs-table-card">
        <div className="orgs-table-header">
          <div>
            <h2>
              <Satellite size={20} /> Fleet Data Health — {data?.org?.companyName || '…'}
            </h2>
            <p className="orgs-table-subtitle">
              Per-vehicle connection and telemetry freshness.
              {data?.generatedAt ? ` As of ${new Date(data.generatedAt).toLocaleString()}.` : ''}
              {data && !sinkReachable
                ? ' Sink (gnb_ingest) not reachable — showing backend freshness only.'
                : ''}
            </p>
          </div>
        </div>

        {data && (
          <div className="stats-grid" style={{ padding: '0 16px 8px' }}>
            <div className="stat-card">
              <span>Vehicles</span>
              <strong>{vSummary.total ?? '—'}</strong>
            </div>
            <div className="stat-card">
              <span>Flowing</span>
              <strong>{vSummary.flowing ?? '—'}</strong>
            </div>
            <div className="stat-card">
              <span>Stale</span>
              <strong>{vSummary.stale ?? '—'}</strong>
            </div>
            <div className="stat-card">
              <span>No data</span>
              <strong>{vSummary.noData ?? '—'}</strong>
            </div>
            <div className="stat-card">
              <span>Re-auth needed</span>
              <strong>{aSummary.needsReauth ?? '—'}</strong>
            </div>
            {sinkReachable && (
              <div className="stat-card">
                <span>Forwarder gaps</span>
                <strong>{vSummary.forwarderGaps ?? 0}</strong>
              </div>
            )}
          </div>
        )}

        {loading && <p style={{ padding: 16 }}>Loading…</p>}
        {error && (
          <p style={{ padding: 16, color: 'var(--danger, crimson)' }}>
            Failed to load fleet health.
          </p>
        )}

        {!loading && !error && (
          <div className="orgs-table-wrapper">
            <table className="orgs-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Model</th>
                  <th>Connection</th>
                  <th>Token expiry</th>
                  <th>Data flow</th>
                  <th>Status</th>
                  <th>Fuel</th>
                  <th>Usage</th>
                  <th>CAN</th>
                  <th>Position</th>
                  {sinkReachable && <th>Sink seen</th>}
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const feeds = v.backend?.feeds || {};
                  const pos = feeds.position;
                  return (
                    <tr key={v.vin || v.registrationNumber}>
                      <td className="org-name-cell">{v.registrationNumber || v.vin || '—'}</td>
                      <td>{v.vehicleModel || '—'}</td>
                      <td>{chip(connectionChip(v.connection?.status))}</td>
                      <td>
                        {v.connection?.expiresAt
                          ? new Date(v.connection.expiresAt).toLocaleString()
                          : '—'}
                      </td>
                      <td>{chip(flowChip(v.backend?.status))}</td>
                      <td>{ageCell(feeds.status)}</td>
                      <td>{ageCell(feeds.fuel)}</td>
                      <td>{ageCell(feeds.usage)}</td>
                      <td>{ageCell(feeds.can)}</td>
                      <td>
                        {ageCell(pos)}
                        {pos?.state ? (
                          <span style={{ color: 'var(--muted, #9ca3af)' }}> · {pos.state}</span>
                        ) : null}
                      </td>
                      {sinkReachable && <td>{sinceNow(v.sink?.lastSeenAt)}</td>}
                      <td>
                        {v.forwarderGap && (
                          <span
                            title="Fresh at the sink but stale in the backend — data is not being forwarded"
                            style={{
                              color: '#b45309',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <AlertTriangle size={14} /> forwarder gap
                          </span>
                        )}
                        {v.subscriptionExpired && (
                          <span style={{ color: '#b91c1c' }}> subscription expired</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={sinkReachable ? 12 : 11} style={{ padding: 16 }}>
                      No FleetEdge vehicles for this organisation.
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

export default FleetEdgeHealthOrgPage;
