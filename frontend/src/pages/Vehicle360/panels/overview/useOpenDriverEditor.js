import { useNavigate } from 'react-router-dom';
import { useMutation } from '@/hooks/useMutation';
import { DriverService } from '@/pages/Drivers/DriverService';
import { normalizeDriver } from '@/pages/Drivers/driverList';
import { getProfileField } from '@/utils/session';

/**
 * Opens a truck's assigned driver in the employee editor, the same page the
 * Employees list opens, where the driver's truck is also changed.
 *
 * The truck page only knows the driver's id, name and phone, and the editor
 * needs the full employee record, so it is found through the employee search
 * (phone first: names repeat) and matched on the id. If it cannot be found the
 * Employees list opens instead of a dead end.
 */
export default function useOpenDriverEditor() {
  const navigate = useNavigate();
  const { mutate, loading } = useMutation(async (driver) => {
    const id = String(driver?.id ?? driver?._id ?? '');
    const search = driver?.mobileNumber || driver?.name;
    if (!id || !search) return null;
    const { data } = await DriverService.getAllDrivers(getProfileField('business_ref_id') || null, {
      search,
      limit: 50,
    });
    const match = (data || []).find((row) => String(row?._id ?? row?.id) === id);
    return match ? normalizeDriver(match) : null;
  });

  const openDriver = async (driver) => {
    const found = await mutate(driver).catch(() => null);
    if (found) navigate('/drivers/add', { state: { editingDriver: found } });
    else navigate('/drivers');
  };

  return { openDriver, opening: loading };
}
