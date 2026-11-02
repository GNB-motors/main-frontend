import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { formatIstDate } from '../../utils/redesign/format';
import { intelligenceLink } from '../../utils/redesign/links';
import DigestStoryCard from './DigestStoryCard';
import DigestReconnectBanner from './DigestReconnectBanner';
import DigestReportCardTile from './DigestReportCardTile';
import ReleaseDigest from './ReleaseDigest';

/**
 * DailyDigest — the day's story.
 *
 * It is the first thing the owner sees, so it reads like a person wrote
 * it: what ran, what was empty, who drove well, who needs a word, and what
 * is waiting for an answer. Every number carries the API's own sentence.
 *
 * The new endpoint is not on prod yet. While it answers 404 the release's
 * digest is shown unchanged, so the page is never empty and never broken.
 */
export default function DailyDigestPage() {
  const [date, setDate] = useState(() => new Date());
  const dateParam = useMemo(() => date.toISOString().slice(0, 10), [date]);

  const { data, loading, error, refetch } = useApi(
    (signal) => fleetViewService.getDigest({ date: dateParam, signal }),
    [dateParam],
  );

  // The release digest, kept for the 404 case.
  if (error?.status === 404) {
    return <ReleaseDigest />;
  }

  const story = Array.isArray(data?.story) ? data.story : [];
  const reconnect = Array.isArray(data?.reconnect) ? data.reconnect : [];
  const goodDrivers = Array.isArray(data?.goodDrivers) ? data.goodDrivers : [];
  const needsAttention = Array.isArray(data?.needsAttention) ? data.needsAttention : [];

  const shiftDate = (days) => {
    const next = new Date(date.getTime());
    next.setDate(next.getDate() + days);
    setDate(next);
  };

  const isToday = dateParam === new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="m-0 text-[20px] font-semibold text-[var(--rd-ink)]">
            {isToday ? 'Good morning' : 'Daily Digest'}
          </h1>
          <p className="m-0 mt-0.5 text-[13px] text-[var(--rd-ink-2)]">
            {formatIstDate(date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftDate(-1)}
            aria-label="Previous day"
            className="flex size-8 items-center justify-center rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] text-[var(--rd-ink-2)] transition-colors hover:border-[var(--rd-line-strong)]"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <input
            type="date"
            value={dateParam}
            onChange={(event) => {
              const next = new Date(event.target.value);
              if (!Number.isNaN(next.getTime())) setDate(next);
            }}
            aria-label="Digest date"
            className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-2 py-1.5 text-[13px] text-[var(--rd-ink)]"
          />
          <button
            type="button"
            onClick={() => shiftDate(1)}
            disabled={isToday}
            aria-label="Next day"
            className="flex size-8 items-center justify-center rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] text-[var(--rd-ink-2)] transition-colors hover:border-[var(--rd-line-strong)] disabled:opacity-40"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      {loading && !data ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">Writing the day&apos;s story…</p>
      ) : error ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
          We could not load today&apos;s digest.
        </p>
      ) : (
        <>
          {data?.headline ? (
            <p className="mb-4 text-[20px] leading-7 font-semibold text-[var(--rd-ink)]">
              {data.headline}
            </p>
          ) : null}

          {reconnect.map((item) => (
            <DigestReconnectBanner key={item.accountName} item={item} />
          ))}

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 min-[1200px]:grid-cols-3">
            {story.map((card) => (
              <DigestStoryCard key={card.key} card={card}>
                {card.key === 'goodDrivers' && goodDrivers.length ? (
                  <div className="mt-2 flex flex-col gap-1">
                    {goodDrivers.map((driver) => (
                      <DigestReportCardTile
                        key={`good-${driver.id}`}
                        card={driver}
                        linkTo={intelligenceLink({ tab: 'drivers', driver: driver.id })}
                      />
                    ))}
                  </div>
                ) : null}
                {card.key === 'needsWord' && needsAttention.length ? (
                  <div className="mt-2 flex flex-col gap-1">
                    {needsAttention.map((subject) => (
                      <DigestReportCardTile
                        key={`needs-${subject.id}`}
                        card={subject}
                        linkTo={intelligenceLink({
                          tab: subject.subject === 'driver' ? 'drivers' : 'vehicles',
                          vehicle: subject.subject === 'vehicle' ? subject.id : null,
                          driver: subject.subject === 'driver' ? subject.id : null,
                        })}
                      />
                    ))}
                  </div>
                ) : null}
              </DigestStoryCard>
            ))}
          </div>

          {story.length === 0 ? (
            <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
              Nothing happened on this day that we can report yet.
            </p>
          ) : null}

          <div className="mt-4">
            <button
              type="button"
              onClick={refetch}
              className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] px-3 py-1.5 text-[13px] font-medium text-[var(--rd-ink-2)] transition-colors hover:border-[var(--rd-line-strong)]"
            >
              Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}
