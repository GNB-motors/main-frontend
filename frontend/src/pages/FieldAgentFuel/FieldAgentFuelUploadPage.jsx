import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, ArrowLeft, Droplets } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';
import useApi from '../../hooks/useApi';
import PageShell from '../../components/ui/PageShell';
import { OCRService } from '../Trip/services';
import { FieldAgentFuelService } from './FieldAgentFuelService';
import SlotUpload from './SlotUpload';
import VehicleDriverPickers from './VehicleDriverPickers';
import {
  validateImageFile,
  ocrDocTypeFor,
  extractRefuelTime,
  extractDocId,
  buildDocumentFormData,
  buildFuelLogPayload,
  ocrAutofill,
} from './fuelUploadUtils';
import '../MileageTracking/MileageTracking.css'; // Reuse existing styles

const FieldAgentFuelUploadPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [lastOdometer, setLastOdometer] = useState(null);
  const [formData, setFormData] = useState({
    fuelType: 'DIESEL',
    fillingType: 'PARTIAL',
    litres: '',
    rate: '',
    odometerReading: '',
    location: '',
  });
  const [fixedDocs, setFixedDocs] = useState({ fuel: null, odometer: null });
  const [ocrScanning, setOcrScanning] = useState({ fuel: false, odometer: false });

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const {
    data: odometerResponse,
    loading: loadingLastOdometer,
    error: odometerError,
  } = useApi(
    (signal) =>
      apiClient.get(`/api/mileage/last-odometer/${selectedVehicle.id}`, {
        headers: { 'X-Org-Id': selectedVehicle.orgId?._id || selectedVehicle.orgId },
        signal,
      }),
    [
      JSON.stringify({
        vehicleId: selectedVehicle?.id,
        orgId: selectedVehicle?.orgId?._id || selectedVehicle?.orgId || null,
      }),
    ],
    { enabled: !!selectedVehicle },
  );

  useEffect(() => {
    if (!selectedVehicle) setLastOdometer(null);
  }, [selectedVehicle]);

  useEffect(() => {
    if (odometerResponse) setLastOdometer(odometerResponse.data?.data || null);
  }, [odometerResponse]);

  useEffect(() => {
    if (odometerError) console.error('Failed to fetch last odometer', odometerError);
  }, [odometerError]);

  const { data: depsResponse, error: depsError } = useApi(
    () => Promise.all([FieldAgentFuelService.getVehicles(), FieldAgentFuelService.getDrivers()]),
    [],
  );

  useEffect(() => {
    if (!depsResponse) return;
    const [vehRes, drvRes] = depsResponse;
    const vList = vehRes || [];
    setVehicles(
      vList.map((v) => ({
        id: v._id,
        name: v.registrationNumber,
        registration: `${v.vehicleType || 'N/A'}`,
        orgId: v.orgId,
      })),
    );
    const dList = drvRes || [];
    setDrivers(
      dList.map((d) => ({
        id: d._id,
        name: `${d.firstName} ${d.lastName || ''}`.trim(),
        mobileNo: d.mobileNumber || 'N/A',
        orgId: d.orgId,
      })),
    );
    setLoadingVehicles(false);
    setLoadingDrivers(false);
  }, [depsResponse]);

  useEffect(() => {
    if (depsError) {
      toast.error('Failed to load drivers and vehicles');
      setLoadingVehicles(false);
      setLoadingDrivers(false);
    }
  }, [depsError]);

  const organizations = useMemo(() => {
    const orgs = new Set();
    vehicles.forEach((v) => {
      if (v.orgId?.companyName) orgs.add(v.orgId.companyName);
    });
    return Array.from(orgs).sort();
  }, [vehicles]);

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleVehicleChange = (v) => {
    if (
      selectedVehicle &&
      (selectedVehicle.orgId?._id || selectedVehicle.orgId) !== (v.orgId?._id || v.orgId)
    ) {
      setSelectedDriver(null);
    }
    setSelectedVehicle(v);
  };

  const handleDocDrop = async (docType, files) => {
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
        // OCRService.scan uses apiClient under the hood without X-Org-Id.
        const ocrResult = await OCRService.scan(file, ocrDocTypeFor(docType));
        if (ocrResult.success) {
          const data = ocrResult.data;
          setFixedDocs((prev) => ({
            ...prev,
            [docType]: { ...prev[docType], ocrData: data, ocrStatus: 'success' },
          }));
          const { patch, toast: autofillToast } = ocrAutofill(docType, data);
          if (Object.keys(patch).length) setFormData((prev) => ({ ...prev, ...patch }));
          if (autofillToast) toast[autofillToast.type](autofillToast.message);
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
  };

  const removeDoc = (docType) => {
    setFixedDocs((prev) => ({ ...prev, [docType]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriver)
      return toast.error('Please select a vehicle and a driver.');
    if (!fixedDocs.fuel) return toast.error('Fuel Slip is required.');

    const targetOrgId = selectedVehicle.orgId?._id || selectedVehicle.orgId;
    if (!targetOrgId) return toast.error('Selected vehicle has no organization assigned.');

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
      const reqConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Org-Id': targetOrgId,
        },
        timeout: 120000,
      };

      const fuelData = buildDocumentFormData(fixedDocs.fuel, 'FUEL_SLIP', selectedVehicle.id);
      const fuelRes = await apiClient.post('/api/documents', fuelData, reqConfig);

      let odoDocId = '';
      if (fixedDocs.odometer) {
        const odoData = buildDocumentFormData(fixedDocs.odometer, 'ODOMETER', selectedVehicle.id);
        const odoRes = await apiClient.post('/api/documents', odoData, reqConfig);
        odoDocId = extractDocId(odoRes);
      }

      const payload = buildFuelLogPayload({
        formData,
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id,
        documentId: extractDocId(fuelRes),
        odometerDocId: odoDocId,
        refuelTime: extractRefuelTime(fixedDocs.fuel?.ocrData),
      });

      await apiClient.post('/api/mileage/fuel-log', payload, {
        headers: { 'X-Org-Id': targetOrgId },
        timeout: 60000,
      });

      toast.success('Mileage log submitted successfully!');
      navigate('/field-agent-fuel');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit log.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container mileage-form-page">
      <PageShell
        title="Log Fuel Entry"
        subtitle="Fill in the fuel details and upload supporting documents."
        actions={
          <>
            <button
              className="mileage-back-circle"
              onClick={() => navigate('/field-agent-fuel')}
              aria-label="Back to fuel logs"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="mileage-header-icon-badge">
              <Droplets size={22} strokeWidth={1.8} />
              <span>Fuel Log</span>
            </div>
          </>
        }
      >
        <div className="mileage-form-content">
          {organizations.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  color: '#5D5D5E',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Filter by Organization
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedOrgFilter('')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedOrgFilter === '' ? '#3b82f6' : '#f1f5f9',
                    color: selectedOrgFilter === '' ? '#fff' : '#64748b',
                    transition: 'all 0.2s',
                  }}
                >
                  All Organizations
                </button>
                {organizations.map((org) => (
                  <button
                    key={org}
                    type="button"
                    onClick={() => setSelectedOrgFilter(org)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '99px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: selectedOrgFilter === org ? '#3b82f6' : '#f1f5f9',
                      color: selectedOrgFilter === org ? '#fff' : '#64748b',
                      transition: 'all 0.2s',
                    }}
                  >
                    {org}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <VehicleDriverPickers
              vehicles={vehicles}
              drivers={drivers}
              selectedOrgFilter={selectedOrgFilter}
              loadingVehicles={loadingVehicles}
              loadingDrivers={loadingDrivers}
              selectedVehicle={selectedVehicle}
              onVehicleChange={handleVehicleChange}
              onVehicleClear={() => {
                setSelectedVehicle(null);
                setSelectedDriver(null);
              }}
              selectedDriver={selectedDriver}
              onDriverChange={setSelectedDriver}
              onDriverClear={() => setSelectedDriver(null)}
              lastOdometer={lastOdometer}
              loadingLastOdometer={loadingLastOdometer}
            />

            {/* Fuel & Filling Type */}
            <div className="mileage-form-row">
              <div className="mileage-form-group">
                <label>Fuel Type</label>
                <select name="fuelType" value={formData.fuelType} onChange={handleFormChange}>
                  <option value="DIESEL">Diesel</option>
                  <option value="ADBLUE">AdBlue</option>
                </select>
              </div>
              <div className="mileage-form-group">
                <label>Filling Type</label>
                <select name="fillingType" value={formData.fillingType} onChange={handleFormChange}>
                  <option value="PARTIAL">Partial Fill</option>
                  <option value="FULL_TANK">Full Tank (Closes Mileage Interval)</option>
                </select>
              </div>
            </div>

            {/* Litres & Rate */}
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
                <label>Rate Per Litre *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  name="rate"
                  value={formData.rate}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            {/* Odometer & Location */}
            <div className="mileage-form-row">
              {formData.fillingType === 'FULL_TANK' && (
                <div className="mileage-form-group">
                  <label>Odometer Reading (KM) (Optional)</label>
                  <input
                    type="number"
                    placeholder="105450"
                    name="odometerReading"
                    value={formData.odometerReading}
                    onChange={handleFormChange}
                  />
                </div>
              )}
              <div className="mileage-form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="E.g. Reliance Pump"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            {/* Documents */}
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
                Upload Documents
              </label>
              <div className="mileage-slots-row">
                <SlotUpload
                  docType="fuel"
                  title="FUEL RECEIPT"
                  label="fuel slip"
                  inputId="drop-fuel"
                  required
                  doc={fixedDocs.fuel}
                  isScanning={ocrScanning.fuel}
                  onDrop={handleDocDrop}
                  onRemove={removeDoc}
                />
                {formData.fillingType === 'FULL_TANK' && (
                  <SlotUpload
                    docType="odometer"
                    title="END ODOMETER IMAGE"
                    label="odometer image"
                    inputId="drop-odometer"
                    doc={fixedDocs.odometer}
                    isScanning={ocrScanning.odometer}
                    onDrop={handleDocDrop}
                    onRemove={removeDoc}
                  />
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="mileage-actions">
              <button
                type="button"
                className="mileage-btn mileage-btn-secondary"
                onClick={() => navigate('/field-agent-fuel')}
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
                  'Submit Fuel Log'
                )}
              </button>
            </div>
          </form>
        </div>
      </PageShell>
    </div>
  );
};

export default FieldAgentFuelUploadPage;
