import InfoTip from '@/components/redesign/InfoTip';

/**
 * IntelCard — the plain card of the Intelligence page.
 *
 * A 15 px title with an optional count and "how we know" tip, an optional
 * action on the right, and a body. `flush` lets a table run edge to edge
 * under the header. No icon badge, no shadow: the content is the colour.
 */
export default function IntelCard({
  title,
  count = null,
  info = null,
  action = null,
  flush = false,
  className = '',
  children,
}) {
  return (
    <section className={`intel-card ${className}`.trim()}>
      <header className="intel-card-head">
        <h3>
          {title}
          {count !== null && count !== undefined ? (
            <span className="intel-card-count">{count}</span>
          ) : null}
        </h3>
        {info?.text ? <InfoTip text={info.text} basis={info.basis} label={`About ${title}`} /> : null}
        {action ? <div className="intel-card-action">{action}</div> : null}
      </header>
      <div className={flush ? 'intel-card-body intel-card-body--flush' : 'intel-card-body'}>
        {children}
      </div>
    </section>
  );
}
