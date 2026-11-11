import React, { useState, useEffect } from 'react';
import { Wrench, MessageSquare, X } from 'lucide-react';
import ReportFrame from '../ReportFrame';
import CustomReportBuilder from './CustomReportBuilder';
import FieldRequestsView from './FieldRequestsView';
import { ReportsService } from '../../ReportsService';
import { getUserRole } from '../../../../utils/session';
import './CustomReports.css';

const DEFAULT_CONFIG = {
  name: 'New Custom Report',
  description: '',
  category: 'FUEL',
  dataset: 'fuel_transactions',
  fields: [
    'fuelDate',
    'vehicleNumber',
    'driverName',
    'fuelQuantity',
    'fuelRate',
    'fuelAmount',
    'pumpName',
  ],
  filters: {},
  sorting: { field: 'fuelDate', order: 'desc' },
  aggregations: [
    { field: 'fuelQuantity', op: 'SUM' },
    { field: 'fuelAmount', op: 'SUM' },
  ],
};

export default function CustomReportsPage() {
  const userRole = getUserRole();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' (default) | 'builder'
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [catalog, setCatalog] = useState({ datasets: [], fields: [], unsupportedFields: [] });
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Load field catalog on mount
  useEffect(() => {
    ReportsService.getCustomReportCatalog()
      .then((data) => setCatalog(data || { datasets: [], fields: [], unsupportedFields: [] }))
      .catch(() => {
        setCatalog({ datasets: [], fields: [], unsupportedFields: [] });
      });
  }, []);

  const handleOpenBuilder = () => {
    setIsBuilderOpen(true);
    setActiveTab('builder');
  };

  const handleCloseBuilder = () => {
    setIsBuilderOpen(false);
    setActiveTab('requests');
  };

  return (
    <ReportFrame
      title="Custom Reports"
      subtitle="Track requested custom reports and build tailored reports across your fleet data."
    >
      <div className="custom-reports-container">
        {/* Sub-navigation tabs: only visible when the builder tab is actively opened */}
        {isBuilderOpen && (
          <div className="custom-tabs-nav" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'requests'}
              className={`custom-tab-btn ${activeTab === 'requests' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <MessageSquare size={16} />
              <span>Requested Reports</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'builder'}
              className={`custom-tab-btn ${activeTab === 'builder' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('builder')}
            >
              <Wrench size={16} />
              <span>Create Custom Report</span>
              <span
                role="button"
                tabIndex={0}
                className="ml-1 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition"
                title="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseBuilder();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    handleCloseBuilder();
                  }
                }}
              >
                <X size={13} />
              </span>
            </button>
          </div>
        )}

        {/* Tab 1: Requested Reports (Default entry point) */}
        {activeTab === 'requests' && (
          <FieldRequestsView
            userRole={userRole}
            onCreateCustomReport={handleOpenBuilder}
          />
        )}

        {/* Tab 2: Create Custom Report Builder */}
        {activeTab === 'builder' && (
          <div className="flex flex-col gap-6">
            <CustomReportBuilder
              catalog={catalog}
              config={config}
              onChange={setConfig}
              onBackToRequests={handleCloseBuilder}
            />
          </div>
        )}
      </div>
    </ReportFrame>
  );
}
