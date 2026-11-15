import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, MapPin, SignalZero, Truck } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApi } from '../../hooks/useApi';
import { getUserRole } from '../../utils/session.js';
import AutoTripService from '../../services/AutoTripService';
import { formatNum } from '../../utils/formatters';
import { COVERAGE_REASON_LABEL, placeHubHref } from './autoTripPlaces';
import './AutoTrips.css';
import './AutoTripCoverage.css';

const CAN_SEE = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];
const REASON_ORDER = ['NO_CONFIRMED_PICKUP', 'NO_STOPS'];
const REASON_HELP = {
  NO_CONFIRMED_PICKUP: {
    title: 'Pickup place not confirmed',
    next: 'Review and confirm their loading place.',
    icon: MapPin,
  },
  NO_STOPS: {
    title: 'No GPS stops recorded',
    next: 'Check whether GPS data is being received.',
    icon: SignalZero,
  },
};
const plural = (n, word) => `${formatNum(n)} ${word}${n === 1 ? '' : 's'}`;

/**
 * Trucks with no trips, and the places they stop at longest that are not confirmed
 * pickups yet. Confirming one of those places as a pickup is what gives them trips, so
 * each opens it in Place Hub. Owners and managers only (the API is).
 */
export default function AutoTripCoverage() {
  const canSee = CAN_SEE.includes(getUserRole());
  const [open, setOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const { data } = useApi((signal) => AutoTripService.coverage({ signal }), [canSee], {
    enabled: canSee,
  });

  if (!canSee || !data?.trucksMissing) return null;
  const places = data.candidatePlaces || [];
  const n = data.trucksMissing;
  const groups = reasonGroups(data.missing || []);
  const showTrucks = () => {
    setSummaryOpen(false);
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Popover
        open={summaryOpen && !open}
        onOpenChange={(nextOpen, details) => {
          // Hover explains the count; a press opens the full list directly.
          if (details.reason !== 'trigger-press') setSummaryOpen(nextOpen);
        }}
      >
        <PopoverTrigger
          className="atx-scope atx-coverage-badge"
          aria-label={`${plural(n, 'truck')} without trips`}
          onClick={showTrucks}
          openOnHover={!open}
          delay={150}
          closeDelay={150}
        >
          <Truck size={15} aria-hidden="true" />
          <span>
            <strong>{formatNum(n)}</strong> {n === 1 ? 'truck' : 'trucks'} without trips
          </span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="atx-scope atx-coverage-popover">
          <div className="atx-coverage-popover-heading">
            <PopoverTitle className="atx-coverage-popover-title">
              Why trips are missing
            </PopoverTitle>
            <PopoverDescription className="atx-coverage-popover-description">
              {plural(n, 'truck')} {n === 1 ? 'has' : 'have'} no detected trips yet.
            </PopoverDescription>
          </div>
          <ul className="atx-coverage-summary">
            {groups.map((group) => {
              const help = REASON_HELP[group.reason];
              const Icon = help?.icon || Truck;
              return (
                <li key={group.reason}>
                  <span
                    className={`atx-coverage-reason-icon atx-coverage-reason-icon--${group.reason}`}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div className="atx-coverage-reason-copy">
                    <strong>
                      {help?.title || COVERAGE_REASON_LABEL[group.reason] || group.reason}
                    </strong>
                    {help?.next ? <span>{help.next}</span> : null}
                  </div>
                  <span className="atx-coverage-reason-count">
                    {plural(group.trucks.length, 'truck')}
                  </span>
                </li>
              );
            })}
          </ul>
          <button type="button" className="atx-coverage-view" onClick={showTrucks}>
            View {n === 1 ? '' : 'all '}
            {plural(n, 'truck')}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </PopoverContent>
      </Popover>
      <DialogContent className="atx-scope atx-coverage-dialog">
        <DialogHeader>
          <DialogTitle>Trucks without trips</DialogTitle>
          <DialogDescription>
            {plural(n, 'truck')} {n === 1 ? 'has' : 'have'} no detected trips. Check GPS data and
            confirm their loading places to help find trips.
          </DialogDescription>
        </DialogHeader>
        <div className="atx-coverage-body">
          <section>
            <h3>{plural(n, 'truck')} without trips</h3>
            <ReasonGroups groups={groups} total={n} />
          </section>
          <section>
            <h3>Places to confirm as a pickup</h3>
            {places.length ? (
              <>
                <p className="atx-cov-note">Select a place to review it in Place Hub.</p>
                <PlaceBars places={places} />
              </>
            ) : (
              <p className="atx-cov-note">No long stops at a known place in the last 30 days.</p>
            )}
          </section>
        </div>
        <DialogFooter>
          <DialogClose className="atx-btn atx-btn--sm">Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlaceBars({ places }) {
  const max = Math.max(...places.map((p) => p.trucks || 0), 1);
  return (
    <ul className="atx-cov-bars">
      {places.map((p) => (
        <li key={p.orgSiteId} className="atx-cov-bar-row">
          <Link to={placeHubHref(p.orgSiteId)} className="atx-cov-bar-label">
            {p.name || 'Unconfirmed place'}
          </Link>
          <span className="atx-cov-track" aria-hidden="true">
            <span
              className="atx-cov-bar atx-cov--NO_CONFIRMED_PICKUP"
              style={{ width: `${((p.trucks || 0) / max) * 100}%` }}
            />
          </span>
          <span className="atx-cov-val">
            <strong>{plural(p.trucks, 'truck')}</strong> · {plural(p.stops, 'stop')}
          </span>
        </li>
      ))}
    </ul>
  );
}

function reasonGroups(missing) {
  return REASON_ORDER.map((reason) => ({
    reason,
    trucks: missing.filter((m) => m.reason === reason),
  }))
    .concat(
      [...new Set(missing.map((m) => m.reason))]
        .filter((r) => !REASON_ORDER.includes(r))
        .map((reason) => ({ reason, trucks: missing.filter((m) => m.reason === reason) })),
    )
    .filter((g) => g.trucks.length);
}

function ReasonGroups({ groups, total }) {
  return (
    <div className="atx-cov-groups">
      {groups.map((g) => (
        <section key={g.reason} className="atx-cov-group">
          <div className="atx-cov-bar-row">
            <span className="atx-cov-bar-label">{COVERAGE_REASON_LABEL[g.reason] || g.reason}</span>
            <span className="atx-cov-track" aria-hidden="true">
              <span
                className={`atx-cov-bar atx-cov--${g.reason}`}
                style={{ width: `${(g.trucks.length / Math.max(total, 1)) * 100}%` }}
              />
            </span>
            <span className="atx-cov-val">
              <strong>{plural(g.trucks.length, 'truck')}</strong>
            </span>
          </div>
          <ul className="atx-cov-plates">
            {g.trucks.map((m) => (
              <li key={m.vehicleId} className="atx-plate">
                {m.registrationNumber}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
