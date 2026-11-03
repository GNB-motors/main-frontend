import { replayTolls, tollCoverageText } from './trackTollsModel';

export default function TrackTollStatus({ data, loading, error, onRetry, playheadTime }) {
  const markers = replayTolls(data?.passes, playheadTime);
  const passed = markers
    .filter((pass) => pass.passed)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const latest = passed[0];
  const coverage = tollCoverageText(data, { loading, error });
  return (
    <div
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm"
      aria-label="Replay toll crossings"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <strong>
          Tolls{markers.length ? ` · ${passed.length}/${markers.length} reached` : ''}
        </strong>
        {latest ? (
          <span>
            {latest.name || 'Toll booth'} · {latest.action.toLowerCase()} ·{' '}
            {new Date(latest.at).toLocaleTimeString('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour: 'numeric',
              minute: '2-digit',
            })}{' '}
            IST
          </span>
        ) : null}
        {coverage ? <span role="status">{coverage}</span> : null}
        {error ? (
          <button type="button" className="font-semibold text-blue-700 underline" onClick={onRetry}>
            Retry tolls
          </button>
        ) : null}
      </div>
    </div>
  );
}
