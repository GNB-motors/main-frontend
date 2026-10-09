import typeStyle from './placeTypes';
import { ANSWER_TYPES, typeLabel } from './placeIntelligenceModel';

/** Every answer as a one-click chip, in the colour the map uses for it. */
export default function TypeChips({ current, disabled, onPick }) {
  return (
    <div className="pi-chips">
      {ANSWER_TYPES.map((t) => {
        const { Icon, color } = typeStyle(t);
        return (
          <button
            type="button"
            key={t}
            className={`pi-chip${t === current ? ' is-current' : ''}`}
            style={{ '--pi-type': color }}
            disabled={disabled}
            onClick={() => onPick(t)}
          >
            <Icon size={15} aria-hidden="true" /> {typeLabel(t)}
          </button>
        );
      })}
    </div>
  );
}
