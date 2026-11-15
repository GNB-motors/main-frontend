import React, { useState, useEffect } from 'react';
import { LayoutTemplate, ArrowRight } from 'lucide-react';
import { ReportsService } from '../../ReportsService';

export default function ReportTemplatesList({ onUseTemplate, catalog = {} }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ReportsService.getCustomReportTemplates()
      .then((data) => setTemplates(data || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const fieldMap = new Map((catalog.fields || []).map((f) => [f.key, f.label]));

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">Loading report templates...</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-900">Pre-built Report Templates</h3>
        <p className="text-xs text-slate-500">
          Jumpstart your analysis with curated templates. You can customize fields, filters and
          columns after loading.
        </p>
      </div>

      <div className="templates-grid">
        {templates.map((tpl) => (
          <div key={tpl.id} className="template-card">
            <div className="template-header">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 inline-block mb-2">
                {tpl.category}
              </span>
              <h4>{tpl.name}</h4>
              <p>{tpl.description}</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Included Fields ({tpl.fields?.length || 0}):
              </div>
              <div className="template-meta-pills">
                {(tpl.fields || []).map((fKey) => (
                  <span key={fKey} className="template-pill">
                    {fieldMap.get(fKey) || fKey}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary-action justify-center w-full !text-xs !py-2"
              onClick={() => onUseTemplate?.(tpl)}
            >
              <span>Use This Template</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
