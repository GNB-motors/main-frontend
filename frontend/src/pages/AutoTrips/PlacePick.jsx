import { Input } from '../../components/ui/input';
import PickSelect from './PickSelect';

/** A saved place, or — while none is picked — a typed name right under it. */
export default function PlacePick({
  label,
  siteId,
  onSite,
  name,
  onName,
  places,
  noneLabel,
  namePlaceholder = 'Or type the place name',
}) {
  return (
    <div className="atx-field atx-place-pick">
      <PickSelect
        label={label}
        value={siteId}
        onChange={onSite}
        options={places}
        noneLabel={noneLabel}
      />
      {!siteId && (
        <Input
          aria-label={`${label} — place name`}
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder={namePlaceholder}
        />
      )}
    </div>
  );
}
