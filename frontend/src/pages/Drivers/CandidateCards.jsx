import safeText from '@/utils/redactSensitive';

import { matchLabels } from './candidateMatch';

export default function CandidateCards({
  candidates,
  value,
  onChange,
  name,
  disabled,
  noneLabel = 'None of these / new driver',
  asButtons = false,
}) {
  if (asButtons)
    return (
      <div className="space-y-2">
        <p>These might be the driver:</p>
        {candidates.map((candidate) => (
          <button
            key={candidate.userId}
            type="button"
            className="block w-full rounded border p-2 text-left"
            disabled={disabled}
            aria-pressed={value === candidate.userId}
            onClick={() => onChange(candidate.userId)}
          >
            <strong>{safeText(candidate.name) || 'Driver'}</strong>
            <span className="block text-xs">
              {candidate.phone
                ? `Phone ending ${String(candidate.phone).replace(/\D/g, '').slice(-4)}`
                : 'Phone not available'}
            </span>
            <span className="text-xs">
              {matchLabels(candidate.matched)
                .map((label) => `${label} matches`)
                .join(', ')}
            </span>
          </button>
        ))}
        <button
          type="button"
          className="rounded border p-2"
          disabled={disabled}
          onClick={() => onChange('none')}
        >
          {noneLabel}
        </button>
      </div>
    );
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-2 text-sm font-medium">Did you mean one of these drivers?</legend>
      {candidates.map((candidate) => (
        <label
          key={candidate.userId}
          className="flex min-w-0 cursor-pointer items-start gap-2 rounded-lg border border-[var(--ds-line)] p-3 text-sm has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
        >
          <input
            type="radio"
            name={name}
            value={candidate.userId}
            checked={value === candidate.userId}
            disabled={disabled}
            onChange={() => onChange(candidate.userId)}
          />
          <span className="min-w-0 break-words">
            <strong>{safeText(candidate.name) || 'Driver'}</strong>
            <span className="block text-xs text-muted-foreground">
              {candidate.phone
                ? `Phone ending ${String(candidate.phone).replace(/\D/g, '').slice(-4)}`
                : 'Phone not available'}
            </span>
            <span className="mt-1 flex flex-wrap gap-1">
              {matchLabels(candidate.matched).map((label) => (
                <span key={label} className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                  {label} matches
                </span>
              ))}
            </span>
          </span>
        </label>
      ))}
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--ds-line)] p-3 text-sm has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
        <input
          type="radio"
          name={name}
          value="none"
          checked={value === 'none'}
          disabled={disabled}
          onChange={() => onChange('none')}
        />{' '}
        {noneLabel}
      </label>
    </fieldset>
  );
}
