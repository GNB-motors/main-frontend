import { useEffect, useState } from 'react';
import { getVehicleList } from '../../services/vehicleListService';
import DriverVehicleAssignmentService from '../../services/DriverVehicleAssignmentService';
import logger from '../../utils/logger';

export default function useFleetMasterData() {
  const [vehiclesMeta, setVehiclesMeta] = useState({});
  const [driverAssignments, setDriverAssignments] = useState({});

  // Fetch Vehicles Master Metadata
  useEffect(() => {
    const controller = new AbortController();
    const loadMeta = async () => {
      try {
        const list = await getVehicleList({ signal: controller.signal });
        if (controller.signal.aborted) return;
        const metaMap = {};
        list.forEach((v) => {
          if (v.registrationNumber) {
            metaMap[v.registrationNumber.toUpperCase().replace(/\s+/g, '')] = v;
            metaMap[v.registrationNumber] = v;
          }
          if (v.chassisNumber) {
            metaMap[v.chassisNumber] = v;
          }
        });
        setVehiclesMeta(metaMap);
      } catch (err) {
        if (!controller.signal.aborted) {
          logger.warn('LiveTrackingPage', 'Could not load vehicles metadata', err);
        }
      }
    };
    loadMeta();
    return () => controller.abort();
  }, []);

  // Fetch Active Driver ↔ Vehicle Assignments
  useEffect(() => {
    const controller = new AbortController();
    const loadAssignments = async () => {
      try {
        const res = await DriverVehicleAssignmentService.getAssignments(
          {},
          { signal: controller.signal },
        );
        const list = Array.isArray(res) ? res : res?.items || res?.records || [];
        if (controller.signal.aborted) return;
        const map = {};
        list.forEach((a) => {
          const vehReg = (a.vehicleId?.registrationNumber || a.registrationNumber || '')
            .toUpperCase()
            .trim();
          const vehId = a.vehicleId?._id || a.vehicleId;
          if (vehReg) {
            map[vehReg.replace(/\s+/g, '')] = a;
            map[vehReg] = a;
          }
          if (vehId && typeof vehId === 'string') {
            map[vehId] = a;
          }
        });
        setDriverAssignments(map);
      } catch (err) {
        if (!controller.signal.aborted) {
          logger.warn('LiveTrackingPage', 'Could not load driver vehicle assignments', err);
        }
      }
    };
    loadAssignments();
    return () => controller.abort();
  }, []);

  return { vehiclesMeta, driverAssignments };
}
