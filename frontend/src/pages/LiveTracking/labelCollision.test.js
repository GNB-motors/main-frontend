import { expect, it } from 'vitest';
import { visibleVehicleLabels } from './labelCollision.js';
it('retains selected then moving and the most recent when labels overlap', () => {
  const trucks = [{ id: 'stopped', status: 'stopped', ago: 1, x: 0 }, { id: 'moving', status: 'moving', ago: 5, x: 5 }, { id: 'recent', status: 'moving', ago: 1, x: 6 }, { id: 'selected', status: 'offline', x: 0 }, { id: 'apart', status: 'offline', x: 200 }];
  expect([...visibleVehicleLabels(trucks, 'selected', v => ({ x: v.x, y: 0 }))]).toEqual(['selected', 'apart']);
  expect([...visibleVehicleLabels(trucks, null, v => ({ x: v.x, y: 0 }))]).toEqual(['recent', 'apart']);
});
