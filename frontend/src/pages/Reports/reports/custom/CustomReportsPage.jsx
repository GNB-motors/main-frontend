import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Sparkles, RefreshCw, Edit3, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import ReportFrame from '../ReportFrame';
import CustomReportBuilder from './CustomReportBuilder';
import CustomReportPreview from './CustomReportPreview';
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
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' (default front) | 'builder'
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

      // Validate date range: From date cannot be later than To date
      const startStr = activeConfig.filters?.startDate;
      const endStr = activeConfig.filters?.endDate;
      if (startStr && endStr) {
        const startYmd = startStr.slice(0, 10);
        const endYmd = endStr.slice(0, 10);
        if (startYmd > endYmd) {
          toast.error('From date cannot be later than To date.');
          return;
        }
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

  return (
    <ReportFrame
      title="Custom Reports"
      subtitle={
        activeTab === 'runner'
          ? `Live execution view and export for "${config.name || 'Custom Report'}".`
          : activeTab === 'builder'
            ? 'Create tailored reports by selecting fields, filters and aggregations across your fleet data.'
            : 'Track and manage custom report field requests, or create custom reports.'
      }
    >
      <div className="custom-reports-container">
        {/* View 1: Report Runner (Dedicated Live Report View) */}
        {activeTab === 'runner' && (
          <div className="flex flex-col gap-5">
            {/* Header with Navigation and Quick Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  onClick={() => setActiveTab('requests')}
                  aria-label="Back to Requested Reports"
                >
                  <ArrowLeft size={15} />
                  <span>Back to Requested Reports</span>
                </button>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {config.category || 'GENERAL'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {config.name || 'Untitled Custom Report'}
                  </h3>
                  {config.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Approved by Super Admin</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary-action !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5"
                  onClick={() => runPreview(config, currentPage)}
                  disabled={previewLoading}
                  title="Re-run Report"
                >
                  <RefreshCw size={13} className={previewLoading ? 'animate-spin' : ''} />
                  <span>Re-run Report</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary-action !py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5"
                  onClick={() => setActiveTab('builder')}
                  title="Open in Builder to view or edit configuration"
                >
                  <Edit3 size={13} />
                  <span>Edit in Builder</span>
                </button>
              </div>
            </div>

            {/* Quick Report Meta Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-slate-400 font-medium">Dataset: </span>
                  <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-800">
                    {config.dataset}
                  </code>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Columns: </span>
                  <span className="font-semibold text-slate-800">
                    {config.fields?.length || 0} fields
                  </span>
                </div>
                {(config.filters?.startDate || config.filters?.endDate) && (
                  <div>
                    <span className="text-slate-400 font-medium">Date Range: </span>
                    <span className="font-semibold text-slate-800">
                      {config.filters?.startDate ? config.filters.startDate.slice(0, 10) : 'Any'} →{' '}
                      {config.filters?.endDate ? config.filters.endDate.slice(0, 10) : 'Any'}
                    </span>
                  </div>
                )}
                {config.description && (
                  <div className="text-slate-500 italic max-w-md truncate">
                    &ldquo;{config.description}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Live Report Results */}
            <div className="custom-builder-card !p-4">
              <div className="builder-section-title">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600" />
                  <span>Live Report Results: {config.name || 'Untitled Report'}</span>
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
          </div>
        )}

        {/* View 2: Builder & Preview */}
        {activeTab === 'builder' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                onClick={() => setActiveTab('requests')}
                aria-label="Back to Requested Reports"
              >
                <ArrowLeft size={15} />
                <span>Back to Requested Reports</span>
              </button>
              <span className="text-xs text-slate-400 font-medium">Create Custom Report</span>
            </div>

            <CustomReportBuilder
              catalog={catalog}
              config={config}
              onChange={setConfig}
              onRunPreview={() => {
                runPreview(config, 1);
                setTimeout(() => {
                  document.getElementById('report-preview-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              loading={previewLoading}
            />

            {/* Preview Section */}
            {(previewData || previewLoading || previewError) && (
              <div id="report-preview-section" className="custom-builder-card !p-4">
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

        {/* View 3: Requested Reports (Default Landing) */}
        {activeTab === 'requests' && (
          <FieldRequestsView
            userRole={userRole}
            onCreateCustomReport={() => {
              setConfig(DEFAULT_CONFIG);
              setPreviewData(null);
              setPreviewError(null);
              setActiveTab('builder');
            }}
            onLoadReport={(savedReport, autoRun = false) => {
              const loaded = {
                savedId: savedReport._id || savedReport.id,
                name: savedReport.name || '',
                description: savedReport.description || '',
                category: savedReport.category || 'GENERAL',
                dataset: savedReport.dataset || 'fuel_transactions',
                fields: savedReport.fields || [],
                filters: savedReport.filters || {},
                sorting: savedReport.sorting || { field: null, order: 'desc' },
                aggregations: savedReport.aggregations || [],
                status: savedReport.status || 'PENDING',
              };
              setConfig(loaded);
              if (autoRun) {
                setActiveTab('runner');
                runPreview(loaded, 1);
              } else {
                setActiveTab('builder');
              }
            }}
          />
        )}
      </div>
    </ReportFrame>
  );
}
