import React, { useState } from 'react';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  SunMedium,
  Sparkles,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { DailyBriefService } from './DailyBriefService';
import { dailyBriefSchema } from '../../schemas/dailyBrief.schema';
import { formatINR, formatInrCompact, formatNum } from '../../utils/formatters';
import './DailyBrief.css';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Distinct, direct-labelled composition-bar hues (not status-coded).
const SEG_COLORS = [
  'var(--critical)',
  'var(--caution)',
  'var(--gnb-400)',
  '#7c3aed',
  '#0e8c8c',
  'var(--inert)',
];

function longDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DailyBriefPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, loading, refetch } = useApi(
    (signal) =>
      DailyBriefService.getBrief({ date: selectedDate }, signal).then((d) =>
        dailyBriefSchema.parse(d),
      ),
    [selectedDate],
  );

  const sections = data?.sections ?? [];
  const todayStr = new Date().toISOString().slice(0, 10);

  const changeDay = (delta) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + delta);
    setSelectedDate(cur.toISOString().slice(0, 10));
  };

  // Money leaks, biggest first; clean checks; and sections not live yet.
  const losses = sections
    .filter((s) => s.status === 'ok' && (s.rupees ?? 0) > 0)
    .sort((a, b) => (b.rupees ?? 0) - (a.rupees ?? 0));
  const clean = sections.filter((s) => s.status === 'empty');
  const soon = sections.filter((s) => s.status === 'not_available_yet');

  const lossTotal = losses.reduce((acc, s) => acc + (s.rupees ?? 0), 0);
  const total = data?.totalRupees ?? lossTotal;
  const top = losses[0];
  const segTotal = lossTotal || 1;
  const hasAnything = losses.length || clean.length || soon.length;

  return (
    <div className="db-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="db-head">
        <div>
          <div className="db-eyebrow">
            <span className="db-dot" aria-hidden="true">
              <SunMedium className="w-4 h-4" />
            </span>
            <span className="k">Morning briefing</span>
            <span className="db-date">{longDate(selectedDate)}</span>
          </div>
          <h1 className="db-h1">Today&apos;s Fleet Brief</h1>
          <p className="db-sub">
            Where the fleet lost money today, how much in rupees, and the one thing worth doing
            about it first.
          </p>
        </div>

        <div className="db-ctrls">
          <div className="db-stepper" role="group" aria-label="Brief date">
            <button
              type="button"
              className="db-ico-btn"
              onClick={() => changeDay(-1)}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              className="db-date-input"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Pick brief date"
            />
            <button
              type="button"
              className="db-ico-btn"
              onClick={() => changeDay(1)}
              disabled={selectedDate >= todayStr}
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button type="button" className="db-ico-btn" onClick={refetch} aria-label="Refresh brief">
            <RotateCw className={`w-4 h-4 ${loading ? 'db-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Hero summary ───────────────────────────────────── */}
      <section className="db-hero" aria-label="Leakage summary">
        <div className="db-hero-top">
          <div>
            <div className="db-label">Identified leakage today</div>
            <div className={`db-big ${total > 0 ? '' : 'is-clear'}`}>
              {total > 0 ? formatINR(total) : '₹0'}
            </div>
            <p className="db-hero-note">
              {losses.length > 0
                ? `Across ${formatNum(losses.length)} ${
                    losses.length === 1 ? 'issue' : 'issues'
                  } worth acting on. Clean checks are listed below.`
                : 'No money leaks flagged for this day. Clean checks are listed below.'}
            </p>
          </div>
          <div className="db-splits">
            <div className="db-split a">
              <div className="cap">
                <span className="tag" />
                Biggest leak
              </div>
              <div className="v">{top ? formatINR(top.rupees) : '₹0'}</div>
              <div className="d">{top ? top.label : 'Nothing flagged today'}</div>
            </div>
            <div className="db-split b">
              <div className="cap">
                <span className="tag" />
                Clean today
              </div>
              <div className="v">{formatNum(clean.length)}</div>
              <div className="d">{clean.length === 1 ? 'check all clear' : 'checks all clear'}</div>
            </div>
          </div>
        </div>

        {losses.length > 0 && (
          <div className="db-comp">
            <div className="hd">
              <span>Where the {formatINR(lossTotal)} went</span>
              <span className="num">
                {formatNum(losses.length)} {losses.length === 1 ? 'category' : 'categories'}
              </span>
            </div>
            <div
              className="db-bar"
              role="img"
              aria-label={losses
                .map((s) => `${s.label} ${Math.round(((s.rupees ?? 0) / segTotal) * 100)} percent`)
                .join(', ')}
            >
              {losses.map((s, i) => {
                const pct = Math.round(((s.rupees ?? 0) / segTotal) * 100);
                return (
                  <div
                    key={s.key}
                    className="db-seg"
                    style={{ flex: s.rupees ?? 0, background: SEG_COLORS[i % SEG_COLORS.length] }}
                    title={`${s.label} — ${formatINR(s.rupees)} (${pct}%)`}
                  >
                    <span className="n">
                      {s.label} {formatInrCompact(s.rupees)}
                    </span>
                    <span className="p">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── Start here ─────────────────────────────────────── */}
      {top?.suggestedAction && (
        <section className="db-start" aria-label="Priority action">
          <span className="ic" aria-hidden="true">
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="tx">
            <span className="k">Start here</span>
            <span className="m">{top.suggestedAction}</span>
          </div>
        </section>
      )}

      {/* ── Losses ─────────────────────────────────────────── */}
      {losses.length > 0 && (
        <>
          <div className="db-sec">
            <h2>Where money leaked</h2>
            <span className="hint">ranked by rupees lost</span>
            <span className="rule" />
          </div>
          <div className="db-losses">
            {losses.map((s, i) => (
              <article className="db-loss" key={s.key}>
                <div className="row1">
                  <span className="db-rank">
                    <span className="num">{i + 1}</span>
                    {i === 0 ? 'Biggest loss' : `Loss #${i + 1}`}
                  </span>
                  <span className="db-amt">{formatINR(s.rupees)}</span>
                </div>
                <h3>{s.label}</h3>
                {(s.suggestedAction || s.reason) && (
                  <p className="lead">{s.suggestedAction || s.reason}</p>
                )}
                {s.events?.length > 0 && (
                  <div className="db-events">
                    {s.events.slice(0, 5).map((ev) => (
                      <div className="db-event" key={ev.vehicleId}>
                        <span className="plate">{ev.registrationNumber || 'Unknown'}</span>
                        <span className="dur">
                          <Clock className="w-3 h-3 inline -mt-0.5 mr-1" />
                          {formatNum(ev.durationMin)} min
                        </span>
                        <span className="r">{formatInrCompact(ev.rupees)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {/* ── Clean / coming soon ────────────────────────────── */}
      {(clean.length > 0 || soon.length > 0) && (
        <>
          <div className="db-sec">
            <h2>Clean today</h2>
            <span className="hint">checked, nothing to act on</span>
            <span className="rule" />
          </div>
          <div className="db-healthy">
            {clean.map((s) => (
              <div className="db-hc" key={s.key}>
                <span className="ic" aria-hidden="true">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <div className="t">{s.label}</div>
                  <div className="d">{s.reason || 'Nothing to report today.'}</div>
                </div>
              </div>
            ))}
            {soon.map((s) => (
              <div className="db-hc soon" key={s.key}>
                <span className="ic" aria-hidden="true">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <div className="t">{s.label}</div>
                  <div className="d">{s.reason || 'Coming soon.'}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Nothing at all ─────────────────────────────────── */}
      {!hasAnything && (
        <div className="db-empty">
          <span className="ic" aria-hidden="true">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <h3>{loading ? 'Loading the brief…' : 'No money leaks flagged today'}</h3>
          <p>
            {loading
              ? 'Pulling the day’s most economically-significant events.'
              : 'Nothing economically significant turned up for this date. Pick another day above.'}
          </p>
        </div>
      )}

      <div className="db-foot-note">
        <span>
          <ArrowRight className="w-3 h-3 inline -mt-0.5 mr-1" />
          Figures are for the IST day and recompute on refresh.
        </span>
      </div>
    </div>
  );
}
