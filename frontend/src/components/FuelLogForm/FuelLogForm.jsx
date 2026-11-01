import { useEffect, useId, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import DriverVehicleAssignmentService from '../../services/DriverVehicleAssignmentService';
import FuelLogService from '../../services/FuelLogService';
import ApiError from '../../errors/ApiError';
import '../../pages/MileageTracking/MileageTracking.css';
import './fuelLogForm.css';
import useLastOdometer from './useLastOdometer';
import useVehicleDriverOptions from './useVehicleDriverOptions';
import useFuelDocuments from './useFuelDocuments';
import {
  fuelEntryPayload,
  fuelOcrPatch,
  toRefuelISO,
  toRefuelLocal,
  validateFuelEntry,
} from './fuelLogFormLogic';
import VehiclePicker from './VehiclePicker';
import DriverPicker from './DriverPicker';
import PreviousLogHint from './PreviousLogHint';
import FuelFields from './FuelFields';
import DocumentSlots from './DocumentSlots';

export default function FuelLogForm({
  initialVehicleId,
  initialDriverId,
  initialLitres,
  initialRefuelTime,
  lockVehicle = false,
  lockDriver = false,
  onSuccess,
  onCancel,
}) {
  const uid = useId();
  const [selection, setSelection] = useState({
    vehicleId: null,
    driverId: null,
    driverVehicleId: null,
  });
  const [picker, setPicker] = useState({
    vehicleSearch: '',
    driverSearch: '',
    showVehicle: false,
    showDriver: false,
  });
  const [validationError, setValidationError] = useState(null);
  const [formData, setFormData] = useState(() => ({
    fillingType: '',
    litres: initialLitres == null ? '' : String(initialLitres),
    rate: '',
    odometerReading: '',
    refuelTime: toRefuelLocal(initialRefuelTime || new Date()),
  }));
  const edited = useRef(new Set(initialRefuelTime ? ['refuelTime'] : []));
  const formRef = useRef(null);
  useEffect(() => {
    const closePickers = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setPicker((prev) => ({ ...prev, showVehicle: false, showDriver: false }));
      }
    };
    document.addEventListener('click', closePickers);
    return () => document.removeEventListener('click', closePickers);
  }, []);
  const { vehicles, drivers, loading: loadingOptions } = useVehicleDriverOptions();
  const vehicleKey = selection.vehicleId ?? initialVehicleId;
  const selectedVehicle =
    vehicles.find(
      (v) =>
        v.id === vehicleKey || v.name.toUpperCase() === String(vehicleKey).trim().toUpperCase(),
    ) || null;
  const at = toRefuelISO(formData.refuelTime);
  const { data: assignment } = useApi(
    (signal) =>
      DriverVehicleAssignmentService.getActiveAssignment(
        { vehicleId: selectedVehicle.id, activeOn: at },
        { signal },
      ),
    [selectedVehicle?.id, at],
    {
      enabled: !!selectedVehicle && !!at && !lockDriver && !initialDriverId,
      scopeKey: `${selectedVehicle?.id}:${at}`,
    },
  );
  const manualDriverId =
    selection.driverVehicleId === selectedVehicle?.id ? selection.driverId : null;
  const suggestedDriverId = DriverVehicleAssignmentService.idOf(assignment?.driverId);
  const driverKey = lockDriver
    ? initialDriverId
    : manualDriverId || initialDriverId || suggestedDriverId;
  const selectedDriver = drivers.find((d) => d.id === driverKey) || null;
  const driverAutoFilled = !!selectedDriver && !manualDriverId && !initialDriverId;
  const { lastOdometer, loading: loadingLastOdometer } = useLastOdometer(selectedVehicle);
  const docs = useFuelDocuments((data, type) => {
    setFormData((prev) => ({ ...prev, ...fuelOcrPatch(data, type, edited.current) }));
  });
  const { mutate, loading: isLoading } = useMutation(FuelLogService.submitEntry);
  const busyScanning = docs.ocrScanning.fuel || docs.ocrScanning.odometer;
  const setPickerField = (name) => (value) => setPicker((prev) => ({ ...prev, [name]: value }));
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    edited.current.add(name);
    setValidationError(null);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading || busyScanning) return;
    const error = validateFuelEntry(formData, selectedVehicle, selectedDriver, lastOdometer);
    setValidationError(error);
    if (error) return;
    try {
      const created = await mutate({
        payload: fuelEntryPayload(formData, selectedVehicle, selectedDriver),
        documents: docs.fixedDocs,
      });
      if (!created) return;
      toast.success(
        'Diesel fill saved. Average mileage updates after completed full-tank cycles are processed.',
      );
      onSuccess?.(created);
    } catch (error) {
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') return;
      setValidationError(ApiError.from(error).displayMessage);
    }
  };

  return (
    <div className="mileage-form-content diesel-entry">
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <fieldset disabled={isLoading} className="diesel-entry-fields">
          <div className="mileage-form-row">
            <div className="mileage-form-group">
              <label htmlFor={`${uid}-vehicle`}>Vehicle *</label>
              <VehiclePicker
                uid={uid}
                lockVehicle={lockVehicle}
                selectedVehicle={selectedVehicle}
                loadingVehicles={loadingOptions}
                showVehicleDropdown={picker.showVehicle}
                setShowVehicleDropdown={setPickerField('showVehicle')}
                setShowDriverDropdown={setPickerField('showDriver')}
                vehicleSearch={picker.vehicleSearch}
                setVehicleSearch={setPickerField('vehicleSearch')}
                filteredVehicles={vehicles.filter((v) =>
                  `${v.name} ${v.registration}`
                    .toLowerCase()
                    .includes(picker.vehicleSearch.toLowerCase()),
                )}
                setSelectedVehicle={(v) => {
                  setSelection({ vehicleId: v.id, driverId: null, driverVehicleId: null });
                  setValidationError(null);
                }}
              />
              {selectedVehicle && (
                <PreviousLogHint
                  loadingLastOdometer={loadingLastOdometer}
                  lastOdometer={lastOdometer}
                />
              )}
            </div>
            <div className="mileage-form-group">
              <label htmlFor={`${uid}-driver`}>Driver *</label>
              <DriverPicker
                uid={uid}
                lockDriver={lockDriver}
                selectedDriver={selectedDriver}
                loadingDrivers={loadingOptions}
                showDriverDropdown={picker.showDriver}
                setShowDriverDropdown={setPickerField('showDriver')}
                setShowVehicleDropdown={setPickerField('showVehicle')}
                driverSearch={picker.driverSearch}
                setDriverSearch={setPickerField('driverSearch')}
                filteredDrivers={drivers.filter((d) =>
                  `${d.name} ${d.licenseNo}`
                    .toLowerCase()
                    .includes(picker.driverSearch.toLowerCase()),
                )}
                setSelectedDriver={(d) => {
                  setSelection((prev) => ({
                    ...prev,
                    driverId: d.id,
                    driverVehicleId: selectedVehicle?.id,
                  }));
                  setValidationError(null);
                }}
              />
              {driverAutoFilled && (
                <small>Suggested from the assignment at refuelling time. Change if needed.</small>
              )}
            </div>
          </div>
          <FuelFields uid={uid} formData={formData} handleFormChange={handleFormChange} />
          <div className="diesel-entry-help">
            <strong>How this affects mileage</strong>
            <p>
              The first full tank starts a cycle. The next full tank calculates distance ÷ diesel
              added, including partial fills between them. Record every fill.
            </p>
            <p>
              The Vehicles average updates after processing completed cycles; saving one bill does
              not immediately change it.
            </p>
          </div>
          <details className="diesel-entry-documents">
            <summary>Add a bill or odometer photo (optional)</summary>
            <p>
              Photos can fill in details for you. Check the values and refuelling time before
              saving.
            </p>
            <DocumentSlots uid={uid} formData={formData} {...docs} />
          </details>
        </fieldset>
        {validationError && (
          <p role="alert" className="diesel-entry-error">
            {validationError}
          </p>
        )}
        <div className="mileage-actions">
          <button type="button" className="mileage-btn mileage-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || busyScanning || loadingOptions}
            className="mileage-btn mileage-btn-primary"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving…
              </>
            ) : busyScanning ? (
              'Reading photo…'
            ) : (
              'Save diesel fill'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
