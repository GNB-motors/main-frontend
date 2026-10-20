const Skel = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`inline-block align-middle rounded bg-slate-200 dark:bg-slate-700 animate-pulse ${className}`}
  />
);

export default Skel;
