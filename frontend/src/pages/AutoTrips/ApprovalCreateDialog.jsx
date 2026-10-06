import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import MovementApprovalService from '../../services/MovementApprovalService';
import PlaceIntelligenceService from '../PlaceIntelligence/PlaceIntelligenceService';
import { SITE_TYPE_LABEL } from '../PlaceIntelligence/placeIntelligenceModel';

const PLACE_KINDS = [
  { value: 'ANY_WORKSHOP', label: 'Any workshop' },
  { value: 'SITE', label: 'A specific place' },
  { value: 'REGION', label: 'A region' },
  { value: 'TYPE', label: 'A type of place' },
  { value: 'ANY', label: 'Anywhere (owner only)' },
];
const APPROVAL_KINDS = [
  { value: 'PRE', label: 'Pre-approval' },
  { value: 'STANDING', label: 'Standing rule' },
  { value: 'LATE', label: 'Late (after the fact)' },
];
const WEEKDAYS = [
  { d: 1, label: 'Mon' },
  { d: 2, label: 'Tue' },
  { d: 3, label: 'Wed' },
  { d: 4, label: 'Thu' },
  { d: 5, label: 'Fri' },
  { d: 6, label: 'Sat' },
  { d: 0, label: 'Sun' },
];
const TYPE_OPTIONS = Object.keys(SITE_TYPE_LABEL);

const labelStyle = { fontSize: 12, color: '#666', display: 'block', marginBottom: 4 };
const rowStyle = { marginBottom: 12 };

export default function ApprovalCreateDialog({
  open,
  onOpenChange,
  vehicleOptions = [],
  driverOptions = [],
  onCreated,
}) {
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [placeKind, setPlaceKind] = useState('ANY_WORKSHOP');
  const [placeId, setPlaceId] = useState('');
  const [placeType, setPlaceType] = useState('WORKSHOP');
  const [timeMode, setTimeMode] = useState('window');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [weekdays, setWeekdays] = useState([]);
  const [fromHour, setFromHour] = useState('9');
  const [toHour, setToHour] = useState('18');
  const [maxExtraKm, setMaxExtraKm] = useState('');
  const [maxDwellMin, setMaxDwellMin] = useState('');
  const [approvalKind, setApprovalKind] = useState('PRE');
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');

  const sitesQ = useApi(
    (signal) => PlaceIntelligenceService.listSites({ status: 'CONFIRMED', limit: 500 }, { signal }),
    [],
    { enabled: open && placeKind === 'SITE' },
  );
  const regionsQ = useApi(
    (signal) =>
      PlaceIntelligenceService.listRegions({ status: 'CONFIRMED', limit: 500 }, { signal }),
    [],
    { enabled: open && placeKind === 'REGION' },
  );
  const siteOptions = useMemo(
    () => (sitesQ.data?.records || []).map((s) => ({ id: s._id, label: s.name || s.key || s._id })),
    [sitesQ.data],
  );
  const regionOptions = useMemo(
    () =>
      (regionsQ.data?.items || []).map((r) => ({
        id: r._id,
        label: r.name || `${r.memberCount || 0} sites`,
      })),
    [regionsQ.data],
  );

  const createM = useMutation(MovementApprovalService.create);

  const toggleDay = (d) =>
    setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d]));

  const build = () => {
    const placeSpec = { kind: placeKind };
    if (placeKind === 'SITE' || placeKind === 'REGION') placeSpec.id = placeId;
    if (placeKind === 'TYPE') placeSpec.type = placeType;

    const body = { placeSpec, kind: approvalKind };
    if (vehicleId) body.vehicleId = vehicleId;
    if (driverId) body.driverId = driverId;
    if (timeMode === 'window') {
      body.window = { from: `${from}T00:00:00+05:30`, to: `${to}T23:59:59+05:30` };
    } else {
      body.recurrence = { weekdays, fromHour: Number(fromHour), toHour: Number(toHour) };
    }
    if (maxExtraKm !== '' || maxDwellMin !== '') {
      body.caps = {};
      if (maxExtraKm !== '') body.caps.maxExtraKm = Number(maxExtraKm);
      if (maxDwellMin !== '') body.caps.maxDwellMin = Number(maxDwellMin);
    }
    if (purpose) body.purpose = purpose;
    if (note) body.note = note;
    return body;
  };

  const validationError = () => {
    if (!vehicleId && !driverId) return 'Pick a vehicle or a driver.';
    if ((placeKind === 'SITE' || placeKind === 'REGION') && !placeId) return 'Pick the place.';
    if (placeKind === 'TYPE' && !placeType) return 'Pick a place type.';
    if (timeMode === 'window') {
      if (!from || !to) return 'Set the from and to dates.';
      if (to < from) return 'The "to" date must be after "from".';
    } else {
      if (!weekdays.length) return 'Pick at least one weekday.';
      if (Number(toHour) <= Number(fromHour)) return 'End hour must be after start hour.';
    }
    return null;
  };

  const submit = async () => {
    const err = validationError();
    if (err) {
      toast.error(err);
      return;
    }
    try {
      await createM.mutate(build());
      toast.success('Approval created');
      onCreated?.();
    } catch (e) {
      toast.error(e?.message || 'Could not create approval');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New movement approval</DialogTitle>
          <DialogDescription>
            Pre-authorise a vehicle or driver to visit a place, so a detour there is not charged.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Vehicle</span>
            <Select
              value={vehicleId || 'none'}
              onValueChange={(v) => setVehicleId(v === 'none' ? '' : v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Any vehicle" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="none">Any vehicle</SelectItem>
                {vehicleOptions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Driver</span>
            <Select
              value={driverId || 'none'}
              onValueChange={(v) => setDriverId(v === 'none' ? '' : v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Any driver" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="none">Any driver</SelectItem>
                {driverOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Place</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Select value={placeKind} onValueChange={setPlaceKind}>
              <SelectTrigger className="h-9 w-[200px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {PLACE_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {placeKind === 'SITE' ? (
              <Select value={placeId} onValueChange={setPlaceId}>
                <SelectTrigger className="h-9 w-[220px] text-sm">
                  <SelectValue placeholder={sitesQ.loading ? 'Loading…' : 'Pick a place'} />
                </SelectTrigger>
                <SelectContent align="start">
                  {siteOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {placeKind === 'REGION' ? (
              <Select value={placeId} onValueChange={setPlaceId}>
                <SelectTrigger className="h-9 w-[220px] text-sm">
                  <SelectValue placeholder={regionsQ.loading ? 'Loading…' : 'Pick a region'} />
                </SelectTrigger>
                <SelectContent align="start">
                  {regionOptions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {placeKind === 'TYPE' ? (
              <Select value={placeType} onValueChange={setPlaceType}>
                <SelectTrigger className="h-9 w-[220px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SITE_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>When</span>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Button
              type="button"
              size="sm"
              variant={timeMode === 'window' ? 'default' : 'outline'}
              onClick={() => setTimeMode('window')}
            >
              One-time window
            </Button>
            <Button
              type="button"
              size="sm"
              variant={timeMode === 'recurrence' ? 'default' : 'outline'}
              onClick={() => setTimeMode('recurrence')}
            >
              Recurring
            </Button>
          </div>
          {timeMode === 'window' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                type="date"
                aria-label="From date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <Input
                type="date"
                aria-label="To date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {WEEKDAYS.map((w) => (
                  <Button
                    key={w.d}
                    type="button"
                    size="sm"
                    variant={weekdays.includes(w.d) ? 'default' : 'outline'}
                    onClick={() => toggleDay(w.d)}
                  >
                    {w.label}
                  </Button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13 }}>From hour</span>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  aria-label="From hour"
                  value={fromHour}
                  onChange={(e) => setFromHour(e.target.value)}
                  style={{ width: 80 }}
                />
                <span style={{ fontSize: 13 }}>to</span>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  aria-label="To hour"
                  value={toHour}
                  onChange={(e) => setToHour(e.target.value)}
                  style={{ width: 80 }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Approval type</span>
            <Select value={approvalKind} onValueChange={setApprovalKind}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {APPROVAL_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Max extra km</span>
            <Input
              type="number"
              min="0"
              value={maxExtraKm}
              onChange={(e) => setMaxExtraKm(e.target.value)}
            />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Max dwell (min)</span>
            <Input
              type="number"
              min="0"
              value={maxDwellMin}
              onChange={(e) => setMaxDwellMin(e.target.value)}
            />
          </div>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Purpose &amp; note</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="Purpose (optional)"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
            <Input
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={createM.loading}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={createM.loading}>
            {createM.loading ? 'Creating…' : 'Create approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
