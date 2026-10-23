const Skel = ({ w, h = 12, round = false, radius }) => (
  <span
    aria-hidden="true"
    className={`ra-skel${round ? ' ra-skel--round' : ''}`}
    style={{ width: w, height: h, ...(radius ? { borderRadius: radius } : {}) }}
  />
);

export default Skel;
