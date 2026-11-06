import React, { useState, useEffect } from 'react';
import { Play, Copy, Trash2, Clock, Folder, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { ReportsService } from '../../ReportsService';
import { formatInIST } from '../../../../utils/dateUtils';

export default function SavedReportsList({ onRunReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ReportsService.getSavedCustomReports();
      setReports(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load saved reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await ReportsService.deleteSavedCustomReport(id);
      toast.success('Report deleted successfully');
      setReports((prev) => prev.filter((r) => (r._id || r.id) !== id));
    } catch (err) {
      toast.error(err?.message || 'Failed to delete report');
    }
  };

  const handleDuplicate = async (report) => {
    try {
      const payload = {
        name: `Copy of ${report.name}`,
        description: report.description,
        category: report.category,
        dataset: report.dataset,
        fields: report.fields,
        filters: report.filters,
        sorting: report.sorting,
        aggregations: report.aggregations,
      };
      await ReportsService.createSavedCustomReport(payload);
      toast.success('Report duplicated successfully');
      fetchReports();
    } catch (err) {
      toast.error(err?.message || 'Failed to duplicate report');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-sm">Loading saved reports...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-center justify-between">
        <span>{error}</span>
        <button type="button" className="underline font-semibold" onClick={fetchReports}>
          Retry
        </button>
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-2">
        <Folder size={32} className="text-slate-400" />
        <h4 className="font-semibold text-slate-800">No saved custom reports yet</h4>
        <p className="text-sm text-slate-500 max-w-sm">
          Build your custom report using the builder tab, then click &quot;Save Configuration&quot;
          to access it here anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reports.map((r) => {
          const id = r._id || r.id;
          return (
            <div
              key={id}
              className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between gap-3 hover:border-blue-400 transition-all shadow-sm"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {r.category || 'GENERAL'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    {formatInIST(r.updatedAt || r.createdAt, 'DD MMM YYYY')}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 text-base">{r.name}</h4>
                {r.description ? (
                  <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>
                ) : null}
                <div className="text-xs text-slate-500 mt-1">
                  <strong>{r.fields?.length || 0}</strong> columns · Dataset:{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded">{r.dataset}</code>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="col-btn"
                    title="Duplicate Configuration"
                    onClick={() => handleDuplicate(r)}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    className="col-btn is-delete"
                    title="Delete Saved Report"
                    onClick={() => handleDelete(id, r.name)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-primary-action !py-1 !px-3 !text-xs"
                  onClick={() => onRunReport?.(r)}
                >
                  <Play size={12} />
                  Run Report
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
