import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Droplet, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';
import { TripService, OCRService } from '../Trip/services';
import PageShell from '../../components/ui/PageShell';
import { SlotUpload } from './AdBlueSlotUpload';
import { SearchableEntityDropdown } from './SearchableEntityDropdown';
import { validateImageFile } from './adBlueLogUtils';
import './MileageTracking.css';

const AdBlueLogPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [formData, setFormData] = useState({ litres: '', amount: '', place: '' });
  const [receipt, setReceipt] = useState(null);
  const [ocrScanning, setOcrScanning] = useState(false);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowVehicleDropdown(false);
      setShowDriverDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const vehRes = await TripService.getVehicles({ limit: 100 });
        const drvRes = await TripService.getDrivers({ limit: 100 });
        setVehicles(
          (vehRes?.data || []).map((v) => ({
            id: v._id,
            name: v.registrationNumber,
            registration: `${v.vehicleType} - ${v.model || 'N/A'}`,
          })),
        );
        setDrivers(
          (drvRes?.data || []).map((d) => ({
            id: d._id,
            name: `${d.firstName} ${d.lastName || ''}`.trim(),
            licenseNo: d.licenseNo || 'N/A',
          })),
        );
      } catch {
        toast.error('Failed to load drivers and vehicles');
      } finally {
        setLoadingVehicles(false);
        setLoadingDrivers(false);
      }
    };
    fetchDeps();
  }, []);

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

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleDocDrop = useCallback(async (files) => {
    if (!files.length) return;
    const file = files[0];
    if (!validateImageFile(file)) {
      toast.error('Valid image required (JPG, PNG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      setReceipt({ file, preview: e.target.result, ocrStatus: 'scanning' });
      setOcrScanning(true);
      try {
        const ocrResult = await OCRService.scan(file, 'FUEL_RECEIPT');
        if (ocrResult.success) {
          const data = ocrResult.data || {};
          setReceipt((prev) => ({ ...prev, ocrData: data, ocrStatus: 'success' }));
          setFormData((prev) => ({
            ...prev,
            litres: data.volume ?? prev.litres,
            amount:
              data.amount ??
              (data.volume && data.rate ? Number(data.volume) * Number(data.rate) : prev.amount),
            place: data.location || prev.place,
          }));
          if (data.volume) toast.success(`Autofilled Volume: ${data.volume}L`);
        } else {
          setReceipt((prev) => ({ ...prev, ocrStatus: 'error' }));
          toast.warning('OCR failed. Enter values manually.');
        }
      } catch {
        setReceipt((prev) => ({ ...prev, ocrStatus: 'skipped' }));
      } finally {
        setOcrScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriver)
      return toast.error('Please select a vehicle and a driver.');
    if (formData.litres === '' || formData.amount === '')
      return toast.error('Litres and amount are required.');

    setIsLoading(true);
    try {
      let documentId;
      if (receipt?.file) {
        const receiptData = new FormData();
        receiptData.append('file', receipt.file);
        receiptData.append('docType', 'FUEL_SLIP');
        receiptData.append('entityType', 'VEHICLE');
        receiptData.append('entityId', selectedVehicle.id);
        if (receipt.ocrData) receiptData.append('ocrData', JSON.stringify(receipt.ocrData));
        const receiptRes = await apiClient.post('/api/documents', receiptData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });
        documentId = receiptRes.data.data?._id || receiptRes.data._id;
      }

      const payload = {
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id,
        litres: parseFloat(formData.litres),
        amount: parseFloat(formData.amount),
        ...(formData.place?.trim() && { place: formData.place.trim() }),
        ...(documentId && { documentId }),
      };

      await apiClient.post('/api/adblue-logs', payload, { timeout: 60000 });
      toast.success('AdBlue entry saved');
      navigate('/adblue-tracking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit AdBlue entry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container mileage-form-page">
      <PageShell
        title="Log AdBlue Entry"
        subtitle="Record AdBlue top-ups. Proof upload is optional."
        actions={
          <>
            <button
              type="button"
              className="mileage-back-circle"
              onClick={() => navigate('/adblue-tracking')}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="mileage-header-icon-badge">
              <Droplet size={22} strokeWidth={1.8} />
              <span>AdBlue</span>
            </div>
          </>
        }
      >
        <div className="mileage-form-content">
          <form onSubmit={handleSubmit}>
            <div className="mileage-form-row">
              <SearchableEntityDropdown
                label="Select Vehicle *"
                placeholder="Choose vehicle..."
                loadingLabel="Loading..."
                loading={loadingVehicles}
                items={filteredVehicles}
                selected={selectedVehicle}
                onSelect={(v) => {
                  setSelectedVehicle(v);
                  setShowVehicleDropdown(false);
                }}
                searchValue={vehicleSearch}
                onSearchChange={setVehicleSearch}
                searchPlaceholder="Search vehicle..."
                open={showVehicleDropdown}
                onToggle={() => {
                  setShowVehicleDropdown(!showVehicleDropdown);
                  setShowDriverDropdown(false);
                }}
                renderItem={(v) => ({ main: v.name, sub: v.registration })}
              />
              <SearchableEntityDropdown
                label="Select Driver *"
                placeholder="Choose driver..."
                loadingLabel="Loading..."
                loading={loadingDrivers}
                items={filteredDrivers}
                selected={selectedDriver}
                onSelect={(d) => {
                  setSelectedDriver(d);
                  setShowDriverDropdown(false);
                }}
                searchValue={driverSearch}
                onSearchChange={setDriverSearch}
                searchPlaceholder="Search driver..."
                open={showDriverDropdown}
                onToggle={() => {
                  setShowDriverDropdown(!showDriverDropdown);
                  setShowVehicleDropdown(false);
                }}
                renderItem={(d) => ({ main: d.name, sub: d.licenseNo })}
              />
            </div>

            <div className="mileage-form-row">
              <div className="mileage-form-group">
                <label>Litres *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  name="litres"
                  value={formData.litres}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="mileage-form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="mileage-form-row">
              <div className="mileage-form-group">
                <label>Place</label>
                <input
                  type="text"
                  placeholder="Where was AdBlue added?"
                  name="place"
                  value={formData.place}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 12,
                  color: '#5D5D5E',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Upload Proof / Receipt
              </label>
              <div className="mileage-slots-row">
                <SlotUpload
                  title="ADBLUE RECEIPT"
                  label="AdBlue slip"
                  inputId="drop-adblue"
                  doc={receipt}
                  isScanning={ocrScanning}
                  onDrop={handleDocDrop}
                  onRemove={() => setReceipt(null)}
                />
              </div>
            </div>

            <div className="mileage-actions">
              <button
                type="button"
                className="mileage-btn mileage-btn-secondary"
                onClick={() => navigate('/adblue-tracking')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="mileage-btn mileage-btn-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />{' '}
                    Submitting
                  </>
                ) : (
                  'Submit AdBlue'
                )}
              </button>
            </div>
          </form>
        </div>
      </PageShell>
    </div>
  );
};

export default AdBlueLogPage;
