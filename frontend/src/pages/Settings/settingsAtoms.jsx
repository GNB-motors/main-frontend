/** Section header and card shared by every Settings section. */

export function SectionHead({ id, title, desc, action = null }) {
  return (
    <header className="stx-sec-head">
      <div className="stx-sec-text">
        <h2 id={id} className="stx-sec-title">
          {title}
        </h2>
        {desc ? <p className="stx-sec-desc">{desc}</p> : null}
      </div>
      {action ? <div className="stx-sec-action">{action}</div> : null}
    </header>
  );
}

export function Card({ title, aside = null, foot = null, children, flush = false }) {
  return (
    <div className="stx-card">
      {title ? (
        <div className="stx-card-head">
          <h3 className="stx-card-title">{title}</h3>
          {aside}
        </div>
      ) : null}
      <div className={flush ? 'stx-card-body stx-card-body--flush' : 'stx-card-body'}>
        {children}
      </div>
      {foot ? <p className="stx-card-foot">{foot}</p> : null}
    </div>
  );
}

export function Skeleton({ rows = 3 }) {
  return (
    <div className="stx-skel" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="stx-skel-row" />
      ))}
    </div>
  );
}
