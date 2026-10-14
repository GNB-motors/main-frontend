import { Route } from 'lucide-react';
import ExportButton from '../../components/ui/ExportButton';
import {
  BAR_COLORS,
  MODEL_SUMMARY_EXPORT_COLUMNS,
  countAtRisk,
  modelSummaryExportRows,
} from './modelComparisonLogic';

/**
 * Model-wise summary table. A plain `<table>`, not the shared `DataTable` —
 * rows here need a "selected" highlight tied to the charts above, which
 * `DataTable` has no slot for.
 */
const ModelSummaryTable = ({ data, selectedModel, maxAvg, onSelectModel, showExport = true }) => {
  return (
    <div className="mc-card">
      <div className="mc-card-header">
        <div className="mc-card-icon" style={{ background: 'rgba(99,102,241,0.10)' }}>
          <Route size={16} color="#6366F1" />
        </div>
        <h3 className="mc-card-title">Model-wise Summary</h3>
        {showExport ? (
          <div style={{ marginLeft: 'auto' }}>
            <ExportButton
              rows={modelSummaryExportRows(data)}
              columns={MODEL_SUMMARY_EXPORT_COLUMNS}
              filename="model-comparison"
              meta={{
                filters: [{ label: 'Models compared', value: data.length }],
                generatedAt: new Date(),
              }}
            />
          </div>
        ) : null}
      </div>
      <div className="mc-table-wrapper">
        <table className="mc-table">
          <thead>
            <tr>
              <th>Model</th>
              <th className="mc-th-right">Vehicles</th>
              <th className="mc-th-right">Records</th>
              <th className="mc-th-right">Avg Mileage</th>
              <th className="mc-th-right">Min</th>
              <th className="mc-th-right">Max</th>
              <th className="mc-th-right">Total Distance</th>
              <th className="mc-th-right">Total Fuel</th>
              <th className="mc-th-right">At Risk</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const atRisk = countAtRisk(row.vehicles, row.avgMileage);
              const isSelected = row.model === selectedModel;
              return (
                <tr
                  key={row.model}
                  className={`mc-table-row${isSelected ? ' mc-row-selected' : ''}`}
                  onClick={() => onSelectModel(row.model)}
                >
                  <td className="mc-td-model">
                    <div className="mc-model-cell">
                      <span
                        className="mc-model-dot"
                        style={{ background: BAR_COLORS[index % BAR_COLORS.length] }}
                      />
                      <span>{row.model}</span>
                      {row.avgMileage === maxAvg && <span className="mc-best-badge">Best</span>}
                    </div>
                  </td>
                  <td className="mc-td-right">{row.vehicleCount}</td>
                  <td className="mc-td-right">{row.recordCount}</td>
                  <td className="mc-td-right mc-td-primary">{row.avgMileage} km/L</td>
                  <td className="mc-td-right">{row.minMileage}</td>
                  <td className="mc-td-right">{row.maxMileage}</td>
                  <td className="mc-td-right">{row.totalDistanceKm.toLocaleString()} km</td>
                  <td className="mc-td-right">{row.totalFuelL.toLocaleString()} L</td>
                  <td className="mc-td-right">
                    {atRisk > 0 ? (
                      <span className="mc-at-risk-badge">{atRisk}</span>
                    ) : (
                      <span className="mc-ok-badge">✓</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModelSummaryTable;
