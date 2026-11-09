import { useDeferredValue, useReducer, useState } from 'react';
import RouteHubService from '../../../services/RouteHubService';
import { useApi } from '../../../hooks/useApi';
import { useMutation } from '../../../hooks/useMutation';
import Ico from '../routeHubIcons.jsx';
import { KpiRow, RefreshButton } from '../routeHubShared.jsx';
import { downloadCsv, fmtDT, inr } from '../routeHubFormat';
import { dayRange, groupByTrip, legLabel, tripLabel } from './deviation/deviationRules.js';
import DeviationFilterBar from './deviation/DeviationFilterBar.jsx';
import DeviationFeed from './deviation/DeviationFeed.jsx';
import DeviationDetail from './deviation/DeviationDetail.jsx';

const PAGE_SIZE = 100;
function filtersReducer(state, action) {
  if (action.type === 'set') {
    // Any filter change starts again from the first page.
    return {
      ...state,
      [action.field]: action.value,
      page: action.field === 'page' ? action.value : 1,
    };
  }
  return state;
}

export default function DeviationView({ params, toast, setBadge, go }) {
  const [filters, dispatch] = useReducer(filtersReducer, {
    q: params.get('q') || '',
    from: '',
    to: '',
    status: 'all',
    leg: 'all',
    page: 1,
  });
  const [selId, setSelId] = useState(params.get('d') || null);
  const q = useDeferredValue(filters.q.trim());
  const unfiltered =
    !filters.from && !filters.to && filters.status === 'all' && filters.leg === 'all' && !q;
  const listScope = JSON.stringify([
    q,
    filters.from,
    filters.to,
    filters.status,
    filters.leg,
    filters.page,
  ]);

  const list = useApi(
    (signal) =>
      RouteHubService.getDeviationEvents(
        {
          q: q || undefined,
          ...dayRange(filters.from, filters.to),
          status: filters.status === 'all' ? undefined : filters.status,
          leg: filters.leg === 'all' ? undefined : filters.leg,
          page: filters.page,
          limit: PAGE_SIZE,
        },
        signal,
      ).then((data) => {
        if (unfiltered && !signal.aborted)
          setBadge('deviation', data.summary?.open ?? data.openCount ?? 0);
        return data;
      }),
    [listScope],
    { scopeKey: listScope },
  );

  const summary = list.data?.summary || null;
  const rows = list.data?.records || [];
  const hasOpenCost =
    summary?.openCostCount != null ? summary.openCostCount > 0 : summary?.openCostInr > 0;
  const groups = groupByTrip(rows);
  const selected = rows.find((d) => d._id === selId) || rows[0] || null;
  const selectedId = selected?._id || null;
  const siblings = selected?.trip?.autoTripId
    ? rows.filter((d) => String(d.trip?.autoTripId) === String(selected.trip.autoTripId))
    : [];

  const detail = useApi(
    (signal) => RouteHubService.getDeviationEvent(selectedId, signal),
    [selectedId],
    {
      enabled: Boolean(selectedId),
      scopeKey: selectedId,
    },
  );

  const review = useMutation((payload, { signal }) =>
    RouteHubService.reviewDeviationEvent(payload, { signal }),
  );

  const onReview = async (body) => {
    try {
      await review.mutate({ id: selectedId, ...body });
      toast(
        body.status === 'OPEN'
          ? `${selected.registrationNumber} reopened`
          : `${selected.registrationNumber} marked reviewed`,
      );
      list.refetch();
      detail.refetch();
    } catch (e) {
      toast(e?.response?.data?.message || 'Could not update the deviation');
    }
  };

  const first = list.loading && !list.data;
  const kpis = [
    {
      ic: 'alert',
      l: 'Open — please review',
      v: summary?.open ?? 0,
      s: 'detours nobody has looked at yet',
      c: '#C56200',
      tint: 'rgba(240,170,72,.16)',
      vc: '#C56200',
    },
    {
      ic: 'split',
      l: 'Detours',
      v: summary?.total ?? 0,
      s: !summary
        ? 'in this period'
        : summary.trips
          ? `on ${summary.trips} trip${summary.trips === 1 ? '' : 's'}`
          : 'none on a recorded trip',
      c: 'var(--nova-rage-600)',
      tint: 'var(--nova-rage-a10)',
    },
    {
      ic: 'truck',
      l: 'While loaded',
      v: summary?.byLeg?.LADEN ?? 0,
      s: 'detours with goods on board',
      c: '#C2323A',
      tint: 'rgba(229,104,107,.14)',
    },
    {
      ic: 'rupee',
      l: 'Est. detour cost',
      v: hasOpenCost && summary?.openCostInr != null ? inr(summary.openCostInr) : '—',
      s:
        !hasOpenCost || summary?.openCostInr == null
          ? 'detour cost not estimated yet'
          : summary.openCostCount != null && summary.openCostCount < summary.open
            ? `estimated fuel and wear · ${summary.openCostCount} of ${summary.open} open detours priced`
            : 'estimated fuel and wear · open only',
      c: '#C2323A',
      tint: 'rgba(229,104,107,.14)',
      vc: hasOpenCost && summary?.openCostInr != null ? '#C2323A' : 'var(--rd-ink-3)',
    },
  ];

  const exportCsv = () => {
    const out = [
      [
        'vehicle',
        'trip',
        'leg',
        'left_usual_route',
        'back_on_route',
        'minutes',
        'max_off_km',
        'extra_km',
        'est_cost_inr',
        'status',
        'review_reason',
      ],
    ].concat(
      rows.map((d) => [
        d.registrationNumber,
        tripLabel(d.trip) || d.corridorLabel || '',
        legLabel(d.trip),
        d.startedAt ? fmtDT(new Date(d.startedAt)) : '',
        d.endedAt ? fmtDT(new Date(d.endedAt)) : '',
        d.durationMin ?? '',
        d.maxOffKm,
        d.extraKmEstimate,
        d.estimatedExtraCostInr,
        d.status,
        d.reviewReason || '',
      ]),
    );
    downloadCsv('route-deviation', out);
    toast(`${out.length - 1} rows exported`);
  };

  const totalPages = list.data?.totalPages || 0;
  const pager =
    totalPages > 1 ? (
      <div className="dev-pager">
        <button
          type="button"
          className="btn btn--sm"
          disabled={filters.page <= 1 || list.loading}
          onClick={() => dispatch({ type: 'set', field: 'page', value: filters.page - 1 })}
        >
          <Ico n="arrowL" s={12} />
          Newer
        </button>
        <span className="muted">
          Page {filters.page} of {totalPages} · {summary?.total ?? 0} detours
        </span>
        <button
          type="button"
          className="btn btn--sm"
          disabled={filters.page >= totalPages || list.loading}
          onClick={() => dispatch({ type: 'set', field: 'page', value: filters.page + 1 })}
        >
          Older
          <Ico n="arrowR" s={12} />
        </button>
      </div>
    ) : null;

  return (
    <section className="view">
      <div className="phead">
        <div className="t">
          <h2>
            Route deviation{' '}
            {summary?.open ? <span className="count-pill">{summary.open}</span> : null}
          </h2>
          <p>
            Trucks that left the route they usually take between two places, shown on the trip they
            happened on. Costs are estimates; a flag means “please look”, not a verdict.
          </p>
        </div>
        <div className="tools">
          <RefreshButton onClick={list.refetch} busy={list.loading} />
          <button type="button" className="btn" onClick={exportCsv} disabled={!rows.length}>
            <Ico n="download" />
            Export
          </button>
        </div>
      </div>

      <KpiRow items={kpis} loading={first} />

      <DeviationFilterBar
        filters={filters}
        dispatch={dispatch}
        legCounts={filters.leg === 'all' && summary ? { all: summary.total, ...summary.byLeg } : {}}
      />

      <div className="split">
        <DeviationFeed
          selectedChecked={Boolean(detail.data)}
          selectedNotJudged={Boolean(
            detail.data &&
            !(
              detail.data.roadEngine?.usualRoute?.length > 1 ||
              detail.data.usualRoute?.length > 1 ||
              detail.data.corridor?.line?.length > 1
            ),
          )}
          groups={groups}
          selId={selectedId}
          onSelect={setSelId}
          first={first}
          error={list.error ? list.error?.message || 'Could not load deviation events.' : null}
          pager={pager}
        />
        <DeviationDetail
          row={selected}
          detail={detail.data}
          loading={detail.loading}
          error={detail.error}
          siblings={siblings}
          onSelect={setSelId}
          onReview={onReview}
          reviewBusy={review.loading}
          go={go}
        />
      </div>
    </section>
  );
}
