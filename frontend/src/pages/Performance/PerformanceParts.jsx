import React, { useMemo, useState } from 'react';
import { Inbox, Search } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import { reasonLine } from './performanceGaps';
import '../Intelligence/reportCardsReference.css';
import './performancePanels.css';

/**
 * The briefing every Intelligence tab opens with: a sentence on the left and
 * four figures on the right, in the Trucks tab's shell.
 */
export function PerformanceBriefing({ label, eyebrow, lead, notes = [], kpis = [], children }) {
  return (
    <section className="intel-assessment-briefing" aria-label={label}>
      <div className="intel-assessment-brief-copy">
        <span>✧ {eyebrow}</span>
        <p>{lead}</p>
        {notes.filter(Boolean).map((note) => (
          <small key={note}>{note}</small>
        ))}
        {children}
      </div>
      <div className="intel-assessment-brief-kpis">
        {kpis.map((kpi) => (
          <div className="pf-kpi" key={kpi.label}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.note}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * The tab when no row has a single number: one card that says what is missing
 * and why, instead of a briefing of dashes over a table of bare names.
 */
export function PerformanceNoNumbers({ title, lead, notes = [] }) {
  return (
    <section className="pf-card pf-empty" aria-label={title}>
      <Inbox size={20} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{lead}</p>
      {notes.length ? (
        <ul>
          {notes.map((note) => {
            const line = reasonLine(note);
            return (
              <li key={line.labels}>
                <b>{line.labels}</b>
                <span>{line.reason}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

/**
 * The searchable table of the Vehicles and Drivers tabs, in the Trucks tab's
 * table shell. The rows scroll inside the card under a sticky header, so the
 * page stays the height of the screen. A row opens its drawer.
 */
export function PerformanceTable({
  columns,
  rows,
  rowKey,
  searchText,
  searchLabel,
  placeholder,
  noun,
  openKey = null,
  onOpen,
  emptyTitle,
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => searchText(row).toLowerCase().includes(needle));
  }, [rows, query, searchText]);

  const countText = query.trim()
    ? `${filtered.length.toLocaleString('en-IN')} of ${rows.length.toLocaleString('en-IN')} ${noun.many}`
    : `${rows.length.toLocaleString('en-IN')} ${rows.length === 1 ? noun.one : noun.many}`;

  return (
    <DataTable
      className="intel-assessments-table pf-table"
      columns={columns}
      rows={filtered}
      rowKey={rowKey}
      onRowClick={onOpen}
      rowClassName={(row) => (rowKey(row) === openKey ? 'dt-row--selected' : '')}
      showing={filtered.length}
      total={rows.length}
      activeFilters={query.trim() ? 1 : 0}
      emptyTitle={query.trim() ? `Nothing matches “${query.trim()}”` : emptyTitle}
      toolbarExtra={
        <div className="intel-tab-tools">
          <span className="pf-count" aria-live="polite">
            {countText}
          </span>
          <div className="intel-search-box">
            <Search size={14} aria-hidden="true" className="intel-search-icon" />
            <input
              type="search"
              aria-label={searchLabel}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="intel-search-input"
            />
          </div>
        </div>
      }
    />
  );
}

/** A titled block inside a drawer. */
export function DrawerSection({ title, sub = null, children }) {
  return (
    <section className="pf-section" aria-label={title}>
      <header className="pf-section-head">
        <h3>{title}</h3>
        {sub ? <p>{sub}</p> : null}
      </header>
      {children}
    </section>
  );
}
