import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.jsx';
import { ANSWER_TYPES } from '../PlaceHub/intelligence/model/siteVocabulary.js';
import { typeLabel } from '../PlaceHub/intelligence/model/siteType.js';
import typeStyle from '../PlaceHub/intelligence/placeTypes.js';

/** Styled, keyboard-accessible picker shared by Live tracking's place modals. */
export default function PlaceTypeSelect({ value, onChange, disabled = false }) {
  const options = [...new Set([...ANSWER_TYPES, value].filter(Boolean))];
  const { Icon: SelectedIcon, color: selectedColor } = typeStyle(value);
  return (
    <Select
      value={value || null}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger type="button" className="lt-place-type-trigger" aria-label="Place type">
        <SelectValue>
          {value ? (
            <SelectedIcon size={16} aria-hidden="true" style={{ color: selectedColor }} />
          ) : null}
          {value ? typeLabel(value) : 'Select place type'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="lt-place-type-options">
        {options.map((type) => {
          const { Icon, color } = typeStyle(type);
          return (
            <SelectItem key={type} value={type}>
              <Icon size={16} aria-hidden="true" style={{ color }} />
              {typeLabel(type)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
