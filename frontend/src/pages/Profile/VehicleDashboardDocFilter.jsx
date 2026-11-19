import { useMemo } from 'react';
import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { FileText, AlertCircle, Clock, FileQuestion, CheckCircle2, Layers } from 'lucide-react';
import { DOC_COLS } from './vehicleDashboardLogic';

/**
 * Clean & intuitive document compliance filter:
 * 1. Severity Pills on top: All, Expired (Red), Expiring Soon (Yellow), Missing (Gray), Healthy (Green)
 * 2. Document Dropdown below: All Documents, RC, Fitness, Insurance, PUCC, etc.
 */
export default function VehicleDashboardDocFilter({
  docFilter,
  setDocFilter,
  rows = [],
  displayRows = [],
  filterOptionsWithCounts = {},
}) {
  const { severity, docType } = useMemo(() => {
    if (!docFilter || docFilter === 'ALL') return { severity: 'ALL', docType: 'ALL' };
    if (docFilter === 'EXPIRED_ANY' || docFilter === 'EXPIRED')
      return { severity: 'EXPIRED', docType: 'ALL' };
    if (docFilter === 'EXPIRING_SOON') return { severity: 'EXPIRING_SOON', docType: 'ALL' };
    if (docFilter === 'MISSING_ANY' || docFilter === 'MISSING')
      return { severity: 'MISSING', docType: 'ALL' };
    if (docFilter === 'HEALTHY') return { severity: 'HEALTHY', docType: 'ALL' };

    if (docFilter.startsWith('EXPIRED_'))
      return { severity: 'EXPIRED', docType: docFilter.replace('EXPIRED_', '') };
    if (docFilter.startsWith('SOON_'))
      return { severity: 'EXPIRING_SOON', docType: docFilter.replace('SOON_', '') };
    if (docFilter.startsWith('MISSING_'))
      return { severity: 'MISSING', docType: docFilter.replace('MISSING_', '') };
    if (docFilter.startsWith('HEALTHY_'))
      return { severity: 'HEALTHY', docType: docFilter.replace('HEALTHY_', '') };
    if (docFilter.startsWith('DOC_'))
      return { severity: 'ALL', docType: docFilter.replace('DOC_', '') };

    return { severity: 'ALL', docType: 'ALL' };
  }, [docFilter]);

  const updateFilters = (newSeverity, newDocType) => {
    if (newSeverity === 'ALL' && newDocType === 'ALL') {
      setDocFilter('ALL');
    } else if (newSeverity === 'EXPIRED') {
      setDocFilter(newDocType === 'ALL' ? 'EXPIRED_ANY' : `EXPIRED_${newDocType}`);
    } else if (newSeverity === 'EXPIRING_SOON') {
      setDocFilter(newDocType === 'ALL' ? 'EXPIRING_SOON' : `SOON_${newDocType}`);
    } else if (newSeverity === 'MISSING') {
      setDocFilter(newDocType === 'ALL' ? 'MISSING_ANY' : `MISSING_${newDocType}`);
    } else if (newSeverity === 'HEALTHY') {
      setDocFilter(newDocType === 'ALL' ? 'HEALTHY' : `HEALTHY_${newDocType}`);
    } else if (newDocType !== 'ALL') {
      setDocFilter(`DOC_${newDocType}`);
    } else {
      setDocFilter('ALL');
    }
  };

  const getDocCount = (key) => {
    if (severity === 'EXPIRED') return filterOptionsWithCounts.expiredByDoc?.[key] ?? 0;
    if (severity === 'EXPIRING_SOON') return filterOptionsWithCounts.soonByDoc?.[key] ?? 0;
    if (severity === 'MISSING') return filterOptionsWithCounts.missingByDoc?.[key] ?? 0;
    return (
      filterOptionsWithCounts.totalIssuesByDoc?.[key] ??
      filterOptionsWithCounts.expiredByDoc?.[key] ??
      0
    );
  };

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'ALL') {
      updateFilters(severity, 'ALL');
    } else if (val === 'EXPIRED_ANY') {
      updateFilters('EXPIRED', 'ALL');
    } else if (val === 'EXPIRING_SOON') {
      updateFilters('EXPIRING_SOON', 'ALL');
    } else if (val === 'MISSING_ANY') {
      updateFilters('MISSING', 'ALL');
    } else if (val.startsWith('EXPIRED_')) {
      updateFilters('EXPIRED', val.replace('EXPIRED_', ''));
    } else if (val.startsWith('SOON_')) {
      updateFilters('EXPIRING_SOON', val.replace('SOON_', ''));
    } else {
      updateFilters(severity, val);
    }
  };

  const activeSelectValue =
    docType !== 'ALL'
      ? docType
      : severity === 'EXPIRED'
        ? 'EXPIRED_ANY'
        : severity === 'EXPIRING_SOON'
          ? 'EXPIRING_SOON'
          : severity === 'MISSING'
            ? 'MISSING_ANY'
            : 'ALL';

  return (
    <div className="v-dash-filter-container" aria-label="Document compliance filters">
      {/* 1. SEVERITY PILLS ROW ON TOP */}
      <div
        className="v-dash-severity-pills-row"
        role="tablist"
        aria-label="Filter by document status"
      >
        <button
          type="button"
          role="tab"
          aria-selected={severity === 'ALL'}
          className={`v-dash-severity-pill v-dash-severity-pill--all ${severity === 'ALL' ? 'v-dash-severity-pill--active' : ''}`}
          onClick={() => updateFilters('ALL', docType)}
        >
          <Layers size={14} />
          <span>All Vehicles</span>
          <span className="v-dash-severity-pill-count">{rows.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={severity === 'EXPIRED'}
          className={`v-dash-severity-pill v-dash-severity-pill--expired ${severity === 'EXPIRED' ? 'v-dash-severity-pill--active' : ''}`}
          onClick={() => updateFilters(severity === 'EXPIRED' ? 'ALL' : 'EXPIRED', docType)}
        >
          <AlertCircle size={14} />
          <span>Expired</span>
          <span className="v-dash-severity-pill-count">
            {filterOptionsWithCounts.anyExpiredCount ?? 0}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={severity === 'EXPIRING_SOON'}
          className={`v-dash-severity-pill v-dash-severity-pill--warning ${severity === 'EXPIRING_SOON' ? 'v-dash-severity-pill--active' : ''}`}
          onClick={() =>
            updateFilters(severity === 'EXPIRING_SOON' ? 'ALL' : 'EXPIRING_SOON', docType)
          }
        >
          <Clock size={14} />
          <span>Expiring Soon (&lt; 30d)</span>
          <span className="v-dash-severity-pill-count">
            {filterOptionsWithCounts.anyExpiringSoonCount ?? 0}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={severity === 'MISSING'}
          className={`v-dash-severity-pill v-dash-severity-pill--missing ${severity === 'MISSING' ? 'v-dash-severity-pill--active' : ''}`}
          onClick={() => updateFilters(severity === 'MISSING' ? 'ALL' : 'MISSING', docType)}
        >
          <FileQuestion size={14} />
          <span>Missing Docs</span>
          <span className="v-dash-severity-pill-count">
            {filterOptionsWithCounts.anyMissingCount ?? 0}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={severity === 'HEALTHY'}
          className={`v-dash-severity-pill v-dash-severity-pill--healthy ${severity === 'HEALTHY' ? 'v-dash-severity-pill--active' : ''}`}
          onClick={() => updateFilters(severity === 'HEALTHY' ? 'ALL' : 'HEALTHY', docType)}
        >
          <CheckCircle2 size={14} />
          <span>Healthy / OK</span>
          <span className="v-dash-severity-pill-count">
            {filterOptionsWithCounts.healthyCount ?? 0}
          </span>
        </button>
      </div>

      {/* 2. DOCUMENT DROPDOWN & CLEAR BUTTON ROW */}
      <div className="v-dash-doc-select-bar">
        <div className="v-dash-doc-select-group">
          <label htmlFor="v-dash-doc-filter" className="v-dash-filter-label">
            <FileText size={15} color="#2563eb" />
            <span>Document Filter:</span>
          </label>
          <div className="v-dash-dropdown-wrapper">
            <SearchableSelect
              id="v-dash-doc-filter"
              className="v-dash-filter-select"
              value={activeSelectValue}
              onChange={handleSelectChange}
            >
              <option value="ALL">All Documents (No Filter) — ({rows.length} vehicles)</option>
              <optgroup label="⚡ Quick Status Filters">
                <option value="EXPIRING_SOON">
                  ⚠️ Expiring Soon (&lt; 30 Days) — (
                  {filterOptionsWithCounts.anyExpiringSoonCount ?? 0})
                </option>
                <option value="EXPIRED_ANY">
                  🔴 Any Expired Document — ({filterOptionsWithCounts.anyExpiredCount ?? 0})
                </option>
                <option value="MISSING_ANY">
                  ⚪ Missing Documents — ({filterOptionsWithCounts.anyMissingCount ?? 0})
                </option>
              </optgroup>
              <optgroup label="Filter by Document Type">
                {DOC_COLS.map(({ key, label }) => {
                  const cnt = getDocCount(key);
                  return (
                    <option key={`doc-${key}`} value={key}>
                      {label} — ({cnt} vehicles)
                    </option>
                  );
                })}
              </optgroup>
            </SearchableSelect>
          </div>
        </div>

        {docFilter !== 'ALL' && (
          <button
            type="button"
            className="v-dash-filter-reset-btn"
            onClick={() => setDocFilter('ALL')}
          >
            Showing {displayRows.length} of {rows.length} &middot; Clear Filter &times;
          </button>
        )}
      </div>
    </div>
  );
}
