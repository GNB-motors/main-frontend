import { toast } from 'react-toastify';
import { Plus, RefreshCw } from 'lucide-react';
import NewButton from '../../../components/ui/NewButton';

const ServiceIntelligenceActions = ({
  isAlerts,
  isService,
  alertsRefreshing,
  setAlertsRefreshing,
  setAlertsRefreshKey,
  goToAdd,
}) =>
  isAlerts ? (
    <NewButton
      variant="secondary"
      type="button"
      text="Refresh Alerts"
      prependIcon={<RefreshCw size={15} className={alertsRefreshing ? 'spin-anim' : ''} />}
      onClick={() => {
        setAlertsRefreshing(true);
        setAlertsRefreshKey((prev) => prev + 1);
        setTimeout(() => setAlertsRefreshing(false), 600);
        toast.info('Refreshing fleet alerts…');
      }}
    />
  ) : (
    <NewButton
      variant="primary"
      type="button"
      text={isService ? 'Add Service' : 'Add Repair'}
      prependIcon={<Plus size={16} />}
      onClick={goToAdd}
    />
  );

export default ServiceIntelligenceActions;
