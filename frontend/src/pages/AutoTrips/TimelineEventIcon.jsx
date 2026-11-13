import { CircleHelp, BedDouble, Moon } from 'lucide-react';
import PlaceIcon from '../../components/Icons/PlaceIcon';
import { stopKind } from './timelineModel';

/** Use the same place glyphs as the replay map, including stops with a toll pass. */
export default function TimelineEventIcon({ step, toll = false }) {
  const kind = step?.stop ? stopKind(step.stop) : '';
  if (toll || step?.tollPass || kind === 'TOLL') return <PlaceIcon layer="tolls" size={18} />;
  if (step?.kind === 'loading') return <PlaceIcon layer="loading" size={18} />;
  if (step?.kind === 'drop') return <PlaceIcon layer="unloading" size={18} />;
  if (kind === 'REST') return <BedDouble size={17} aria-hidden="true" />;
  if (kind === 'OVERNIGHT') return <Moon size={17} aria-hidden="true" />;
  const layer = {
    FUEL: 'pumps',
    DHABA: 'dhabas',
    FOOD: 'dhabas',
    PARKING: 'parking',
    SERVICE: 'workshops',
    REPAIR: 'workshops',
    BREAKDOWN: 'workshops',
    WEIGHBRIDGE: 'weighbridges',
    LOADING: 'loading',
    UNLOADING: 'unloading',
  }[kind];
  return layer ? (
    <PlaceIcon layer={layer} size={18} />
  ) : (
    <CircleHelp size={17} aria-hidden="true" />
  );
}
