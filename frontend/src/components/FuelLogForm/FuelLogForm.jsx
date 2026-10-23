import React, { useState, useEffect, useMemo, useCallback, useId } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { OCRService } from '../../pages/Trip/services';
import DriverVehicleAssignmentService from '../../services/DriverVehicleAssignmentService';
import FuelLogService from '../../services/FuelLogService';
import '../../pages/MileageTracking/MileageTracking.css';
import logger from '../../utils/logger';
import validateImageFile from './validateImageFile';
import useLastOdometer from './useLastOdometer';
import useVehicleDriverOptions from './useVehicleDriverOptions';
import VehiclePicker from './VehiclePicker';
import DriverPicker from './DriverPicker';
import PreviousLogHint from './PreviousLogHint';
import RouteFields from './RouteFields';
import FuelFields from './FuelFields';
import DocumentSlots from './DocumentSlots';

/* ── Reusable Fuel Log Form ── */
const FuelLogForm = ({
  initialVehicleId,
  initialDriverId,
  initialLitres,
  initialRefuelTime,
  lockVehicle = false,
  lockDriver = false,
  onSuccess,
  onCancel,
}) => {
  const uid = useId();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDest, setSelectedDest] = useState(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverAutoFilled, setDriverAutoFilled] = useState(false);
  const [driverTouchedByUser, setDriverTouchedByUser] = useState(false);
  const [lastOdometer, setLastOdometer] = useState(null);
  const [formData, setFormData] = useState({
    fuelType: 'DIESEL',
    fillingType: 'PARTIAL',
    litres: initialLitres || '',
    rate: '',
    odometerReading: '',
    location: '',
  });
  const [fixedDocs, setFixedDocs] = useState({ fuel: null, odometer: null });
  const [ocrScanning, setOcrScanning] = useState({ fuel: false, odometer: false });

  const loadingLastOdometer = useLastOdometer(selectedVehicle, setLastOdometer);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowVehicleDropdown(false);
      setShowDriverDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const depsLoading = useVehicleDriverOptions(setVehicles, setDrivers);
  const loadingVehicles = depsLoading;
  const loadingDrivers = depsLoading;

  useEffect(() => {
    if (initialVehicleId && vehicles.length) {
      const targetStr = String(initialVehicleId).trim().toUpperCase();
      const match = vehicles.find(
        (v) =>
          String(v.id) === String(initialVehicleId) ||
          (v.name && v.name.toUpperCase() === targetStr),
      );
      if (match) setSelectedVehicle(match);
    }
  }, [initialVehicleId, vehicles]);

  useEffect(() => {
    if (initialLitres != null && initialLitres !== '' && !formData.litres) {
      setFormData((prev) => ({ ...prev, litres: String(initialLitres) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLitres]);

  useEffect(() => {
    if (initialDriverId && drivers.length) {
      const match = drivers.find((d) => d.id === initialDriverId);
      if (match) setSelectedDriver(match);
    }
  }, [initialDriverId, drivers]);

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.name.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
          v.registration.toLowerCase().includes(vehicleSearch.toLowerCase()),
      ),
    [vehicleSearch, vehicles],
  );

  const filteredDrivers = useMemo(
    () =>
      drivers.filter(
        (d) =>
          d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
          d.licenseNo.toLowerCase().includes(driverSearch.toLowerCase()),
      ),
    [driverSearch, drivers],
  );

  /**
   * Suggest the vehicle's currently-assigned driver when a vehicle is picked.
   * Never overrides a driver the user already picked by hand in this form, and
   * never writes anything back — a suggestion, not a sync.
   */
  const suggestDriverForVehicle = useCallback(
    async (vehicleId) => {
      if (lockDriver || driverTouchedByUser || !vehicleId) return;
      try {
        const assignment = await DriverVehicleAssignmentService.getActiveAssignment({ vehicleId });
        if (!assignment) return;
        const suggestedId = DriverVehicleAssignmentService.idOf(assignment.driverId);
        const match = drivers.find((d) => d.id === suggestedId);
        if (match) {
          setSelectedDriver(match);
          setDriverAutoFilled(true);
        }
      } catch (err) {
        if (err?.response?.status !== 404)
          logger.warn('FuelLogForm', 'Failed to resolve active assignment', err);
      }
    },
    [lockDriver, driverTouchedByUser, drivers],
  );

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleDocDrop = useCallback(async (docType, files) => {
    if (files.length === 0) return;
    const file = files[0];
    if (!validateImageFile(file)) {
      toast.error('Valid image required (JPG, PNG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      setFixedDocs((prev) => ({
        ...prev,
        [docType]: { file, preview: e.target.result, ocrStatus: 'scanning' },
      }));
      setOcrScanning((prev) => ({ ...prev, [docType]: true }));
      try {
        const ocrDocType = docType === 'odometer' ? 'ODOMETER' : 'FUEL_RECEIPT';
        const ocrResult = await OCRService.scan(file, ocrDocType);
        if (ocrResult.success) {
          const data = ocrResult.data;
          setFixedDocs((prev) => ({
            ...prev,
            [docType]: { ...prev[docType], ocrData: data, ocrStatus: 'success' },
          }));
          if (docType === 'fuel' && data.volume) {
            setFormData((prev) => ({
              ...prev,
              litres: data.volume,
              rate: data.rate || prev.rate,
              location: data.location || prev.location,
            }));
            toast.success(`Autofilled Volume: ${data.volume}L`);
          } else if (docType === 'odometer' && data.reading) {
            const numericReading = parseFloat(data.reading.toString().replace(/[^\d.]/g, ''));
            if (!isNaN(numericReading)) {
              setFormData((prev) => ({ ...prev, odometerReading: numericReading }));
              toast.success(`Autofilled Odometer: ${numericReading}`);
            } else {
              toast.warning(`Could not parse odometer value. Please enter manually.`);
            }
          }
        } else {
          setFixedDocs((prev) => ({
            ...prev,
            [docType]: { ...prev[docType], ocrStatus: 'error' },
          }));
          toast.warning(`OCR Failed. Please enter values manually.`);
        }
      } catch {
        setFixedDocs((prev) => ({ ...prev, [docType]: { ...prev[docType], ocrStatus: 'error' } }));
      } finally {
        setOcrScanning((prev) => ({ ...prev, [docType]: false }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const removeDoc = useCallback((docType) => {
    setFixedDocs((prev) => ({ ...prev, [docType]: null }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriver)
      return toast.error('Please select a vehicle and a driver.');
    if (!fixedDocs.fuel) return toast.error('Fuel Slip is required.');
    const currentOdo = parseFloat(formData.odometerReading);
    if (
      formData.fillingType === 'FULL_TANK' &&
      !isNaN(currentOdo) &&
      lastOdometer &&
      lastOdometer.odometerReading
    ) {
      if (currentOdo <= lastOdometer.odometerReading)
        return toast.error(
          `Odometer reading must be strictly greater than the previous reading (${lastOdometer.odometerReading} km)`,
        );
    }
    setIsLoading(true);
    try {
      const fuelData = new FormData();
      fuelData.append('file', fixedDocs.fuel.file);
      fuelData.append('docType', 'FUEL_SLIP');
      fuelData.append('entityType', 'VEHICLE');
      fuelData.append('entityId', selectedVehicle.id);
      if (fixedDocs.fuel.ocrData)
        fuelData.append('ocrData', JSON.stringify(fixedDocs.fuel.ocrData));

      const fuelDoc = await FuelLogService.uploadDocument(fuelData);
      let odoDocId = '';
      if (fixedDocs.odometer) {
        const odoData = new FormData();
        odoData.append('file', fixedDocs.odometer.file);
        odoData.append('docType', 'ODOMETER');
        odoData.append('entityType', 'VEHICLE');
        odoData.append('entityId', selectedVehicle.id);
        if (fixedDocs.odometer.ocrData)
          odoData.append('ocrData', JSON.stringify(fixedDocs.odometer.ocrData));

        const odoDoc = await FuelLogService.uploadDocument(odoData);
        odoDocId = odoDoc.data?._id || odoDoc._id || '';
      }
      let refuelTimeStr = initialRefuelTime;
      const ocrDatetime =
        fixedDocs.fuel?.ocrData?.datetime || fixedDocs.fuel?.ocrData?.extractedData?.datetime;
      if (ocrDatetime) {
        const parsed = new Date(String(ocrDatetime).trim().replace(' ', 'T') + '+05:30');
        if (!isNaN(parsed.getTime())) {
          refuelTimeStr = parsed.toISOString();
        }
      }

      const payload = {
        ...formData,
        fuelType: 'DIESEL',
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id,
        documentId: fuelDoc.data?._id || fuelDoc._id || '',
        ...(odoDocId && { odometerDocId: odoDocId }),
        litres: parseFloat(formData.litres),
        rate: parseFloat(formData.rate),
        odometerReading: formData.odometerReading
          ? parseFloat(formData.odometerReading)
          : undefined,
        location: formData.location ? formData.location : undefined,
        ...(selectedSource && { routeSource: selectedSource.id }),
        ...(selectedDest && { routeDestination: selectedDest.id }),
        ...(refuelTimeStr && { refuelTime: refuelTimeStr }),
      };
      const created = await FuelLogService.createFuelLog(payload);
      toast.success('Mileage log submitted successfully!');
      onSuccess?.(created);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit log.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="mileage-form-content">
      <form onSubmit={handleSubmit}>
        {/* Vehicle & Driver */}
        <div className="mileage-form-row">
          <div className="mileage-form-group">
            <label htmlFor={`${uid}-vehicle`}>Select Vehicle *</label>
            <VehiclePicker
              uid={uid}
              lockVehicle={lockVehicle}
              selectedVehicle={selectedVehicle}
              loadingVehicles={loadingVehicles}
              showVehicleDropdown={showVehicleDropdown}
              setShowVehicleDropdown={setShowVehicleDropdown}
              setShowDriverDropdown={setShowDriverDropdown}
              vehicleSearch={vehicleSearch}
              setVehicleSearch={setVehicleSearch}
              filteredVehicles={filteredVehicles}
              setSelectedVehicle={setSelectedVehicle}
              suggestDriverForVehicle={suggestDriverForVehicle}
            />
            {selectedVehicle && (
              <PreviousLogHint
                loadingLastOdometer={loadingLastOdometer}
                lastOdometer={lastOdometer}
              />
            )}
          </div>
          <div className="mileage-form-group">
            <label htmlFor={`${uid}-driver`}>Select Driver *</label>
            <DriverPicker
              uid={uid}
              lockDriver={lockDriver}
              selectedDriver={selectedDriver}
              loadingDrivers={loadingDrivers}
              showDriverDropdown={showDriverDropdown}
              setShowDriverDropdown={setShowDriverDropdown}
              setShowVehicleDropdown={setShowVehicleDropdown}
              driverSearch={driverSearch}
              setDriverSearch={setDriverSearch}
              filteredDrivers={filteredDrivers}
              setSelectedDriver={setSelectedDriver}
              setDriverTouchedByUser={setDriverTouchedByUser}
              setDriverAutoFilled={setDriverAutoFilled}
            />
            {driverAutoFilled && !lockDriver && (
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Auto-filled from vehicle&apos;s assigned driver — change if a different driver made
                this trip.
              </div>
            )}
          </div>
        </div>

        {/* Source & Destination */}
        <RouteFields
          uid={uid}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          selectedDest={selectedDest}
          setSelectedDest={setSelectedDest}
        />

        <FuelFields uid={uid} formData={formData} handleFormChange={handleFormChange} />

        {/* Documents */}
        <DocumentSlots
          formData={formData}
          fixedDocs={fixedDocs}
          ocrScanning={ocrScanning}
          handleDocDrop={handleDocDrop}
          removeDoc={removeDoc}
        />

        {/* Submit */}
        <div className="mileage-actions">
          <button type="button" className="mileage-btn mileage-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="mileage-btn mileage-btn-primary">
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Submitting
              </>
            ) : (
              'Submit Fuel Log'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FuelLogForm;
