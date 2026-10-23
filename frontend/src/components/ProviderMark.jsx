/** The small square provider mark in front of each Fleet connections section. */
export default function ProviderMark({ provider }) {
  const al = provider === 'ialert';
  return (
    <span className={`fleet-provider-mark fleet-provider-mark--${al ? 'al' : 'tata'}`} aria-hidden="true">
      {al ? 'AL' : 'TATA'}
    </span>
  );
}
