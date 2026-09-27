import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { ANSWER_TYPES, typeLabel } from './placeIntelligenceModel';

/** Pick a type and save, or say it is not a place at all. */
export default function AnswerControls({ site, suggested, answer }) {
  const [choice, setChoice] = useState(suggested || '');
  const busy = answer.busyId === site._id;
  return (
    <div className="flex items-center justify-end gap-2">
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
        aria-label="What is this place?"
      >
        <option value="">What is it?</option>
        {ANSWER_TYPES.map((t) => (
          <option key={t} value={t}>
            {typeLabel(t)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="oa-ack-action"
        disabled={!choice || busy}
        onClick={() => answer.accept(site, choice)}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
      </button>
      <button
        type="button"
        className="oa-ack-action"
        disabled={busy}
        onClick={() => answer.reject(site)}
        title="Not a real place"
      >
        <X size={13} /> Not a place
      </button>
    </div>
  );
}
