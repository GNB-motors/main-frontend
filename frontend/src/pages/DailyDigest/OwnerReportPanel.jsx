import { useMemo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import DigestSkeleton from './components/DigestSkeleton';
import {
  DASH,
  briefSections,
  formatValue,
  numberPairs,
  rowPairs,
  sectionFooter,
  sectionReason,
  sectionState,
  sectionTitle,
} from './ownerReportModel';

/**
 * The owner's day: the morning brief on top, the eight report sections under
 * it, and the two people lists below that.
 *
 * The rules this panel keeps:
 *   - a section is never missing: it is ok | empty | error, and it says which;
 *   - an unknown is "—" with the reason beside it, never a zero;
 *   - the good-driver and needs-attention lists are ALWAYS rendered — an empty
 *     one says "No one this time" instead of disappearing.
 */

const STATE_LABEL = { ok: 'Measured', empty: 'Nothing yet', error: 'Failed' };

function RetryButton({ onRetry, label = 'Retry' }) {
  return (
    <button type="button" className="fo-text-link" onClick={onRetry}>
      {label} <RefreshCw size={14} />
    </button>
  );
}

function MorningBriefCard({ brief$, day }) {
  const brief = brief$.data;
  const sections = useMemo(() => briefSections(brief), [brief]);

  if (brief$.loading && !brief) {
    return (
      <section className="fo-card fo-owner-brief">
        <DigestSkeleton label="Loading the morning brief" />
      </section>
    );
  }

  if (brief$.error) {
    const forbidden = brief$.error?.status === 403;
    return (
      <section className="fo-card fo-owner-brief">
        <p className="fo-card-title">Morning brief</p>
        <p className="fo-owner-error">
          {forbidden ? 'Not available for your role' : "Couldn't load"} ·{' '}
          {forbidden ? null : <RetryButton onRetry={brief$.refetch} />}
        </p>
        <p className="fo-owner-note">
          {forbidden
            ? 'The morning brief is read by owners and managers only.'
            : brief$.error?.message || 'The morning brief could not be read.'}
        </p>
      </section>
    );
  }

  return (
    <section className="fo-card fo-owner-brief">
      <p className="fo-card-title">Morning brief</p>
      <p className="fo-owner-brief-total">
        <strong>{formatValue('totalRupees', brief?.totalRupees)}</strong>
        <span> lost on {day}</span>
      </p>
      {sections.length === 0 ? (
        <p className="fo-owner-note">Nothing was flagged for this day — no leak measured.</p>
      ) : (
        <div className="fo-owner-brief-list">
          {sections.map((section) => (
            <div className="fo-owner-brief-row" key={section.key}>
              <div>
                <span className="fo-owner-brief-label">{section.label}</span>
                {section.status === 'empty' ? (
                  <span className="fo-owner-note">Nothing lost here this time.</span>
                ) : (
                  <span className="fo-owner-brief-action">
                    {section.suggestedAction || 'No suggested action was returned.'}
                  </span>
                )}
              </div>
              <div className="fo-owner-brief-amount">
                {section.rupees == null ? DASH : `₹${section.rupees.toLocaleString('en-IN')}`}
              </div>
              {section.vehicles.length ? (
                <ul className="fo-owner-brief-vehicles">
                  {section.vehicles.map((v) => (
                    <li key={v.registrationNumber}>
                      <span>{v.registrationNumber}</span>
                      <span>
                        {v.rupees == null ? DASH : `₹${v.rupees.toLocaleString('en-IN')}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {brief?.disclaimer ? <p className="fo-owner-note">{brief.disclaimer}</p> : null}
    </section>
  );
}

function ReportSection({ section, onRetry }) {
  const state = sectionState(section);
  const numbers = useMemo(() => numberPairs(section?.numbers), [section?.numbers]);
  const rows = useMemo(() => rowPairs(section?.rows), [section?.rows]);

  return (
    <section className={`fo-card fo-owner-section fo-owner-section--${state}`}>
      <div className="fo-owner-section-head">
        <p className="fo-card-title">{sectionTitle(section)}</p>
        <span className={`fo-badge fo-tone--${state === 'ok' ? 'good' : state === 'error' ? 'act' : 'info'}`}>
          {STATE_LABEL[state]}
        </span>
      </div>

      {state === 'error' ? (
        <>
          <p className="fo-owner-error">
            Couldn't load · <RetryButton onRetry={onRetry} />
          </p>
          <p className="fo-owner-note">{section?.error || 'The section query failed.'}</p>
        </>
      ) : null}

      {state === 'empty' ? (
        <>
          <p className="fo-owner-figure">{DASH}</p>
          <p className="fo-owner-note">{sectionReason(section)}</p>
        </>
      ) : null}

      {state === 'ok' ? (
        <>
          <dl className="fo-kv">
            {numbers.map((pair) => (
              <div key={pair.key} className={pair.unknown ? 'is-unknown' : undefined}>
                <dt>{pair.label}</dt>
                <dd>{pair.value}</dd>
              </div>
            ))}
          </dl>
          {rows.length ? (
            <ul className="fo-owner-rows">
              {rows.map((row, i) => (
                <li key={`${row.label}-${i}`}>
                  <span className="fo-owner-row-label">{row.label}</span>
                  {row.note ? <span className="fo-owner-note">{row.note}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {state !== 'error' && sectionFooter(section) ? (
        <p className="fo-owner-footer">{sectionFooter(section)}</p>
      ) : null}
    </section>
  );
}

function SubjectList({ title, note, items }) {
  return (
    <section className="fo-card fo-owner-people-card">
      <p className="fo-card-title">{title}</p>
      {items.length === 0 ? (
        <p className="fo-owner-empty">No one this time</p>
      ) : (
        <ul className="fo-owner-people-list">
          {items.map((item) => (
            <li key={item.id || item.name}>
              <span className="fo-owner-row-label">{item.name || item.id || '—'}</span>
              <span className="fo-owner-note">{item.headline || item.grade || ''}</span>
              {item.score != null ? (
                <span className="fo-owner-people-score">{item.score}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {note ? <p className="fo-owner-note">{note}</p> : null}
    </section>
  );
}

export default function OwnerReportPanel({ day, digest }) {
  const brief$ = useApi((signal) => fleetViewService.getMorningBrief({ date: day, signal }), [day]);
  const report$ = useApi((signal) => fleetViewService.getOwnerReport({ day, signal }), [day]);

  const sections = Array.isArray(report$.data?.sections) ? report$.data.sections : [];
  const goodDrivers = Array.isArray(digest?.goodDrivers) ? digest.goodDrivers : [];
  const needsAttention = Array.isArray(digest?.needsAttention) ? digest.needsAttention : [];

  return (
    <section className="fo-panel fo-owner" aria-labelledby="fo-owner-title">
      <div className="fo-section-head">
        <div>
          <div className="fo-eyebrow">Owner&apos;s report</div>
          <h2 id="fo-owner-title">Aaj ka hisaab</h2>
          <p>
            Eight sections for {day}. Each one says whether it was measured, whether it was empty,
            or whether it failed — never a silent zero.
          </p>
        </div>
      </div>

      <MorningBriefCard brief$={brief$} day={day} />

      {report$.loading && !report$.data ? (
        <div className="fo-owner-grid">
          <DigestSkeleton label="Loading the owner's report" />
        </div>
      ) : report$.error ? (
        <div className="fo-owner-grid">
          <section className="fo-card fo-owner-section fo-owner-section--error">
            <div className="fo-owner-section-head">
              <p className="fo-card-title">Owner&apos;s report</p>
              <span className="fo-badge fo-tone--act">
                <AlertTriangle size={13} /> Failed
              </span>
            </div>
            <p className="fo-owner-error">
              Couldn&apos;t load · <RetryButton onRetry={report$.refetch} />
            </p>
            <p className="fo-owner-note">{report$.error?.message || 'The report could not be read.'}</p>
          </section>
        </div>
      ) : (
        <div className="fo-owner-grid">
          {sections.map((section) => (
            <ReportSection
              key={section?.id || section?.title}
              section={section}
              onRetry={report$.refetch}
            />
          ))}
        </div>
      )}

      <div className="fo-owner-people">
        <SubjectList
          title="Who drove well"
          items={goodDrivers}
          note="Drivers who beat your own fleet average over the last 30 days."
        />
        <SubjectList
          title="Who needs a word"
          items={needsAttention}
          note="Trucks and drivers whose behaviour dropped over the last 30 days."
        />
      </div>
    </section>
  );
}
