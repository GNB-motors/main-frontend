import PageShell from '../../../components/ui/PageShell';
import EmptyState from '../../../components/cluster/EmptyState';
import RegisterMatchCard from '../../AutoTrips/RegisterMatchCard';

/** The org's own trip register against the trips rebuilt from GPS, checked every night. */
export default function RegisterMatchReport() {
  return (
    <PageShell
      className="p-6"
      title="Trip Register Match"
      subtitle="How many trips in your own register (the oil report) the GPS trips found, plant by plant — checked every night"
    >
      <RegisterMatchCard
        defaultOpen
        empty={
          <EmptyState
            title="No trip register to compare yet"
            hint="This fills in once your trip register (the oil report) is imported; the match runs every night."
          />
        }
      />
    </PageShell>
  );
}
