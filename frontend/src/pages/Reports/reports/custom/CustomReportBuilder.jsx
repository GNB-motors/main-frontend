import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUp,
  ArrowDown,
  Trash2,
  Play,
  Save,
  Plus,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import SaveReportModal from './SaveReportModal';
import RequestFieldModal from './RequestFieldModal';

const DATASET_MODULE_MAP = {
  fuel_transactions: ['FUEL', 'VEHICLE', 'DRIVER'],
  trips_mileage: ['TRIP', 'VEHICLE', 'DRIVER'],
  vehicle_compliance: ['COMPLIANCE', 'VEHICLE'],
  adblue_telemetry: ['ADBLUE', 'VEHICLE'],
  driver_summary: ['DRIVER', 'FUEL', 'TRIP', 'VEHICLE'],
};

export default function CustomReportBuilder({
  catalog = {},
  config = {},
  onChange = null,
  onRunPreview = null,
  loading = false,
}) {
  const [fieldSearch, setFieldSearch] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const datasets = useMemo(() => catalog.datasets || [], [catalog.datasets]);
  const allFields = useMemo(() => catalog.fields || [], [catalog.fields]);
  const unsupportedFields = useMemo(
    () => catalog.unsupportedFields || [],
    [catalog.unsupportedFields],
  );

  const selectedDataset = config.dataset || 'fuel_transactions';
  const selectedFields = config.fields || [];
  const selectedAggregations = config.aggregations || [];
  const selectedSorting = config.sorting || { field: null, order: 'desc' };
  const currentFilters = config.filters || {};

  const allowedModules = useMemo(
    () => DATASET_MODULE_MAP[selectedDataset] || ['FUEL', 'VEHICLE', 'DRIVER'],
    [selectedDataset],
  );

  // Filter fields available for the chosen dataset
  const availableFields = useMemo(() => {
    return allFields.filter((f) => {
      if (f.dataset && !f.dataset.includes(selectedDataset)) return false;
      if (!allowedModules.includes(f.module)) return false;
      if (!fieldSearch.trim()) return true;
      const q = fieldSearch.toLowerCase();
      return (
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        f.module.toLowerCase().includes(q)
      );
    });
  }, [allFields, selectedDataset, allowedModules, fieldSearch]);

  // Group by module
  const groupedFields = useMemo(() => {
    const map = new Map();
    availableFields.forEach((f) => {
      if (!map.has(f.module)) map.set(f.module, []);
      map.get(f.module).push(f);
    });
    return map;
  }, [availableFields]);

  const toggleField = (fieldKey) => {
    const next = selectedFields.includes(fieldKey)
      ? selectedFields.filter((k) => k !== fieldKey)
      : [...selectedFields, fieldKey];

    // If removing a field, also remove its aggregation or sorting
    const nextAggs = selectedAggregations.filter((a) => a.field !== fieldKey);
    const nextSorting =
      selectedSorting.field === fieldKey ? { field: null, order: 'desc' } : selectedSorting;

    onChange?.({
      ...config,
      fields: next,
      aggregations: nextAggs,
      sorting: nextSorting,
    });
  };

  const moveField = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedFields.length) return;
    const reordered = [...selectedFields];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange?.({ ...config, fields: reordered });
  };

  const removeField = (fieldKey) => {
    toggleField(fieldKey);
  };

  const handleAggChange = (fieldKey, op) => {
    let next = selectedAggregations.filter((a) => a.field !== fieldKey);
    if (op) {
      next.push({ field: fieldKey, op });
    }
    onChange?.({ ...config, aggregations: next });
  };

  const handleSortChange = (fieldKey, order) => {
    onChange?.({
      ...config,
      sorting: { field: fieldKey || null, order: order || 'desc' },
    });
  };

  const handleFilterChange = (filterKey, value) => {
    onChange?.({
      ...config,
      filters: {
        ...currentFilters,
        [filterKey]: value || undefined,
      },
    });
  };

  const fieldMetaMap = useMemo(() => {
    const m = new Map();
    allFields.forEach((f) => m.set(f.key, f));
    return m;
  }, [allFields]);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Report Details Card */}
      <div className="custom-builder-card">
        <div className="builder-section-title">
          <span>1. Report Configuration & Data Source</span>
        </div>
        <div className="builder-grid-2">
          <div className="builder-field-group">
            <label htmlFor="cr-report-name">Report Name *</label>
            <input
              id="cr-report-name"
              aria-label="Report Name"
              type="text"
              className="builder-input"
              placeholder="e.g. Q4 High Consumption Vehicles"
              value={config.name || ''}
              onChange={(e) => onChange?.({ ...config, name: e.target.value })}
            />
          </div>

          <div className="builder-field-group">
            <label htmlFor="cr-primary-dataset">Primary Data Source (Dataset) *</label>
            <SearchableSelect
              id="cr-primary-dataset"
              aria-label="Primary Data Source (Dataset)"
              className="builder-select"
              value={selectedDataset}
              onChange={(e) => {
                const newDs = e.target.value;
                // Keep only fields valid in new dataset
                const validFields = selectedFields.filter((fk) => {
                  const def = fieldMetaMap.get(fk);
                  return def && (!def.dataset || def.dataset.includes(newDs));
                });
                onChange?.({
                  ...config,
                  dataset: newDs,
                  fields: validFields,
                  aggregations: [],
                });
              }}
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} — {d.description}
                </option>
              ))}
            </SearchableSelect>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Field Selection & Column Arrangement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Available Fields Selector (5 cols) */}
        <div className="lg:col-span-5 custom-builder-card !p-3.5">
          <div className="builder-section-title">
            <span>2. Available Fields ({availableFields.length})</span>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-normal"
              onClick={() => setRequestModalOpen(true)}
            >
              <Plus size={12} />
              Request Field
            </button>
          </div>

          <div className="field-selector-box">
            <div className="field-search-bar">
              <Search size={14} className="field-search-icon" />
              <input
                type="text"
                className="field-search-input"
                aria-label="Search fields by name or module"
                placeholder="Search fields by name or module..."
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
              />
            </div>

            <div className="field-groups-scroll">
              {Array.from(groupedFields.entries()).map(([mod, fList]) => (
                <div key={mod} className="field-module-group">
                  <span className="field-module-title">{mod}</span>
                  <div className="field-checkbox-grid">
                    {fList.map((f) => {
                      const isSelected = selectedFields.includes(f.key);
                      return (
                        <label key={f.key} className="field-checkbox-label">
                          <input
                            type="checkbox"
                            aria-label={f.label}
                            checked={isSelected}
                            onChange={() => toggleField(f.key)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span className={isSelected ? 'font-semibold text-blue-700' : ''}>
                            {f.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unsupported Fields Notice */}
          {unsupportedFields.length > 0 ? (
            <div className="mt-2 p-2 bg-amber-50/60 border border-amber-100 rounded text-xs text-amber-800 flex items-start gap-1.5">
              <HelpCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <strong>Need more fields?</strong> Speed violations, FASTag plaza breakdown and DMS
                fatigue events are not yet available. Click &quot;Request Field&quot; above to
                submit.
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Selected Columns, Order & Aggregations (7 cols) */}
        <div className="lg:col-span-7 custom-builder-card !p-3.5">
          <div className="builder-section-title">
            <span>3. Configured Columns ({selectedFields.length} selected)</span>
            {selectedFields.length > 0 ? (
              <span className="text-xs text-slate-400 font-normal">
                Reorder columns or apply numeric aggregations
              </span>
            ) : null}
          </div>

          {!selectedFields.length ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
              No fields selected yet. Choose fields from the list on the left.
            </div>
          ) : (
            <div className="selected-columns-list max-h-[320px] overflow-y-auto pr-1">
              {selectedFields.map((fieldKey, idx) => {
                const def = fieldMetaMap.get(fieldKey) || {
                  label: fieldKey,
                  type: 'text',
                  aggregations: [],
                };
                const currentAgg = selectedAggregations.find((a) => a.field === fieldKey)?.op || '';

                return (
                  <div key={fieldKey} className="selected-col-item">
                    <div className="selected-col-left">
                      <span className="text-xs text-slate-400 w-4 font-mono">{idx + 1}.</span>
                      <span className="selected-col-name">{def.label}</span>
                      <span className="selected-col-badge">{def.type}</span>
                    </div>

                    <div className="selected-col-actions">
                      {/* Aggregation operator select */}
                      {def.aggregations?.length > 0 ? (
                        <SearchableSelect
                          className="agg-select"
                          value={currentAgg}
                          onChange={(e) => handleAggChange(fieldKey, e.target.value)}
                          title="Apply calculation (Totals / Averages)"
                        >
                          <option value="">No Summary</option>
                          {def.aggregations.map((op) => (
                            <option key={op} value={op}>
                              {op === 'SUM' ? 'Sum (Total)' : op === 'AVG' ? 'Average' : 'Count'}
                            </option>
                          ))}
                        </SearchableSelect>
                      ) : null}

                      {/* Move Up / Down */}
                      <button
                        type="button"
                        className="col-btn disabled:opacity-30"
                        disabled={idx === 0}
                        onClick={() => moveField(idx, -1)}
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        className="col-btn disabled:opacity-30"
                        disabled={idx === selectedFields.length - 1}
                        onClick={() => moveField(idx, 1)}
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        className="col-btn is-delete"
                        onClick={() => removeField(fieldKey)}
                        title="Remove Column"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sorting Row */}
          {selectedFields.length > 0 ? (
            <div className="flex items-center gap-3 pt-3 mt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-600">Sort Records By:</span>
              <SearchableSelect
                className="builder-select !py-1 !text-xs !w-auto"
                value={selectedSorting.field || ''}
                onChange={(e) => handleSortChange(e.target.value, selectedSorting.order)}
              >
                <option value="">Default Order</option>
                {selectedFields.map((fKey) => {
                  const def = fieldMetaMap.get(fKey);
                  return (
                    <option key={fKey} value={fKey}>
                      {def?.label || fKey}
                    </option>
                  );
                })}
              </SearchableSelect>
              <SearchableSelect
                className="builder-select !py-1 !text-xs !w-auto"
                value={selectedSorting.order || 'desc'}
                onChange={(e) => handleSortChange(selectedSorting.field, e.target.value)}
              >
                <option value="desc">Descending (High → Low)</option>
                <option value="asc">Ascending (Low → High)</option>
              </SearchableSelect>
            </div>
          ) : null}
        </div>
      </div>

      {/* 3. Filters & Scope */}
      <div className="custom-builder-card">
        <div className="builder-section-title">
          <span>4. Filters & Business Scope</span>
          <span className="text-xs text-slate-400 font-normal">
            Dates follow Asia/Kolkata (+05:30) convention
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="builder-field-group">
            <label htmlFor="cr-filter-start-date">Start Date</label>
            <input
              id="cr-filter-start-date"
              aria-label="Start Date"
              type="date"
              className="builder-input !py-1.5 !text-xs"
              value={currentFilters.startDate ? currentFilters.startDate.slice(0, 10) : ''}
              onChange={(e) =>
                handleFilterChange(
                  'startDate',
                  e.target.value ? `${e.target.value}T00:00:00.000+05:30` : '',
                )
              }
            />
          </div>

          <div className="builder-field-group">
            <label htmlFor="cr-filter-end-date">End Date</label>
            <input
              id="cr-filter-end-date"
              aria-label="End Date"
              type="date"
              className="builder-input !py-1.5 !text-xs"
              value={currentFilters.endDate ? currentFilters.endDate.slice(0, 10) : ''}
              onChange={(e) =>
                handleFilterChange(
                  'endDate',
                  e.target.value ? `${e.target.value}T23:59:59.999+05:30` : '',
                )
              }
            />
          </div>

          <div className="builder-field-group">
            <label htmlFor="cr-filter-fuel-type">Fuel Type Filter</label>
            <SearchableSelect
              id="cr-filter-fuel-type"
              aria-label="Fuel Type Filter"
              className="builder-select !py-1.5 !text-xs"
              value={currentFilters.fuelType || ''}
              onChange={(e) => handleFilterChange('fuelType', e.target.value)}
            >
              <option value="">All Fuel Types</option>
              <option value="DIESEL">Diesel</option>
              <option value="ADBLUE">AdBlue</option>
            </SearchableSelect>
          </div>

          <div className="builder-field-group">
            <label htmlFor="cr-filter-search">Search Text</label>
            <input
              id="cr-filter-search"
              aria-label="Search Text"
              type="text"
              className="builder-input !py-1.5 !text-xs"
              placeholder="Filter by vehicle or pump..."
              value={currentFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 4. Action Toolbar */}
      <div className="builder-actions-toolbar">
        <div className="builder-actions-left">
          <button
            type="button"
            className="btn-secondary-action"
            onClick={() => setSaveModalOpen(true)}
            disabled={!selectedFields.length}
          >
            <Save size={15} />
            <span>Save Configuration</span>
          </button>
        </div>

        <div className="builder-actions-right">
          <button
            type="button"
            className="btn-primary-action !py-2 !px-5"
            onClick={onRunPreview}
            disabled={!selectedFields.length || loading}
          >
            <Play size={15} />
            <span>{loading ? 'Executing Query...' : 'Generate Report Preview'}</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <SaveReportModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        initialConfig={config}
        currentSavedId={config.savedId || null}
      />

      <RequestFieldModal isOpen={requestModalOpen} onClose={() => setRequestModalOpen(false)} />
    </div>
  );
}
