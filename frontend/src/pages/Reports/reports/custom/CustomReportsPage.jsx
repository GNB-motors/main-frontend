import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, Bookmark, LayoutTemplate, MessageSquare, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import ReportFrame from '../ReportFrame';
import CustomReportBuilder from './CustomReportBuilder';
import CustomReportPreview from './CustomReportPreview';
import SavedReportsList from './SavedReportsList';
import ReportTemplatesList from './ReportTemplatesList';
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
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'saved' | 'requests' | 'templates'
  const [catalog, setCatalog] = useState({ datasets: [], fields: [], unsupportedFields: [] });
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load field catalog on mount
  useEffect(() => {
    ReportsService.getCustomReportCatalog()
      .then((data) => setCatalog(data || { datasets: [], fields: [], unsupportedFields: [] }))
      .catch(() => {
        setCatalog({ datasets: [], fields: [], unsupportedFields: [] });
      });
  }, []);

  // Execute report preview query
  const runPreview = useCallback(
    async (overrideConfig = null, page = 1) => {
      const activeConfig = overrideConfig || config;
      if (!activeConfig.fields?.length) {
        toast.warn('Please select at least one field to generate a preview.');
        return;
      }
      setPreviewLoading(true);
      setPreviewError(null);
      setCurrentPage(page);
      try {
        const payload = {
          dataset: activeConfig.dataset || 'fuel_transactions',
          fields: activeConfig.fields,
          filters: activeConfig.filters || {},
          sorting: activeConfig.sorting || { field: null, order: 'desc' },
          aggregations: activeConfig.aggregations || [],
          page,
          limit: 20,
        };
        const response = await ReportsService.executeCustomReport(payload);
        setPreviewData(response);
      } catch (err) {
        setPreviewError(err?.message || 'Failed to generate custom report preview.');
      } finally {
        setPreviewLoading(false);
      }
    },
    [config],
  );

  // When loading a saved report
  const handleRunSavedReport = (savedReport) => {
    const loadedConfig = {
      savedId: savedReport._id || savedReport.id,
      name: savedReport.name,
      description: savedReport.description || '',
      category: savedReport.category || 'GENERAL',
      dataset: savedReport.dataset || 'fuel_transactions',
      fields: savedReport.fields || [],
      filters: savedReport.filters || {},
      sorting: savedReport.sorting || { field: null, order: 'desc' },
      aggregations: savedReport.aggregations || [],
    };
    setConfig(loadedConfig);
    setActiveTab('builder');
    runPreview(loadedConfig, 1);
  };

  // When loading a template
  const handleUseTemplate = (template) => {
    const loadedConfig = {
      name: template.name,
      description: template.description || '',
      category: template.category || 'GENERAL',
      dataset: template.dataset || 'fuel_transactions',
      fields: template.fields || [],
      filters: {},
      sorting: template.sorting || { field: null, order: 'desc' },
      aggregations: template.aggregations || [],
    };
    setConfig(loadedConfig);
    setActiveTab('builder');
    runPreview(loadedConfig, 1);
  };

  return (
    <ReportFrame
      title="Custom Reports"
      subtitle="Create tailored reports by selecting fields, filters and aggregations across your fleet data."
    >
      <div className="custom-reports-container">
        {/* Sub-navigation tabs */}
        <div className="custom-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'builder'}
            className={`custom-tab-btn ${activeTab === 'builder' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            <Wrench size={16} />
            <span>Create Custom Report</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'saved'}
            className={`custom-tab-btn ${activeTab === 'saved' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={16} />
            <span>My Saved Reports</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'templates'}
            className={`custom-tab-btn ${activeTab === 'templates' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <LayoutTemplate size={16} />
            <span>Report Templates</span>
          </button>

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
        </div>

        {/* Tab 1: Builder & Preview */}
        {activeTab === 'builder' && (
          <div className="flex flex-col gap-6">
            <CustomReportBuilder
              catalog={catalog}
              config={config}
              onChange={setConfig}
              onRunPreview={() => runPreview(config, 1)}
              loading={previewLoading}
            />

            {/* Preview Section */}
            {(previewData || previewLoading || previewError) && (
              <div className="custom-builder-card !p-4">
                <div className="builder-section-title">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-600" />
                    <span>Report Preview: {config.name || 'Untitled Report'}</span>
                  </div>
                </div>

                <CustomReportPreview
                  config={config}
                  catalog={catalog}
                  reportData={previewData}
                  loading={previewLoading}
                  error={previewError}
                  onRetry={() => runPreview(config, currentPage)}
                  onPageChange={(page) => runPreview(config, page)}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved Reports */}
        {activeTab === 'saved' && <SavedReportsList onRunReport={handleRunSavedReport} />}

        {/* Tab 3: Report Templates */}
        {activeTab === 'templates' && (
          <ReportTemplatesList onUseTemplate={handleUseTemplate} catalog={catalog} />
        )}

        {/* Tab 4: Field Requests */}
        {activeTab === 'requests' && <FieldRequestsView userRole={userRole} />}
      </div>
    </ReportFrame>
  );
}
