import { useEffect, useState } from 'react';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import RoadService from '../../services/RoadService.js';
import { buildPassiveTrail } from './passiveTrailModel.js';

export default function usePassiveTrail(id, plate, enabled) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    setResult(null);
    if (!id || !plate || !enabled) return undefined;
    const controller = new AbortController();
    const to = new Date();
    const window = { from: new Date(to.getTime() - 6 * 3600000).toISOString(), to: to.toISOString() };
    (async () => {
      try {
        const data = await LiveTrackingService.getTrail(plate, { ...window, limit: 10000 }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const road = await RoadService.getRoadTrailIfEnabled(plate, window, controller.signal);
        if (!controller.signal.aborted) setResult({ id, ...buildPassiveTrail(data.points, road) });
      } catch { if (!controller.signal.aborted) setResult(null); }
    })();
    return () => controller.abort();
  }, [id, plate, enabled]);
  return enabled && id && result?.id === id ? result : null;
}
