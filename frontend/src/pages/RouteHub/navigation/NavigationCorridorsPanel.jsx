import { useApi } from '../../../hooks/useApi';
import NavigationService from '../../../services/NavigationService';
import { getOrgId, getBranchId, getUserId, getUserRole } from '../../../utils/session';
import { eligibilityLabel, navigationError, rowId } from './navigationHistory';

export default function NavigationCorridorsPanel() {
  const scope = JSON.stringify([getOrgId(), getBranchId(), getUserId()]);
  const { data, loading, error, refetch } = useApi(
    (signal) => NavigationService.corridors(signal),
    [scope],
    { scopeKey: scope },
  );
  const corridors = data?.corridors ?? [];
  return (
    <section
      className="card"
      aria-label="Navigation corridor eligibility"
      style={{ marginTop: 24 }}
    >
      <div className="card-head">
        <div>
          <h3>Navigation corridor eligibility</h3>
          <p>
            {getUserRole() === 'OWNER'
              ? 'Organization-wide learned evidence and the reasons a route needs validation. Branch selection does not filter these corridors.'
              : 'Learned evidence and the reasons a route needs validation for this branch scope.'}
          </p>
        </div>
        <button type="button" onClick={refetch} disabled={loading}>
          Refresh
        </button>
      </div>
      {error ? (
        <p role="alert" style={{ padding: 16 }}>
          {navigationError(error)}
        </p>
      ) : loading ? (
        <p role="status" style={{ padding: 16 }}>
          Loading corridor evidence…
        </p>
      ) : data?.unavailableReason ? (
        <p style={{ padding: 16 }}>Corridor evidence is unavailable for this branch scope.</p>
      ) : !corridors.length ? (
        <p style={{ padding: 16 }}>No learned navigation corridors are recorded for this scope.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Corridor</th>
                <th>Evidence</th>
                <th>Eligibility</th>
                <th>Reasons</th>
              </tr>
            </thead>
            <tbody>
              {corridors.map((corridor) => (
                <tr key={`${corridor.sourceModel}:${rowId(corridor) || corridor.sourceId}`}>
                  <td>{corridor.name || corridor.label || corridor.sourceId || rowId(corridor)}</td>
                  <td>
                    {corridor.sourceModel || corridor.source?.model || 'Learned route'}
                    {corridor.revision != null ? ` · revision ${corridor.revision}` : ''}
                  </td>
                  <td>{eligibilityLabel(corridor)}</td>
                  <td>
                    {corridor.reasonCodes?.length
                      ? corridor.reasonCodes
                          .map((reason) => String(reason).toLowerCase().replaceAll('_', ' '))
                          .join('; ')
                      : 'No assessment reason recorded'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ padding: 16 }}>
        Eligibility is evidence quality, not permission to ignore current truck restrictions. Each
        selected route is validated for the assigned truck.
      </p>
    </section>
  );
}
