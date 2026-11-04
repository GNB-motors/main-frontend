import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Cross,
  Factory,
  Fuel,
  Landmark,
  ParkingSquare,
  RotateCw,
  Route,
  Shield,
  Timer,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import { getPref, setPref } from '../../utils/session';
import { formatAgo } from '../../utils/redesign/format';
import { placeLayerColor } from '../../utils/redesign/tone';
import InfoTip from '../../components/redesign/InfoTip';
import { LAYER_MIN_ZOOM, LIVE_LAYERS, PLACE_LAYERS } from './trackLegendModel';
import LegendBlock from './LegendBlock';
import LegendToggle from './LegendToggle';

/** The lucide icon for each place layer. */
const LAYER_ICONS = {
  Factory,
  Fuel,
  UtensilsCrossed,
  Cross,
  Shield,
  Wrench,
  BadgeCheck,
  ParkingSquare,
  Landmark,
  CircleHelp,
  Route,
  Timer,
};

/** Where the legend remembers whether it is open. */
const LEGEND_OPEN_KEY = 'track.legend.open';

/**
 * Whether the legend starts open. A remembered choice wins; with none, it is
 * open on a desktop and closed on a phone, where it would cover the map.
 */
function readLegendOpen() {
  const stored = getPref(LEGEND_OPEN_KEY);
  if (stored === 'true') return true;
  if (stored === 'false') return false;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return !window.matchMedia('(max-width: 780px)').matches;
}

/**
 * TrackLegend — the floating panel down the left side of the map.
 *
 * It is not decoration: it is the filter. Every row is a switch for what is
 * drawn on the map and listed in the rail. A single click turns one group
 * off; a double click shows only that group. The counts always show the
 * whole fleet, never the filtered part, so the legend never lies about how
 * many trucks the owner has.
 */
export default function TrackLegend({
  statusRows = [],
  makeRows = [],
  statusSelection = {},
  makeSelection = {},
  layerSelection = {},
  onToggleStatus,
  onOnlyStatus,
  onAllStatus,
  onToggleMake,
  onOnlyMake,
  onAllMake,
  onToggleLayer,
  lastEventAt,
  onRefresh,
  isRefreshing = false,
  zoom = 0,
  placesNotAvailable = false,
  placesTruncated = false,
  placesCount = 0,
  liveCounts = {},
  error = null,
  onRetry = null,
}) {
  const [isOpen, setIsOpen] = useState(() => readLegendOpen());

  const movingCount = statusRows.find((row) => row.key === 'moving')?.count ?? 0;
  const zoomedIn = Number(zoom) >= LAYER_MIN_ZOOM;
  // Trucks and Make now live in the top toolbar; when the page hands the legend
  // no status/make rows it is a Places-only panel, so the header and the
  // collapsed pill drop the fleet language.
  const hasStatus = statusRows.length > 0;
  const hasFilterRows = hasStatus || makeRows.length > 0;

  const statusAllOn = useMemo(
    () => statusRows.every((row) => statusSelection[row.key]),
    [statusRows, statusSelection],
  );
  const makeAllOn = useMemo(
    () => makeRows.every((row) => makeSelection[row.key]),
    [makeRows, makeSelection],
  );

  const toggleOpen = () => {
    setIsOpen((open) => {
      setPref(LEGEND_OPEN_KEY, String(!open));
      return !open;
    });
  };

  return (
    <section
      aria-label="Map filters"
      className="ov-legend flex flex-col rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] shadow-[var(--rd-shadow-float)]"
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={false}
          className="ov-legend-bar flex h-10 w-full items-center gap-2 rounded-[var(--rd-radius)] px-3 text-[13px] font-medium text-[var(--rd-ink)]"
        >
          {hasStatus ? (
            <>
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: 'var(--rd-moving)' }}
              />
              <span className="tabular-nums ov-legend-count">{movingCount}</span>
              <span className="text-[var(--rd-ink-2)] ov-legend-word">moving</span>
              <span className="ml-auto text-[var(--rd-ink-3)]">Filters</span>
            </>
          ) : (
            <>
              <Landmark
                size={15}
                aria-hidden="true"
                style={{ color: placeLayerColor('ourPlaces') }}
              />
              <span className="text-[var(--rd-ink-2)] ov-legend-word">Places</span>
              <span className="ml-auto text-[var(--rd-ink-3)]">Layers</span>
            </>
          )}
          <ChevronUp size={15} aria-hidden="true" />
        </button>
      ) : (
        <>
          <div className="flex items-center gap-2 px-3 pt-3 pb-1">
            <h2 className="m-0 flex-1 text-[13px] font-semibold text-[var(--rd-ink)]">
              {hasFilterRows ? 'Filters' : 'Places'}
            </h2>
            <button
              type="button"
              onClick={toggleOpen}
              aria-expanded
              aria-label="Collapse filters"
              className="rounded-md p-1 text-[var(--rd-ink-3)] transition-colors hover:bg-[var(--rd-card-2)] hover:text-[var(--rd-ink-2)]"
            >
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
            {/* Block 1 — Trucks */}
            {hasStatus ? (
              <LegendBlock
                title="Trucks"
                info={{
                  text: 'Moving means over 3 km/h. Idling means the engine is on and the truck is not moving.',
                  basis: null,
                }}
                showAll={!statusAllOn}
                onAll={onAllStatus}
              >
                {statusRows.map((row) => (
                  <LegendToggle
                    key={row.key}
                    label={row.label}
                    count={row.count}
                    color={row.color}
                    on={Boolean(statusSelection[row.key])}
                    onToggle={() => onToggleStatus(row.key)}
                    onOnly={() => onOnlyStatus(row.key)}
                  />
                ))}
              </LegendBlock>
            ) : null}

            {/* Block 2 — Make */}
            {makeRows.length > 0 ? (
              <LegendBlock
                title="Make"
                info={{
                  text: 'Only the makes your fleet actually has.',
                  basis: null,
                }}
                showAll={!makeAllOn}
                onAll={onAllMake}
              >
                {makeRows.map((row) => (
                  <LegendToggle
                    key={row.key}
                    label={row.label}
                    count={row.count}
                    color="var(--rd-ink-3)"
                    on={Boolean(makeSelection[row.key])}
                    onToggle={() => onToggleMake(row.key)}
                    onOnly={() => onOnlyMake(row.key)}
                  />
                ))}
              </LegendBlock>
            ) : null}

            {/* Block 3 — Places */}
            <LegendBlock
              title="Places"
              info={{
                text: 'The places on the map: your own plants and sidings, and the landmarks a driver needs.',
                basis: null,
              }}
            >
              {PLACE_LAYERS.map((layer) => {
                const gated = layer.zoomGated && !zoomedIn;
                const Icon = LAYER_ICONS[layer.icon] || Factory;
                return (
                  <LegendToggle
                    key={layer.id}
                    label={layer.label}
                    icon={<Icon size={14} aria-hidden="true" />}
                    color={placeLayerColor(layer.id)}
                    on={Boolean(layerSelection[layer.id])}
                    disabled={placesNotAvailable}
                    disabledReason={
                      placesNotAvailable ? 'Coming soon' : gated ? 'Zoom in to see' : null
                    }
                    onToggle={() => onToggleLayer(layer.id)}
                    info={
                      placesNotAvailable ? (
                        <InfoTip
                          text="Coming soon. This layer arrives with the new map places service."
                          basis={null}
                          side="left"
                        />
                      ) : null
                    }
                  />
                );
              })}
              {placesTruncated ? (
                <p className="m-0 px-1 pt-1 text-[11px] text-[var(--rd-ink-3)]">
                  Showing {placesCount.toLocaleString('en-IN')} · zoom in for all
                </p>
              ) : null}
            </LegendBlock>

            {/* Block 4 — the live layers of the control room: the places still
                waiting for an answer, the routes the fleet runs, the trucks
                idling right now. All off until the owner asks for them. */}
            <LegendBlock
              title="Live layers"
              info={{
                text: 'What the fleet is doing between the pins: places still to confirm, the routes it runs, and the trucks idling now.',
                basis: null,
              }}
            >
              {LIVE_LAYERS.map((layer) => {
                const Icon = LAYER_ICONS[layer.icon] || Factory;
                const count = liveCounts[layer.id];
                return (
                  <LegendToggle
                    key={layer.id}
                    label={layer.label}
                    count={count == null ? undefined : count}
                    icon={<Icon size={14} aria-hidden="true" />}
                    color={layer.color}
                    on={Boolean(layerSelection[layer.id])}
                    onToggle={() => onToggleLayer(layer.id)}
                  />
                );
              })}
            </LegendBlock>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 border-t border-[var(--rd-line)] px-3 py-2">
            {error ? (
              <span className="flex min-w-0 flex-1 items-center gap-1 text-[11px] text-[var(--rd-ink-2)]">
                <span className="truncate">Couldn&apos;t load your fleet</span>
                {onRetry ? (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="shrink-0 rounded-md border border-[var(--rd-line)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--rd-ink-2)]"
                  >
                    Retry
                  </button>
                ) : null}
              </span>
            ) : (
              <span className="flex-1 text-[11px] text-[var(--rd-ink-3)]">
                {lastEventAt ? `Updated ${formatAgo(lastEventAt)}` : 'Waiting for data'}
              </span>
            )}
            <button
              type="button"
              onClick={onRefresh}
              aria-label={error ? 'Retry fleet data' : 'Refresh fleet data'}
              title={error ? 'Retry fleet data' : 'Refresh fleet data'}
              className="rounded-md p-1 text-[var(--rd-ink-3)] transition-colors hover:bg-[var(--rd-card-2)] hover:text-[var(--rd-ink-2)]"
            >
              <RotateCw
                size={14}
                aria-hidden="true"
                className={isRefreshing ? 'animate-spin' : undefined}
              />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
